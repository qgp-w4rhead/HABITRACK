<template>
  <div class="history-panel">
    <div class="panel-header">
      <span class="panel-title">History</span>
      <button class="close-btn neu-press-sm" @click="$emit('back')" aria-label="Close history">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <div class="history-body neu-scroll">
      <!-- Month navigation -->
      <div class="cal-nav">
        <button class="cal-nav-btn neu-press-sm" @click="prevMonth" aria-label="Previous month">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span class="cal-month-label">{{ monthLabel }}</span>
        <button class="cal-nav-btn neu-press-sm" @click="nextMonth" aria-label="Next month">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <!-- Day-of-week headers -->
      <div class="cal-weekdays">
        <span v-for="(d, i) in weekdayLabels" :key="i" class="cal-weekday">{{ d }}</span>
      </div>

      <!-- Day grid -->
      <div class="cal-grid">
        <button
          v-for="cell in calendarCells"
          :key="cell.key"
          class="cal-day"
          :class="{
            'cal-day--other': !cell.inMonth,
            'cal-day--today': cell.isToday,
            'cal-day--selected': cell.isSelected,
            'cal-day--cheat': cell.isCheat,
          }"
          :disabled="!cell.inMonth"
          @click="selectDate(cell.dateStr)"
        >
          <span class="cal-day-num">{{ cell.day }}</span>
          <span
            v-if="cell.state !== 'none'"
            class="cal-day-dot"
            :class="`dot--${cell.state}`"
          />
        </button>
      </div>

      <!-- Legend -->
      <div class="cal-legend">
        <span class="legend-item"><span class="cal-day-dot dot--success" />Met</span>
        <span class="legend-item"><span class="cal-day-dot dot--fail" />Missed</span>
        <span class="legend-item"><span class="cal-day-dot dot--progress" />In progress</span>
        <span class="legend-item"><span class="cal-day-dot dot--cheat" />Cheat</span>
      </div>

      <!-- Selected day detail -->
      <transition name="smooth-expand">
        <div v-if="selectedDate" class="day-detail neu-carved-sm">
          <span class="detail-title">{{ selectedLabel }}</span>
          <div v-if="selectedOutcomes.length === 0" class="detail-empty">
            No records for this day
          </div>
          <div
            v-for="(o, i) in selectedOutcomes"
            :key="i"
            class="detail-row"
            :style="{ '--accent': o.habit.accentColor }"
          >
            <span class="detail-dot" :style="{ background: o.habit.accentColor }"></span>
            <span class="detail-name">{{ getHabitName(o.habit) }}</span>
            <span v-if="o.goal !== undefined" class="detail-count">{{ o.finalCount }}/{{ o.goal }}</span>
            <span class="detail-state" :class="`state--${o.kind}`">{{ outcomeLabel(o.kind) }}</span>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Habit } from '@/types/habit'
import { getHabitName } from '@/types/habit'
import { useHabits } from '@/composables/useHabits'
import { useSettings } from '@/composables/useSettings'

defineEmits<{
  back: []
}>()

const { habits, nextPeriodStart } = useHabits()
const { settings } = useSettings()

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())
const selectedDate = ref('')

const weekStartDay = computed(() => (settings.value.calendar.weekStart === 'monday' ? 1 : 0))

const weekdayLabels = computed(() => {
  const base = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  return [...base.slice(weekStartDay.value), ...base.slice(0, weekStartDay.value)]
})

const monthLabel = computed(() => {
  const names = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  return `${names[viewMonth.value]} ${viewYear.value}`
})

type OutcomeKind = 'met' | 'missed' | 'completed' | 'progress'
type DayState = 'success' | 'fail' | 'mixed' | 'progress' | 'cheat' | 'none'

interface DayOutcome {
  habit: Habit
  kind: OutcomeKind
  finalCount?: number
  goal?: number
}

const DAY_MS = 86_400_000

