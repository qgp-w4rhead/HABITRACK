import { ref, computed, watch } from 'vue'
import type { Habit, HabitInput, RepeatRate } from '@/types/habit'
import { randomAccentColor, getHabitName } from '@/types/habit'
import { api } from '@/lib/api'
import { useProfile } from '@/composables/useProfile'
import { useSettings } from '@/composables/useSettings'

const SCHEMA_VERSION = 4
const LEGACY_KEY = 'habitrack_habits'

interface HabitsFile {
  v: number
  habits: Habit[]
}

interface RemoteHabit extends Habit {
  profileId?: string
  deleted?: boolean
  serverUpdatedAt?: string
}

const { currentProfileId } = useProfile()
const { settings } = useSettings()

const habitsKey = (pid: string) => `habitrack_habits_${pid}`
const tombstonesKey = (pid: string) => `habitrack_tombstones_${pid}`
const lastSyncKey = (pid: string) => `habitrack_lastsync_${pid}`

// Defaults for fields added after a habit was saved. When you add a field to
// Habit, bump SCHEMA_VERSION and give the field a default here so old saves
// upgrade instead of breaking.
function migrateHabit(h: Habit): Habit {
  return {
    ...h,
    jokers: h.jokers ?? 0,
    overflowType: h.overflowType ?? h.type ?? 'positive',
    trackingMode: h.trackingMode ?? 'peg',
    startDate: h.startDate ?? '',
    endDate: h.endDate ?? '',
    pegTimestamps: h.pegTimestamps ?? [],
    updatedAt: h.updatedAt ?? h.createdAt ?? new Date().toISOString(),
    goalKind: h.goalKind ?? 'singular',
    repeatRate: h.repeatRate ?? null,
    periodStart: h.periodStart ?? h.createdAt ?? new Date().toISOString(),
    history: h.history ?? [],
    completedAt: h.completedAt ?? null,
  }
}

// Stash an unreadable payload aside so a later save can't overwrite the only copy.
function backupCorrupt(key: string, raw: string) {
  try {
    localStorage.setItem(`${key}_corrupt_${Date.now()}`, raw)
  } catch { /* quota ; nothing more we can do */ }
}

// Reads both the versioned envelope and the pre-envelope bare array, so it can
// parse the legacy global key during one-time migration.
function parseHabits(raw: string): Habit[] {
  const parsed = JSON.parse(raw) as Habit[] | HabitsFile
  const list = Array.isArray(parsed) ? parsed : parsed.habits ?? []
  return list.map(migrateHabit)
}

function loadHabits(pid: string): Habit[] {
  let raw = localStorage.getItem(habitsKey(pid))
  // One-time migration of the pre-profile global store into the first profile
  // that loads. The legacy key is consumed so later profiles start empty.
  if (raw === null) {
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy !== null) {
      raw = legacy
      localStorage.setItem(habitsKey(pid), legacy)
      localStorage.removeItem(LEGACY_KEY)
    }
  }
  if (raw === null) return []
  try {
    return parseHabits(raw)
  } catch {
    backupCorrupt(habitsKey(pid), raw)
    return []
  }
}

function saveHabits(pid: string, list: Habit[]) {
  const file: HabitsFile = { v: SCHEMA_VERSION, habits: list }
  localStorage.setItem(habitsKey(pid), JSON.stringify(file))
}

function loadTombstones(pid: string): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(tombstonesKey(pid)) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : []
  } catch {
    return []
  }
}

function saveTombstones(pid: string, ids: string[]) {
  localStorage.setItem(tombstonesKey(pid), JSON.stringify(ids))
}

const habits = ref<Habit[]>([])
let loadedPid: string | null = null
let applyingRemote = false

// Sync state is declared up here: the watchers below run synchronously at
// module init (immediate) and can reach syncNow/scheduleSync right away.
const lastSync = ref<string | null>(null)
const syncing = ref(false)
let syncTimer: ReturnType<typeof setTimeout> | null = null

// Covers the 0.6s row-grow leave (--anim-slow) so the board fully deloads
// before the incoming profile's rows mount.
const SWAP_MS = 650
const switching = ref(false)
let swapTimer: ReturnType<typeof setTimeout> | null = null

