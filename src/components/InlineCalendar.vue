<template>
  <div class="inline-calendar">
    <!-- Month navigation -->
    <div class="cal-nav">
      <button class="cal-nav-btn" @click="prevMonth" aria-label="Previous month">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span class="cal-month-label">{{ monthLabel }}</span>
      <button class="cal-nav-btn" @click="nextMonth" aria-label="Next month">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>

    <!-- Day-of-week headers -->
    <div class="cal-weekdays">
      <span v-for="d in weekdayLabels" :key="d" class="cal-weekday">{{ d }}</span>
    </div>

    <!-- Day grid -->
    <div class="cal-grid">
      <button
        v-for="cell in calendarCells"
        :key="cell.key"
        class="cal-day"
        :class="{
          'cal-day--other': !cell.inMonth,
          'cal-day--selected': cell.isSelected,
          'cal-day--today': cell.isToday,
        }"
        :disabled="!cell.inMonth"
        @click="selectDate(cell.dateStr)"
      >
        {{ cell.day }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: string // ISO date YYYY-MM-DD or ''
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())

const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const monthLabel = computed(() => {
  const names = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  return `${names[viewMonth.value]} ${viewYear.value}`
})

interface CalendarCell {
  key: string
  day: number
  dateStr: string
  inMonth: boolean
  isSelected: boolean
  isToday: boolean
}

const calendarCells = computed<CalendarCell[]>(() => {
  const firstOfMonth = new Date(viewYear.value, viewMonth.value, 1)
  const startDay = firstOfMonth.getDay() // 0 = Sunday
  const startDate = new Date(firstOfMonth)
  startDate.setDate(1 - startDay)

  const cells: CalendarCell[] = []
  const todayStr = toISODate(today)

  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const dateStr = toISODate(d)
    cells.push({
      key: dateStr,
      day: d.getDate(),
      dateStr,
      inMonth: d.getMonth() === viewMonth.value,
      isSelected: dateStr === props.modelValue,
      isToday: dateStr === todayStr,
    })
  }
  return cells
})

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
  emit('update:modelValue', dateStr)
}
</script>

<style scoped>
.inline-calendar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 6px 4px;
}

.cal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
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

.cal-weekdays {
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

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-day {
  border: 0px solid transparent;
  background: var(--neu-bg);
  border-radius: var(--neu-radius-xs);
  padding: 0;
  height: 30px;
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

.cal-day--today {
  color: var(--accent);
  font-weight: 800;
}

.cal-day--selected {
  background: var(--accent);
  color: #fff;
  font-weight: 800;
  box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.2),
              inset -1px -1px 3px rgba(255, 255, 255, 0.2);
}

.cal-day--selected.cal-day--today {
  color: #fff;
}
</style>
