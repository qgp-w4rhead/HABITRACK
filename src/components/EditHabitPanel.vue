<template>
  <div class="edit-panel" :style="{ '--accent': habit?.accentColor }">
    <div class="panel-header">
      <span class="panel-title">Edit {{ habit ? getHabitName(habit) : '' }}</span>
      <button class="close-btn neu-press-sm" @click="$emit('back')" aria-label="Back to manage">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </div>

    <div v-if="habit" class="edit-fields neu-scroll">
      <!-- Goal display with accent color dot -->
      <div class="goal-display">
        <span class="accent-dot" :style="{ background: habit.accentColor }"></span>
        <span class="goal-text">{{ habit.goal }}</span>
        <span class="goal-label">Goal</span>
      </div>

      <!-- Editable fields -->
      <div class="field-group">
        <label class="field-label">Habit name</label>
        <input
          v-model="editForm.name"
          class="neu-input neu-carved-sm"
          type="text"
          placeholder="Habit name"
          maxlength="40"
        />
        <span class="hint">Changes the display name only. "initial_name" stays in DB.</span>
      </div>

      <div class="field-group">
        <label class="field-label">Habit Description</label>
        <textarea
          v-model="editForm.description"
          class="neu-input neu-carved-sm"
          placeholder="Optional description"
          rows="2"
          maxlength="200"
        ></textarea>
      </div>

      <div class="field-group">
        <label class="field-label">Condition for success/fail</label>
        <input
          v-model="editForm.condition"
          class="neu-input neu-carved-sm"
          type="text"
          placeholder="Condition"
          maxlength="80"
        />
      </div>

      <!-- Counter goal + Jokers -->
      <div class="field-row">
        <StepperField
          v-model="editForm.goal"
          :label="editForm.trackingMode === 'gauge' ? 'Value Goal' : 'Counter Goal'"
          :min="1"
          :max="9999"
          fill
        />

        <StepperField
          v-model="editForm.jokers"
          label="Jokers"
          :min="0"
          :max="99"
          fill
        />
      </div>

      <!-- Type + Overflow toggles -->
      <div class="field-row field-row--center">
        <div class="field-group field-group--center">
          <label class="field-label">Pos / Neg</label>
          <PosNegToggle v-model="editForm.type" />
        </div>
        <div class="field-group field-group--center">
          <label class="field-label">Overflow</label>
          <OverflowToggle v-model="editForm.overflowType" />
        </div>
      </div>

      <!-- Accent color picker -->
      <div class="field-group field-group--center">
        <label class="field-label">Accent color</label>
        <div class="color-picker">
          <button
            v-for="color in ACCENT_COLORS"
            :key="color"
            class="color-swatch"
            :class="{ active: editForm.accentColor === color }"
            :style="{ background: color }"
            @click="editForm.accentColor = color"
          ></button>
        </div>
      </div>

      <!-- Advanced options dropdown -->
      <AdvancedOptions
        v-model:startDate="editForm.startDate"
        v-model:endDate="editForm.endDate"
        v-model:dateEnabled="editForm.dateEnabled"
        v-model:trackingMode="editForm.trackingMode"
        v-model:gaugeDecimals="editForm.gaugeDecimals"
        v-model:justify="editForm.justify"
        v-model:goalKind="editForm.goalKind"
        v-model:repeatRate="editForm.repeatRate"
      />
    </div>

    <button
      v-if="habit"
      class="save-btn neu-raised neu-press"
      @click="save"
    >
      Save changes
    </button>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import type { Habit } from '@/types/habit'
import type { GoalKind, RepeatRate, TrackingMode } from '@/types/habit'
import { ACCENT_COLORS, getHabitName } from '@/types/habit'
import type { HabitType, OverflowType } from '@/types/habit'
import AdvancedOptions from './AdvancedOptions.vue'
import OverflowToggle from './OverflowToggle.vue'
import PosNegToggle from './PosNegToggle.vue'
import StepperField from './StepperField.vue'

const props = defineProps<{
  habit: Habit | null
}>()

const emit = defineEmits<{
  back: []
  save: [updates: Partial<Habit>]
}>()

const editForm = reactive({
  name: '',
  condition: '',
  description: '',
  goal: 7,
  jokers: 0,
  type: 'positive' as HabitType,
  overflowType: 'positive' as OverflowType,
  accentColor: '#4ECDC4',
  trackingMode: 'peg' as TrackingMode,
  gaugeDecimals: false,
  justify: false,
  startDate: '',
  endDate: '',
  dateEnabled: false,
  goalKind: 'singular' as GoalKind,
  repeatRate: 'daily' as RepeatRate,
})

