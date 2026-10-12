<template>
  <div class="advanced-options">
    <!-- Dropdown header with caret -->
    <NeuRow tag="button" :state="expanded ? 'caved' : 'raised'"
      style="--neu-row-padding: 8px 12px; --neu-row-font-size: 11px; --neu-row-color: var(--neu-text-light); text-transform: uppercase; letter-spacing: 0.5px"
      @click="expanded = !expanded">
      <span>Advanced options</span>
      <svg class="caret" :class="{ 'caret--open': expanded }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </NeuRow>

    <!-- Expandable body -->
    <div class="options-body" :class="{ 'options-body--open': expanded }">
      <!-- Tracking mode: Peg vs Gauge -->
      <div class="option-row">
        <span class="option-label">Tracking mode</span>
        <NeuSegmentedToggle
          :modelValue="trackingMode"
          :options="[{ label: 'Peg', value: 'peg' }, { label: 'Gauge', value: 'gauge' }]"
          size="md"
          @update:modelValue="trackingMode = $event as TrackingMode"
        />
      </div>

      <!-- Decimal input, only for gauge tracking -->
      <transition name="smooth-expand">
        <div v-if="trackingMode === 'gauge'" class="option-row option-row--sub">
          <span class="option-label">Allow decimals</span>
          <NeuToggle v-model="gaugeDecimals" />
        </div>
      </transition>

      <!-- Justify: require a note when dropping a peg / pressing the gauge -->
      <div class="option-row option-row--sub">
        <span class="option-label">Justify</span>
        <NeuToggle v-model="justify" />
      </div>

      <!-- Goal type: one-shot vs repeats -->
      <div class="option-row">
        <span class="option-label">Goal type</span>
        <NeuSegmentedToggle
          :modelValue="goalKind"
          :options="[{ label: 'One-time', value: 'singular' }, { label: 'Repeats', value: 'repetitive' }]"
          size="md"
          @update:modelValue="goalKind = $event as GoalKind"
        />
      </div>

      <!-- Reset cadence, only when the goal repeats -->
      <transition name="smooth-expand">
        <div v-if="goalKind === 'repetitive'" class="option-row">
          <span class="option-label">Resets every</span>
          <NeuSegmentedToggle
            :modelValue="repeatRate"
            :options="[{ label: 'Day', value: 'daily' }, { label: 'Week', value: 'weekly' }, { label: 'Month', value: 'monthly' }]"
            size="md"
            @update:modelValue="repeatRate = $event as RepeatRate"
          />
        </div>
      </transition>

      <!-- Start / End date toggle row -->
      <div class="option-row">
        <span class="option-label">Start / End date</span>
        <NeuToggle v-model="dateEnabled" @update:modelValue="onToggleDate" />
      </div>

      <!-- Date fields when enabled -->
      <transition name="smooth-expand">
      <div v-if="dateEnabled" class="date-fields">
        <!-- Start date -->
        <div class="field-group">
          <label class="field-label">Start date</label>
          <div class="date-field neu-carved-sm" :class="{ 'date-field--open': expandedField === 'start' }">
            <div class="date-field-row">
              <input
                class="date-field-input"
                type="text"
                size="12"
                maxlength="14"
                :value="formatDisplayDate(startDate)"
                placeholder="MM / DD / YYYY"
                @input="sanitizeDateInput($event)"
                @blur="parseDateInput($event, 'start')"
                @keydown.enter="($event.target as HTMLInputElement).blur()"
              />
              <button class="cal-toggle-btn neu-press-sm" @click="toggleField('start')" aria-label="Toggle start date calendar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </button>
            </div>
            <div class="cal-wrapper" :class="{ 'cal-wrapper--open': expandedField === 'start' }">
              <InlineCalendar :modelValue="startDate" @update:modelValue="onDateSelected('start', $event)" />
            </div>
          </div>
        </div>

        <!-- End date -->
        <div class="field-group">
          <label class="field-label">End date</label>
          <div class="date-field neu-carved-sm" :class="{ 'date-field--open': expandedField === 'end' }">
            <div class="date-field-row">
              <input
                class="date-field-input"
                type="text"
                size="12"
                maxlength="14"
                :value="formatDisplayDate(endDate)"
                placeholder="MM / DD / YYYY"
                @input="sanitizeDateInput($event)"
                @blur="parseDateInput($event, 'end')"
                @keydown.enter="($event.target as HTMLInputElement).blur()"
              />
              <button class="cal-toggle-btn neu-press-sm" @click="toggleField('end')" aria-label="Toggle end date calendar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </button>
            </div>
            <div class="cal-wrapper" :class="{ 'cal-wrapper--open': expandedField === 'end' }">
              <InlineCalendar :modelValue="endDate" @update:modelValue="onDateSelected('end', $event)" />
            </div>
          </div>
        </div>
      </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { GoalKind, RepeatRate, TrackingMode } from '@/types/habit'
