<template>
  <div class="cheat-panel">
    <div class="panel-header">
      <span class="panel-title">Cheat Period</span>
      <button class="close-btn" @click="$emit('back')" aria-label="Back to manage">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </div>

    <div v-if="habit" class="cheat-body neu-scroll">
          <span class="habit-context">
            {{ getHabitName(habit) }}
          </span>

          <!-- Existing cheat periods -->
          <div v-if="habit.cheatPeriods.length > 0" class="existing-periods">
            <div
              v-for="period in habit.cheatPeriods"
              :key="period.id"
              class="period-row neu-carved-sm"
            >
              <span class="period-dates">
                {{ formatDate(period.start) }} → {{ formatDate(period.end) }}
              </span>
              <button class="remove-period" @click="removePeriod(period.id)" aria-label="Remove">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <!-- New period form -->
          <div class="new-period-form">
            <!-- Start date field -->
            <div class="field-group">
              <label class="field-label">Start date</label>
              <div class="date-field neu-carved-sm" :class="{ 'date-field--open': expandedField === 'start' }">
                <div class="date-field-row">
                  <input
                    class="date-field-input"
                    type="text"
                    :value="formatDisplayDate(form.start)"
                    placeholder="MM / DD / YYYY"
                    @blur="parseDateInput($event, 'start')"
                    @keydown.enter="($event.target as HTMLInputElement).blur()"
                  />
                  <button class="cal-toggle-btn" @click="toggleField('start')" aria-label="Toggle start date calendar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </button>
                </div>
                <div class="cal-wrapper" :class="{ 'cal-wrapper--open': expandedField === 'start' }">
                  <InlineCalendar v-model="form.start" @update:modelValue="onDateSelected('start')" />
                </div>
              </div>
            </div>

            <!-- End date field -->
            <div class="field-group">
              <label class="field-label">End date</label>
              <div class="date-field neu-carved-sm" :class="{ 'date-field--open': expandedField === 'end' }">
                <div class="date-field-row">
                  <input
                    class="date-field-input"
                    type="text"
                    :value="formatDisplayDate(form.end)"
                    placeholder="MM / DD / YYYY"
                    @blur="parseDateInput($event, 'end')"
                    @keydown.enter="($event.target as HTMLInputElement).blur()"
                  />
                  <button class="cal-toggle-btn" @click="toggleField('end')" aria-label="Toggle end date calendar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </button>
                </div>
                <div class="cal-wrapper" :class="{ 'cal-wrapper--open': expandedField === 'end' }">
                  <InlineCalendar v-model="form.end" @update:modelValue="onDateSelected('end')" />
                </div>
              </div>
            </div>
          </div>

        </div>

      <button
        v-if="habit"
        class="add-period-btn neu-raised"
        :disabled="!form.start || !form.end"
        @click="addPeriod"
      >
        Add cheat period
      </button>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { Habit } from '@/types/habit'
import { useHabits } from '@/composables/useHabits'
import InlineCalendar from './InlineCalendar.vue'

const props = defineProps<{
  habit: Habit | null
}>()

const emit = defineEmits<{
  back: []
}>()

const { getHabitName, addCheatPeriod, removeCheatPeriod } = useHabits()

const form = reactive({
  start: '',
  end: '',
})

const expandedField = ref<'start' | 'end' | null>(null)

watch(() => props.habit, (habit) => {
  if (habit) {
    form.start = ''
    form.end = ''
    expandedField.value = null
  }
}, { immediate: true })

function toggleField(field: 'start' | 'end') {
  expandedField.value = expandedField.value === field ? null : field
}

function onDateSelected(_field: 'start' | 'end') {
  expandedField.value = null
}

function addPeriod() {
  if (!props.habit || !form.start || !form.end) return
  addCheatPeriod(props.habit.id, form.start, form.end)
  form.start = ''
  form.end = ''
  expandedField.value = null
}