// All habit outcomes covering the given day (midnight local): closed period
// records, singular completions, and open periods still in progress. Progress
// is capped at today ; future days inside the open period show nothing.
function outcomesFor(dateStr: string): DayOutcome[] {
  const dayStart = new Date(dateStr + 'T00:00:00').getTime()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const out: DayOutcome[] = []
  for (const h of habits.value) {
    for (const rec of h.history) {
      const s = new Date(rec.start).getTime()
      const e = new Date(rec.end).getTime()
      if (dayStart >= s && dayStart < e) {
        out.push({ habit: h, kind: rec.metGoal ? 'met' : 'missed', finalCount: rec.finalCount, goal: h.goal })
      }
    }
    if (h.goalKind === 'singular' && h.completedAt && h.completedAt.slice(0, 10) === dateStr) {
      out.push({ habit: h, kind: 'completed', finalCount: h.currentCount, goal: h.goal })
    }
    if (h.active && h.goalKind === 'repetitive' && h.repeatRate && dayStart <= todayStart.getTime()) {
      const ps = new Date(h.periodStart).getTime()
      const pe = nextPeriodStart(h.repeatRate, new Date(ps)).getTime()
      if (dayStart >= ps && dayStart < pe) {
        out.push({ habit: h, kind: 'progress', finalCount: h.currentCount, goal: h.goal })
      }
    }
  }
  return out
}

function isCheatDay(dateStr: string): boolean {
  return habits.value.some(h =>
    h.cheatPeriods.some(p => dateStr >= p.start && dateStr <= p.end),
  )
}

function stateFor(outcomes: DayOutcome[], cheat: boolean): DayState {
  const hasMet = outcomes.some(o => o.kind === 'met' || o.kind === 'completed')
  const hasMissed = outcomes.some(o => o.kind === 'missed')
  if (hasMet && hasMissed) return 'mixed'
  if (hasMet) return 'success'
  if (hasMissed) return 'fail'
  if (outcomes.length) return 'progress'
  return cheat ? 'cheat' : 'none'
}

interface CalendarCell {
  key: string
  day: number
  dateStr: string
  inMonth: boolean
  isToday: boolean
  isSelected: boolean
  isCheat: boolean
  state: DayState
}

const calendarCells = computed<CalendarCell[]>(() => {
  const firstOfMonth = new Date(viewYear.value, viewMonth.value, 1)
  const startOffset = (firstOfMonth.getDay() - weekStartDay.value + 7) % 7
  const startDate = new Date(firstOfMonth)
  startDate.setDate(1 - startOffset)

  const cells: CalendarCell[] = []
  const todayStr = toISODate(today)

  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const dateStr = toISODate(d)
    const inMonth = d.getMonth() === viewMonth.value
    if (!inMonth) {
      cells.push({ key: dateStr, day: d.getDate(), dateStr, inMonth, isToday: false, isSelected: false, isCheat: false, state: 'none' })
      continue
    }
    const outcomes = outcomesFor(dateStr)
    const cheat = isCheatDay(dateStr)
    cells.push({
      key: dateStr,
      day: d.getDate(),
      dateStr,
      inMonth,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDate.value,
      isCheat: cheat,
      state: stateFor(outcomes, cheat),
    })
  }
  return cells
})

const selectedOutcomes = computed(() => (selectedDate.value ? outcomesFor(selectedDate.value) : []))

const selectedLabel = computed(() => {
  if (!selectedDate.value) return ''
  const d = new Date(selectedDate.value + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
})

function outcomeLabel(kind: OutcomeKind): string {
  switch (kind) {
    case 'met': return 'Met'
    case 'missed': return 'Missed'
    case 'completed': return 'Completed'
    case 'progress': return 'In progress'
  }
}

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else {
    viewMonth.value--
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else {
    viewMonth.value++
  }
}

function selectDate(dateStr: string) {
  selectedDate.value = selectedDate.value === dateStr ? '' : dateStr
}
</script>

<style scoped>
.history-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--neu-bg);
  padding-bottom: 4px;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--neu-text);
}

.close-btn {
  border: 0px solid transparent;
  background: var(--neu-bg);
  width: 32px;
  height: 32px;
  border-radius: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--neu-text-light);
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    2px 2px 4px var(--neu-shadow-dark),
    -2px -2px 4px var(--neu-shadow-light);
  transition: box-shadow var(--anim-fast) ease,
              border var(--anim-fast) var(--ease-bounce, ease),
              color var(--anim-fast) var(--ease-smooth);
}

