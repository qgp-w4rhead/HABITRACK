import { ref, watch } from 'vue'
import { api } from '@/lib/api'
import { useProfile } from '@/composables/useProfile'

export type ButtonPosition = 'left' | 'right'
export type WeekStart = 'sunday' | 'monday'

export interface AppSettings {
  accessibility: {
    buttonPosition: ButtonPosition
  }
  calendar: {
    weekStart: WeekStart
  }
}

const LEGACY_KEY = 'habitrack_settings'
const SCHEMA_VERSION = 3
const settingsKey = (pid: string) => `habitrack_settings_${pid}`

// updatedAt stays '' until the user actually changes something on this
// device ; that way a fresh install's defaults can never win a sync.
interface SettingsFile {
  v: number
  updatedAt: string
  settings: AppSettings
}

// Defaults for fields added after settings were saved. When you add a field to
// AppSettings, bump SCHEMA_VERSION and give the field a default here.
function migrateSettings(parsed: Partial<AppSettings>): AppSettings {
  return {
    accessibility: {
      buttonPosition: parsed.accessibility?.buttonPosition ?? 'left',
    },
    calendar: {
      weekStart: parsed.calendar?.weekStart ?? 'sunday',
    },
  }
}

// Accepts the v2 envelope, the v1 envelope ({v, settings}), and the original
// bare AppSettings object so legacy data survives.
function parseSettingsFile(parsed: unknown): SettingsFile {
  const obj = (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>
  const inner = 'settings' in obj ? obj.settings : obj
  return {
    v: SCHEMA_VERSION,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : '',
    settings: migrateSettings((inner ?? {}) as Partial<AppSettings>),
  }
}

function loadSettings(pid: string): SettingsFile {
  let raw = localStorage.getItem(settingsKey(pid))
  // One-time migration of the pre-profile global settings into the first
  // profile that loads. The legacy key is consumed so it can't copy twice.
  if (raw === null) {
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy !== null) {
      raw = legacy
      localStorage.setItem(settingsKey(pid), legacy)
      localStorage.removeItem(LEGACY_KEY)
    }
  }
  if (raw === null) {
    return { v: SCHEMA_VERSION, updatedAt: '', settings: migrateSettings({}) }
  }
  try {
    return parseSettingsFile(JSON.parse(raw))
  } catch {
    try { localStorage.setItem(`${settingsKey(pid)}_corrupt_${Date.now()}`, raw) } catch { /* quota */ }
    return { v: SCHEMA_VERSION, updatedAt: '', settings: migrateSettings({}) }
  }
}

function saveSettings(pid: string, file: SettingsFile) {
  localStorage.setItem(settingsKey(pid), JSON.stringify(file))
}

const { currentProfileId } = useProfile()

const settings = ref<AppSettings>(migrateSettings({}))
let updatedAt = ''
let loadedPid: string | null = null

// Sync state lives up top: the watchers below run at module init and user
// edits can reach scheduleSync immediately.
let syncing = false
let syncTimer: ReturnType<typeof setTimeout> | null = null

// Set while swapping in loaded/remote data so the watcher doesn't treat it as
// a user edit. Watcher uses flush: 'sync' so this flag is always accurate.
let suppressWatch = false

watch(currentProfileId, (pid) => {
  if (!pid) return
  loadedPid = pid
  const file = loadSettings(pid)
  suppressWatch = true
  try {
    settings.value = file.settings
    updatedAt = file.updatedAt
  } finally {
    suppressWatch = false
  }
  syncSettings()
}, { immediate: true })

watch(settings, () => {
  if (!loadedPid || suppressWatch) return
  updatedAt = new Date().toISOString()
  saveSettings(loadedPid, { v: SCHEMA_VERSION, updatedAt, settings: settings.value })
  scheduleSync()
}, { deep: true, flush: 'sync' })

// --- Sync -----------------------------------------------------------------
// Whole-doc last write wins via POST /settings/sync ; the server stores the
// copy only when it's newer and always returns the winner.

function scheduleSync() {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(syncSettings, 1500)
}

async function syncSettings() {
  const pid = currentProfileId.value
  if (!pid || syncing || !navigator.onLine) return
  syncing = true
  try {
    const res = await api.post<{ settings: AppSettings | null; updatedAt: string }>(
      `/profiles/${pid}/settings/sync`,
      { settings: settings.value, updatedAt },
    )
    if (currentProfileId.value !== pid) return
    if (res.settings && res.updatedAt > updatedAt) {
      suppressWatch = true
      try {
        settings.value = migrateSettings(res.settings)
        updatedAt = res.updatedAt
      } finally {
        suppressWatch = false
      }
      saveSettings(pid, { v: SCHEMA_VERSION, updatedAt, settings: settings.value })
    }
  } catch {
    // offline or server down ; local store stays authoritative
  } finally {
    syncing = false
  }
}

window.addEventListener('online', syncSettings)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') syncSettings()
})

export function useSettings() {
  return {
    settings,
    syncSettings,
  }
}