watch(() => props.habit, (habit) => {
  if (habit) {
    editForm.name = getHabitName(habit)
    editForm.condition = habit.condition
    editForm.description = habit.description
    editForm.goal = habit.goal
    editForm.jokers = habit.jokers
    editForm.type = habit.type
    editForm.overflowType = habit.overflowType
    editForm.accentColor = habit.accentColor
    editForm.trackingMode = habit.trackingMode
    editForm.gaugeDecimals = habit.gaugeDecimals
    editForm.justify = habit.justify
    editForm.startDate = habit.startDate || ''
    editForm.endDate = habit.endDate || ''
    editForm.dateEnabled = !!(habit.startDate || habit.endDate)
    editForm.goalKind = habit.goalKind
    editForm.repeatRate = habit.repeatRate ?? 'daily'
  }
}, { immediate: true })

function save() {
  if (!props.habit) return
  const currentName = getHabitName(props.habit)
  const updates: Partial<Habit> = {
    condition: editForm.condition.trim(),
    description: editForm.description.trim(),
    goal: editForm.goal,
    jokers: editForm.jokers,
    type: editForm.type,
    overflowType: editForm.overflowType,
    accentColor: editForm.accentColor,
    trackingMode: editForm.trackingMode,
    gaugeDecimals: editForm.gaugeDecimals,
    justify: editForm.justify,
    startDate: editForm.dateEnabled ? editForm.startDate : '',
    endDate: editForm.dateEnabled ? editForm.endDate : '',
    goalKind: editForm.goalKind,
    repeatRate: editForm.goalKind === 'repetitive' ? editForm.repeatRate : null,
  }
  if (editForm.name.trim() !== currentName) {
    updates.renamed = editForm.name.trim()
  }
  emit('save', updates)
}
</script>

<style scoped>
.edit-panel {
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
  font-size: 15px;
  font-weight: 700;
  color: var(--neu-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  flex-shrink: 0;
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

.edit-fields {
  
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.goal-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}

.accent-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 1px 1px 3px var(--neu-shadow-dark),
              -1px -1px 3px var(--neu-shadow-light);
}

.goal-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--neu-text);
}

.goal-label {
  font-size: 12px;
  color: var(--neu-text-light);
}

.info-block {
  padding: 10px 12px;
  border-radius: var(--neu-radius-sm);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--neu-text-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-text {
  font-size: 13px;
  color: var(--neu-text);
  margin: 0;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.field-row > :deep(.field-group--fill) {
  flex: 1;
}

.field-row--center {
  justify-content: center;
}

.field-group--center {
  align-items: center;
}

.field-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--neu-text-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.neu-input {
  border: none;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--neu-text);
  background: var(--neu-bg);
  outline: none;
  width: 100%;
  resize: none;
  font-family: inherit;
}

.neu-input::placeholder {
  color: var(--neu-text-light);
  opacity: 0.7;
}

.hint {
  font-size: 10px;
  color: var(--neu-text-light);
  padding: 0 4px;
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 4px;
}

.color-swatch {
  border: 0px solid transparent;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    2px 2px 4px var(--neu-shadow-dark),
    -2px -2px 4px var(--neu-shadow-light);
  transition: box-shadow var(--anim-fast) ease,
              border var(--anim-fast) var(--ease-bounce, ease);
}

.color-swatch:active {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    0 0 0 0 var(--neu-shadow-dark),
    0 0 0 0 var(--neu-shadow-light);
  border: 0.2px solid rgba(128, 128, 128, 0.2);
}

.color-swatch.active {
  box-shadow: inset 2px 2px 4px var(--neu-shadow-dark),
              inset -2px -2px 4px var(--neu-shadow-light),
              0 0 0 2px var(--neu-bg),
              0 0 0 4px currentColor;
}

.save-btn {
  border: 0px solid transparent;
  padding: 12px;
  border-radius: var(--neu-radius-sm);
  font-size: 15px;
  font-weight: 700;
  color: var(--neu-text);
  cursor: pointer;
  flex-shrink: 0;
  transition: box-shadow var(--anim-fast) ease,
              border var(--anim-fast) var(--ease-bounce, ease);
}

.save-btn:active {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    0 0 0 0 var(--neu-shadow-dark),
    0 0 0 0 var(--neu-shadow-light);
  border: 0.2px solid rgba(128, 128, 128, 0.2);
}
</style>