.close-btn:active {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    0 0 0 0 var(--neu-shadow-dark),
    0 0 0 0 var(--neu-shadow-light);
  border: 0.2px solid rgba(128, 128, 128, 0.2);
}

.history-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1 1 auto;
}

.cal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cal-nav-btn {
  border: 0px solid transparent;
  background: var(--neu-bg);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--neu-text-light);
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    2px 2px 4px var(--neu-shadow-dark),
    -2px -2px 4px var(--neu-shadow-light);
  transition: box-shadow var(--anim-fast) ease,
              border var(--anim-fast) var(--ease-bounce, ease),
              color var(--anim-fast) var(--ease-smooth);
}

.cal-nav-btn:active {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    0 0 0 0 var(--neu-shadow-dark),
    0 0 0 0 var(--neu-shadow-light);
  border: 0.2px solid rgba(128, 128, 128, 0.2);
}

.cal-month-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--neu-text);
}

.cal-weekdays,
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-weekday {
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: var(--neu-text-light);
  text-transform: uppercase;
  padding: 2px 0;
}

.cal-day {
  position: relative;
  border: 0px solid transparent;
  background: var(--neu-bg);
  border-radius: var(--neu-radius-xs);
  padding: 0;
  height: 34px;
  font-size: 12px;
  font-weight: 600;
  color: var(--neu-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow var(--anim-fast) ease,
              border var(--anim-fast) var(--ease-bounce, ease),
              color var(--anim-fast) var(--ease-smooth);
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    1px 1px 2px var(--neu-shadow-dark),
    -1px -1px 2px var(--neu-shadow-light);
}

.cal-day:active {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    0 0 0 0 var(--neu-shadow-dark),
    0 0 0 0 var(--neu-shadow-light);
  border: 0.2px solid rgba(128, 128, 128, 0.2);
}

.cal-day--other {
  opacity: 0.3;
  box-shadow: none;
  cursor: default;
}

.cal-day--other:active {
  box-shadow: none;
}

.cal-day--today .cal-day-num {
  color: var(--accent, #4ECDC4);
  font-weight: 800;
}

.cal-day--selected {
  box-shadow: inset 2px 2px 4px var(--neu-shadow-dark),
              inset -2px -2px 4px var(--neu-shadow-light);
}

.cal-day--cheat {
  border: 1px dashed rgba(128, 128, 128, 0.45);
}

.cal-day-num {
  line-height: 1;
}

.cal-day-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

/* In-cell dots pin to the bottom edge so the day number stays centered;
   legend dots keep their normal inline flow. */
.cal-day .cal-day-dot {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
}

.dot--success {
  background: #2ecc71;
}

.dot--fail {
  background: #e74c3c;
}

.dot--mixed {
  background: linear-gradient(90deg, #2ecc71 50%, #e74c3c 50%);
}

.dot--progress {
  background: var(--neu-text-light);
  opacity: 0.5;
}

.dot--cheat {
  background: transparent;
  border: 1px solid var(--neu-text-light);
  opacity: 0.6;
  box-sizing: border-box;
}

.cal-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 6px 4px 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 600;
  color: var(--neu-text-light);
}

.day-detail {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: var(--neu-radius-sm);
}

.detail-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--neu-text-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-empty {
  font-size: 12px;
  color: var(--neu-text-light);
  padding: 4px 0;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.detail-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 0.01em solid #000;
}

.detail-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: var(--neu-text);
}

.detail-count {
  font-size: 11px;
  color: var(--neu-text-light);
  white-space: nowrap;
}

.detail-state {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.state--met,
.state--completed {
  color: #2ecc71;
}

.state--missed {
  color: #e74c3c;
}

.state--progress {
  color: var(--neu-text-light);
}

.smooth-expand-enter-active,
.smooth-expand-leave-active {
  overflow: hidden;
  transition: max-height var(--anim-slow) var(--ease-smooth),
              opacity var(--anim-slow) var(--ease-smooth);
}

.smooth-expand-enter-from,
.smooth-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.smooth-expand-enter-to,
.smooth-expand-leave-from {
  max-height: 400px;
  opacity: 1;
}
</style>