import InlineCalendar from './InlineCalendar.vue'
import NeuSegmentedToggle from './NeuSegmentedToggle.vue'
import NeuToggle from './NeuToggle.vue'
import NeuRow from './NeuRow.vue'

const startDate = defineModel<string>('startDate', { default: '' })
const endDate = defineModel<string>('endDate', { default: '' })
const dateEnabled = defineModel<boolean>('dateEnabled', { default: false })
const trackingMode = defineModel<TrackingMode>('trackingMode', { default: 'peg' })
const gaugeDecimals = defineModel<boolean>('gaugeDecimals', { default: false })
const justify = defineModel<boolean>('justify', { default: false })
const goalKind = defineModel<GoalKind>('goalKind', { default: 'repetitive' })
const repeatRate = defineModel<RepeatRate>('repeatRate', { default: 'daily' })

const expanded = ref(false)
const expandedField = ref<'start' | 'end' | null>(null)

function toggleField(field: 'start' | 'end') {
  expandedField.value = expandedField.value === field ? null : field
}

function onDateSelected(field: 'start' | 'end', value: string) {
  if (field === 'start') startDate.value = value
  else endDate.value = value
  expandedField.value = null
}

function sanitizeDateInput(event: Event) {
  const input = event.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '').slice(0, 8)
  let formatted = digits
  if (digits.length > 4) {
    formatted = digits.slice(0, 2) + ' / ' + digits.slice(2, 4) + ' / ' + digits.slice(4)
  } else if (digits.length > 2) {
    formatted = digits.slice(0, 2) + ' / ' + digits.slice(2)
  } else if (digits.length > 0) {
    formatted = digits
  }
  input.value = formatted
}

function onToggleDate(enabled: boolean) {
  if (!enabled) {
    startDate.value = ''
    endDate.value = ''
    expandedField.value = null
  }
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
    if (field === 'start') startDate.value = ''
    else endDate.value = ''
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
      if (field === 'start') startDate.value = dateStr
      else endDate.value = dateStr
      return
    }
  }
  input.value = formatDisplayDate(field === 'start' ? startDate.value : endDate.value)
}
</script>

<style scoped>
.advanced-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.smooth-expand-enter-active,
.smooth-expand-leave-active {
  overflow: hidden;
  transition: max-height var(--anim-slow) var(--ease-smooth),
              opacity var(--anim-slow) var(--ease-smooth),
              margin var(--anim-slow) var(--ease-smooth);
}

.smooth-expand-enter-from,
.smooth-expand-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  margin-bottom: 0;
}

.smooth-expand-enter-to,
.smooth-expand-leave-from {
  max-height: 500px;
  opacity: 1;
}

.caret {
  color: var(--neu-text-light);
  transition: transform var(--anim-fast) var(--ease-smooth);
}

.caret--open {
  transform: rotate(180deg);
}

.options-body {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height var(--anim-slow) var(--ease-smooth),
              opacity var(--anim-slow) var(--ease-smooth);
}

.options-body--open {
  max-height: 640px;
  opacity: 1;
}

.option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
}

.option-row--sub {
  padding-left: 24px;
}

.option-row--sub .option-label {
  font-weight: 500;
  color: var(--neu-text-light);
}

.option-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--neu-text);
}

.date-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 4px;
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
              0 0 0 1px color-mix(in srgb, var(--accent, #4ECDC4) 50%, transparent);
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
  width: fit-content;
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
  border: none;
  background: var(--neu-bg);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--neu-text-light);
  box-shadow: 2px 2px 4px var(--neu-shadow-dark),
              -2px -2px 4px var(--neu-shadow-light);
  transition: all var(--anim-fast) var(--ease-smooth);
  flex-shrink: 0;
}

.cal-toggle-btn:active {
  box-shadow: inset 2px 2px 5px var(--neu-shadow-dark),
              inset -2px -2px 5px var(--neu-shadow-light);
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
</style>