watch(currentProfileId, (pid, prevPid) => {
  if (!pid) return
  if (swapTimer) clearTimeout(swapTimer)
  const hadRows = habits.value.length > 0
  // Null the save target before clearing so the habits watcher can't write
  // an empty list over the outgoing profile's storage.
  loadedPid = null
  switching.value = true
  habits.value = []
  const load = () => {
    swapTimer = null
    loadedPid = pid
    habits.value = loadHabits(pid)
    refreshHabitStates()
    switching.value = false
    syncNow()
  }
  // Nothing to deload on init or from an empty profile ; skip the buffer.
  if (prevPid === undefined || !hadRows) load()
  else swapTimer = setTimeout(load, SWAP_MS)
}, { immediate: true })

watch(habits, (val) => {
  if (!loadedPid) return
  saveHabits(loadedPid, val)
  if (!applyingRemote) scheduleSync()
}, { deep: true })

const activeHabits = computed(() => habits.value.filter(h => h.active))

function touch(habit: Habit) {
  habit.updatedAt = new Date().toISOString()
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

// --- Periods & completion ---------------------------------------------------
// Repetitive habits anchor the open period by its start instant. Resets are
// lazy: reads and mutations reconcile periodStart against the period that
// should be open right now, archiving closed periods into history.

function periodStartFor(rate: RepeatRate, now = new Date()): Date {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  if (rate === 'daily') return d
  if (rate === 'monthly') {
    d.setDate(1)
    return d
  }
  // weekly ; most recent week-start day per the user's calendar setting
  const weekStartDay = settings.value.calendar.weekStart === 'monday' ? 1 : 0
  d.setDate(d.getDate() - ((d.getDay() - weekStartDay + 7) % 7))
  return d
}

function nextPeriodStart(rate: RepeatRate, from: Date): Date {
  const d = new Date(from)
  if (rate === 'daily') d.setDate(d.getDate() + 1)
  else if (rate === 'weekly') d.setDate(d.getDate() + 7)
  else d.setMonth(d.getMonth() + 1)
  d.setHours(0, 0, 0, 0)
  return d
}

// Success test, mirroring what the board renders:
// positive ; jokers pre-fill the last holes, so goal - jokers pegs suffice
// negative ; drops fill the joker gauge then the board; past goal + jokers = over
function countMetGoal(habit: Pick<Habit, 'type' | 'goal' | 'jokers'>, count: number): boolean {
  return habit.type === 'negative'
    ? count <= habit.goal + habit.jokers
    : count >= Math.max(1, habit.goal - habit.jokers)
}

function ensureCurrentPeriod(habit: Habit, now = new Date()) {
  if (!habit.active || habit.goalKind !== 'repetitive' || !habit.repeatRate) return
  const expected = periodStartFor(habit.repeatRate, now).getTime()
  const start = new Date(habit.periodStart).getTime()
  // Corrupt or future anchors snap back to the real boundary; the count survives.
  if (Number.isNaN(start) || start > expected) {
    habit.periodStart = new Date(expected).toISOString()
    touch(habit)
    return
  }
  if (start === expected) return
  // One iteration per missed period: the open count is archived on the first
  // rollover, then further missed periods close empty at 0. The final record
  // clamps to `expected` so a misaligned anchor re-aligns after one rollover.
  let cursor = start
  do {
    const next = nextPeriodStart(habit.repeatRate, new Date(cursor))
    const end = Math.min(next.getTime(), expected)
    habit.history.push({
      start: new Date(cursor).toISOString(),
      end: new Date(end).toISOString(),
      finalCount: habit.currentCount,
      metGoal: countMetGoal(habit, habit.currentCount),
    })
    habit.currentCount = 0
    habit.pegTimestamps = []
    cursor = next.getTime()
  } while (cursor < expected)
  habit.periodStart = new Date(expected).toISOString()
  touch(habit)
}

// Marks singular goals complete when the count crosses the success threshold;
// clears the mark if the count drops back under.
function updateCompletion(habit: Habit) {
  const met = habit.goalKind === 'singular' && countMetGoal(habit, habit.currentCount)
  if (met && habit.completedAt === null) {
    habit.completedAt = new Date().toISOString()
    touch(habit)
  } else if (!met && habit.completedAt !== null) {
    habit.completedAt = null
    touch(habit)
  }
}

function refreshHabitStates(now = new Date()) {
  for (const h of habits.value) {
    ensureCurrentPeriod(h, now)
    updateCompletion(h)
  }
}

function findSimilarNames(name: string, excludeId?: string): Habit[] {
  const lower = name.toLowerCase().trim()
  return habits.value.filter(h =>
    h.id !== excludeId &&
    getHabitName(h).toLowerCase().includes(lower) ||
    lower.includes(getHabitName(h).toLowerCase())
  )
}

function addHabit(input: HabitInput): { habit: Habit; similar: Habit[] } {
  const similar = findSimilarNames(input.name)
  const now = new Date().toISOString()
  const habit: Habit = {
    id: generateId(),
    initial_name: input.name,
    renamed: null,
    description: input.description,
    condition: input.condition,
    goal: input.goal,
    jokers: input.jokers,
    currentCount: 0,
    pegTimestamps: [],
    type: input.type,
    overflowType: input.overflowType,
    trackingMode: input.trackingMode,
    accentColor: randomAccentColor(),
    active: true,
    cheatPeriods: [],
    createdAt: now,
    updatedAt: now,
    startDate: input.startDate || '',
    endDate: input.endDate || '',
    goalKind: input.goalKind,
    repeatRate: input.goalKind === 'repetitive' ? input.repeatRate : null,
    periodStart: input.goalKind === 'repetitive' && input.repeatRate
      ? periodStartFor(input.repeatRate).toISOString()
      : now,
    history: [],
    completedAt: null,
  }
  habits.value.push(habit)
  return { habit, similar }
}

function removeHabit(id: string) {
  const idx = habits.value.findIndex(h => h.id === id)
  if (idx === -1 || !loadedPid) return
  habits.value.splice(idx, 1)
  const tombstones = loadTombstones(loadedPid)
  if (!tombstones.includes(id)) {
    tombstones.push(id)
    saveTombstones(loadedPid, tombstones)
  }
}

function deactivateHabit(id: string) {
  const habit = habits.value.find(h => h.id === id)
  if (habit) {
    habit.active = false
    touch(habit)
  }
}

function reactivateHabit(id: string) {
  const habit = habits.value.find(h => h.id === id)
  if (habit) {
    habit.active = true
    habit.currentCount = 0
    habit.pegTimestamps = []
    habit.completedAt = null
    if (habit.goalKind === 'repetitive' && habit.repeatRate) {
      habit.periodStart = periodStartFor(habit.repeatRate).toISOString()
    }
    touch(habit)
  }
}

function reactivateByName(name: string): Habit | null {
  const lower = name.toLowerCase().trim()
  const existing = habits.value.find(h =>
    !h.active && getHabitName(h).toLowerCase() === lower
  )
  if (existing) {
    existing.active = true
    existing.currentCount = 0
    existing.pegTimestamps = []
    existing.completedAt = null
    if (existing.goalKind === 'repetitive' && existing.repeatRate) {
      existing.periodStart = periodStartFor(existing.repeatRate).toISOString()
    }
    touch(existing)
    return existing
  }
  return null
}

function updateHabit(id: string, updates: Partial<Pick<Habit, 'renamed' | 'description' | 'condition' | 'goal' | 'jokers' | 'type' | 'overflowType' | 'trackingMode' | 'accentColor' | 'startDate' | 'endDate' | 'goalKind' | 'repeatRate'>>) {
  const habit = habits.value.find(h => h.id === id)
  if (!habit) return
  const cadenceChanged =
    (updates.goalKind !== undefined && updates.goalKind !== habit.goalKind) ||
    (updates.repeatRate !== undefined && updates.repeatRate !== habit.repeatRate)
  Object.assign(habit, updates)
  if (habit.goalKind !== 'repetitive') habit.repeatRate = null
  // Re-anchor the open period on cadence changes; the count carries over.
  if (cadenceChanged && habit.goalKind === 'repetitive' && habit.repeatRate) {
    habit.periodStart = periodStartFor(habit.repeatRate).toISOString()
  }
  updateCompletion(habit)
  touch(habit)
}

// Append `n` drop timestamps ending at the current count. Pads with nulls so
// indices stay aligned with peg order for habits predating timestamp tracking.
function recordDrops(habit: Habit, n: number) {
  const ts = habit.pegTimestamps
  while (ts.length < habit.currentCount - n) ts.push(null)
  const now = new Date().toISOString()
  for (let i = 0; i < n; i++) ts.push(now)
}

// Drop the most recent timestamps after a decrement (removes the last pegs).
function trimDrops(habit: Habit) {
  habit.pegTimestamps.length = Math.min(habit.pegTimestamps.length, habit.currentCount)
}

function incrementPeg(id: string) {
  const habit = habits.value.find(h => h.id === id)
  if (!habit) return
  ensureCurrentPeriod(habit)
  habit.currentCount++
  recordDrops(habit, 1)
  updateCompletion(habit)
  touch(habit)
}

function addGaugeValue(id: string, value: number) {
  const habit = habits.value.find(h => h.id === id)
  if (!habit) return
  ensureCurrentPeriod(habit)
  const next = Math.max(0, habit.currentCount + value)
  const diff = next - habit.currentCount
  habit.currentCount = next
  if (diff > 0) recordDrops(habit, diff)
  else if (diff < 0) trimDrops(habit)
  updateCompletion(habit)
  touch(habit)
}

function decrementPeg(id: string) {
  const habit = habits.value.find(h => h.id === id)
  if (!habit) return
  ensureCurrentPeriod(habit)
  if (habit.currentCount > 0) {
    habit.currentCount--
    trimDrops(habit)
    updateCompletion(habit)
    touch(habit)
  }
}

function addCheatPeriod(id: string, start: string, end: string) {
  const habit = habits.value.find(h => h.id === id)
  if (habit) {
    habit.cheatPeriods.push({ id: generateId(), start, end })
    touch(habit)
  }
}

function removeCheatPeriod(habitId: string, periodId: string) {
  const habit = habits.value.find(h => h.id === habitId)
  if (habit) {
    habit.cheatPeriods = habit.cheatPeriods.filter(p => p.id !== periodId)
    touch(habit)
  }
}

function isInCheatPeriod(habit: Habit): boolean {
  const now = new Date()
  return habit.cheatPeriods.some(p => {
    const start = new Date(p.start)
    const end = new Date(p.end)
    return now >= start && now <= end
  })
}

// --- Sync -----------------------------------------------------------------
// Push-all + pull-since, last write wins per habit by updatedAt. Deletes go
// through tombstones so they propagate to other devices. Server responses
// carry serverTime so `since` cursors use the server's clock, not ours.

function scheduleSync() {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(syncNow, 1500)
}

async function syncNow() {
  const pid = currentProfileId.value
  if (!pid || syncing.value || switching.value || !navigator.onLine) return
  syncing.value = true
  try {
    const tombstones = loadTombstones(pid)
    const push = await api.post<{ serverTime: string }>(
      `/profiles/${pid}/habits/push`,
      { upserts: habits.value, deletes: tombstones },
    )
    if (currentProfileId.value !== pid) return
    if (tombstones.length) {
      saveTombstones(pid, loadTombstones(pid).filter(id => !tombstones.includes(id)))
    }

    const since = localStorage.getItem(lastSyncKey(pid))
    const pull = await api.get<{ habits: RemoteHabit[]; serverTime: string }>(
      `/profiles/${pid}/habits${since ? `?since=${encodeURIComponent(since)}` : ''}`,
    )
    if (currentProfileId.value !== pid) return
    mergeRemote(pull.habits)
    refreshHabitStates()
    localStorage.setItem(lastSyncKey(pid), pull.serverTime ?? push.serverTime)
    lastSync.value = pull.serverTime ?? push.serverTime
  } catch {
    // offline or server down ; local store stays authoritative
  } finally {
    syncing.value = false
  }
}

function mergeRemote(remote: RemoteHabit[]) {
  applyingRemote = true
  try {
    for (const doc of remote) {
      const { profileId: _p, serverUpdatedAt: _s, deleted, ...fields } = doc
      const idx = habits.value.findIndex(h => h.id === doc.id)
      if (deleted) {
        if (idx !== -1 && habits.value[idx].updatedAt <= doc.updatedAt) {
          habits.value.splice(idx, 1)
        }
        continue
      }
      const incoming = migrateHabit(fields as Habit)
      if (idx === -1) {
        habits.value.push(incoming)
      } else if (incoming.updatedAt > habits.value[idx].updatedAt) {
        habits.value[idx] = incoming
      }
    }
  } finally {
    applyingRemote = false
  }
}

function refreshAndSync() {
  refreshHabitStates()
  syncNow()
}

window.addEventListener('online', refreshAndSync)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refreshAndSync()
})
setInterval(refreshAndSync, 60_000)

export function useHabits() {
  return {
    habits,
    activeHabits,
    lastSync,
    syncing,
    switching,
    syncNow,
    addHabit,
    removeHabit,
    deactivateHabit,
    reactivateHabit,
    reactivateByName,
    updateHabit,
    incrementPeg,
    decrementPeg,
    addGaugeValue,
    addCheatPeriod,
    removeCheatPeriod,
    isInCheatPeriod,
    findSimilarNames,
    getHabitName,
    periodStartFor,
    nextPeriodStart,
    refreshHabitStates,
  }
}