function removePeriod(periodId: string) {
  if (!props.habit) return
  removeCheatPeriod(props.habit.id, periodId)
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDisplayDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${m} / ${day} / ${d.getFullYear()}`
}

function parseDateInput(event: Event, field: 'start' | 'end') {
  const input = event.target as HTMLInputElement
  const raw = input.value.trim()
  if (!raw) {
    form[field] = ''
    input.value = ''
    return
  }
  const match = raw.match(/^(\d{1,2})[\s\/\-\.]*(\d{1,2})[\s\/\-\.]*(\d{4})$/)
  if (match) {
    const [, m, d, y] = match
    const month = Number(m)
    const day = Number(d)
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const dateStr = `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      form[field] = dateStr
      return
    }
  }
  input.value = formatDisplayDate(form[field])
}
</script>

<style scoped>
.cheat-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.close-btn:active {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    0 0 0 0 var(--neu-shadow-dark),
    0 0 0 0 var(--neu-shadow-light);
  border: 0.2px solid rgba(128, 128, 128, 0.2);
}

.cheat-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.habit-context {
  font-size: 14px;
  font-weight: 600;
  color: var(--neu-text);
  padding: 8px 12px;
  border-radius: var(--neu-radius-sm);
  background: var(--neu-bg);
  box-shadow: inset 1px 1px 2px var(--neu-shadow-dark),
              inset -1px -1px 2px var(--neu-shadow-light);
}

.existing-periods {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.period-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: var(--neu-radius-sm);
}

.period-dates {
  font-size: 12px;
  color: var(--neu-text);
}

.remove-period {
  border: 0px solid transparent;
  background: var(--neu-bg);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #e74c3c;
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    1px 1px 3px var(--neu-shadow-dark),
    -1px -1px 3px var(--neu-shadow-light);
  transition: box-shadow var(--anim-fast) ease,
              border var(--anim-fast) var(--ease-bounce, ease);
}

.remove-period:active {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    0 0 0 0 var(--neu-shadow-dark),
    0 0 0 0 var(--neu-shadow-light);
  border: 0.2px solid rgba(128, 128, 128, 0.2);
}

.new-period-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--neu-text-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.date-field {
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  border-radius: var(--neu-radius-sm);
  background: var(--neu-bg);
  transition: box-shadow var(--anim-fast) var(--ease-smooth);
}

.date-field--open {
  box-shadow: inset var(--neu-distance-sm) var(--neu-distance-sm) var(--neu-distance) var(--neu-shadow-dark),
              inset calc(-1 * var(--neu-distance-sm)) calc(-1 * var(--neu-distance-sm)) var(--neu-distance) var(--neu-shadow-light),
              0 0 0 1px color-mix(in srgb, var(--accent) 50%, transparent);
}

.date-field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.date-field-input {
  border: none;
  background: transparent;
  outline: none;
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--neu-text);
  font-family: inherit;
}

.date-field-input::placeholder {
  color: var(--neu-text-light);
  font-weight: 400;
}

.cal-toggle-btn {
  border: 0px solid transparent;
  background: var(--neu-bg);
  width: 32px;
  height: 32px;
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
  flex-shrink: 0;
}

.cal-toggle-btn:active {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    0 0 0 0 var(--neu-shadow-dark),
    0 0 0 0 var(--neu-shadow-light);
  border: 0.2px solid rgba(128, 128, 128, 0.2);
}

.cal-wrapper {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height var(--anim-slow) var(--ease-smooth),
              opacity var(--anim-slow) var(--ease-smooth);
}

.cal-wrapper--open {
  max-height: 320px;
  opacity: 1;
}

.add-period-btn {
  border: 0px solid transparent;
  padding: 12px;
  margin: 0 6px 12px;
  border-radius: var(--neu-radius-sm);
  font-size: 14px;
  font-weight: 700;
  color: var(--neu-text);
  cursor: pointer;
  transition: box-shadow var(--anim-fast) ease,
              border var(--anim-fast) var(--ease-bounce, ease);
}

.add-period-btn:active {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    0 0 0 0 var(--neu-shadow-dark),
    0 0 0 0 var(--neu-shadow-light);
  border: 0.2px solid rgba(128, 128, 128, 0.2);
}

.add-period-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
