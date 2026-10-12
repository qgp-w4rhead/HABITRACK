<template>
  <div class="create-form">
    <div class="form-header">
      <span class="form-title">Create habit</span>
    </div>

    <div class="form-fields neu-scroll">
      <!-- Habit name -->
      <div class="field-group">
        <label class="field-label">Habit name</label>
        <input
          v-model="form.name"
          class="neu-input neu-carved-sm"
          type="text"
          placeholder="e.g. Drink water"
          maxlength="40"
        />
      </div>

      <!-- Habit condition -->
      <div class="field-group">
        <label class="field-label">Condition for success/fail</label>
        <input
          v-model="form.condition"
          class="neu-input neu-carved-sm"
          type="text"
          placeholder="e.g. Did I drink 8 glasses?"
          maxlength="80"
        />
      </div>

      <!-- Habit description -->
      <div class="field-group">
        <label class="field-label">Habit Description</label>
        <textarea
          v-model="form.description"
          class="neu-input neu-carved-sm"
          placeholder="Optional details..."
          rows="2"
          maxlength="200"
        ></textarea>
      </div>

      <!-- Goal + Jokers + Type -->
      <div class="field-row">
        <StepperField
          v-model="form.goal"
          :label="form.trackingMode === 'gauge' ? 'Value Goal' : 'Counter Goal'"
          :min="1"
          :max="9999"
        />

        <StepperField
          v-model="form.jokers"
          label="Jokers"
          :min="0"
          :max="99"
        />

        <div class="field-group field-group--center">
          <label class="field-label">Pos / Neg</label>
          <PosNegToggle v-model="form.type" />
        </div>

        <div class="field-group field-group--center">
          <label class="field-label">Overflow</label>
          <OverflowToggle v-model="form.overflowType" />
        </div>
      </div>

      <p v-if="lastToggled === 'type' && form.type === 'negative'" class="type-hint">
        Negative habit ; try to do it as little as possible
      </p>
      <p v-else-if="lastToggled === 'type'" class="type-hint">
        Positive habit ; maximize adding pegs to your board
      </p>
      <p v-else-if="lastToggled === 'overflow' && form.overflowType === 'negative'" class="type-hint">
        Negative overflow ; going past your goal is overdoing it
      </p>
      <p v-else-if="lastToggled === 'overflow' && form.overflowType === 'neutral'" class="type-hint">
        Neutral overflow ; going past your goal is neither good nor bad
      </p>
      <p v-else-if="lastToggled === 'overflow'" class="type-hint">
        Positive overflow ; going past your goal is a bonus
      </p>

      <!-- Similar name warning -->
      <div v-if="similarNames.length > 0" class="similar-warning neu-carved-sm">
        <span class="warning-icon">!</span>
        <span>Similar habit{{ similarNames.length > 1 ? 's' : '' }} exist: {{ similarNames.map(getHabitName).join(', ') }}</span>
      </div>

      <!-- Advanced options dropdown -->
      <AdvancedOptions
        v-model:startDate="form.startDate"
        v-model:endDate="form.endDate"
        v-model:dateEnabled="form.dateEnabled"
        v-model:trackingMode="form.trackingMode"
        v-model:gaugeDecimals="form.gaugeDecimals"
        v-model:goalKind="form.goalKind"
        v-model:repeatRate="form.repeatRate"
      />
    </div>

    <button
      class="submit-btn neu-raised neu-press"
      :disabled="!form.name.trim()"
      @click="submit"
    >
      Create
    </button>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch, ref } from 'vue'
import type { HabitInput, HabitType, OverflowType, TrackingMode, GoalKind, RepeatRate } from '@/types/habit'
import { useHabits } from '@/composables/useHabits'
import AdvancedOptions from './AdvancedOptions.vue'
import OverflowToggle from './OverflowToggle.vue'
import PosNegToggle from './PosNegToggle.vue'
import StepperField from './StepperField.vue'

const emit = defineEmits<{
  submit: [input: HabitInput]
  cancel: []
}>()

const { findSimilarNames, getHabitName } = useHabits()

const form = reactive<{
  name: string
  description: string
  condition: string
  goal: number
  jokers: number
  type: HabitType
  overflowType: OverflowType
  trackingMode: TrackingMode
  gaugeDecimals: boolean
  startDate: string
  endDate: string
  dateEnabled: boolean
  goalKind: GoalKind
  repeatRate: RepeatRate
}>({
  name: '',
  description: '',
  condition: '',
  goal: 7,
  jokers: 0,
  type: 'positive',
  overflowType: 'positive',
  trackingMode: 'peg',
  gaugeDecimals: false,
  startDate: '',
  endDate: '',
  dateEnabled: false,
  goalKind: 'repetitive',
  repeatRate: 'daily',
})

const similarNames = computed(() => {
  if (!form.name.trim()) return []
  return findSimilarNames(form.name)
})

const lastToggled = ref<'type' | 'overflow'>('type')

watch(() => form.type, () => { lastToggled.value = 'type' })
watch(() => form.overflowType, () => { lastToggled.value = 'overflow' })

watch(() => form.name, () => {
  // recompute similarNames reactively
})

function submit() {
  if (!form.name.trim()) return
  emit('submit', {
    name: form.name.trim(),
    description: form.description.trim(),
    condition: form.condition.trim(),
    goal: form.goal,
    jokers: form.jokers,
    type: form.type,
    overflowType: form.overflowType,
    trackingMode: form.trackingMode,
    gaugeDecimals: form.gaugeDecimals,
    startDate: form.dateEnabled ? form.startDate : '',
    endDate: form.dateEnabled ? form.endDate : '',
    goalKind: form.goalKind,
    repeatRate: form.goalKind === 'repetitive' ? form.repeatRate : null,
  })
}
</script>

<style scoped>
.create-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--neu-text);
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  max-height: 50vh;
  padding: 8px;
  margin: -8px;
  -webkit-overflow-scrolling: touch;
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
  justify-content: center;
}

.field-group--center {
  align-items: center;
}

.flex-1 {
  flex: 1;
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

.neu-input:focus {
  box-shadow: inset 2px 2px 4px var(--neu-shadow-dark),
              inset -2px -2px 4px var(--neu-shadow-light),
              0 0 0 1px color-mix(in srgb, var(--accent, #4ECDC4) 30%, transparent);
}

.type-hint {
  font-size: 11px;
  color: var(--neu-text-light);
  text-align: center;
  margin: 0;
  padding: 4px 8px;
  border-radius: var(--neu-radius-xs);
  background: var(--neu-bg);
  box-shadow: inset 1px 1px 2px var(--neu-shadow-dark),
              inset -1px -1px 2px var(--neu-shadow-light);
}

.similar-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: #e67e22;
  border-radius: var(--neu-radius-sm);
}

.warning-icon {
  font-weight: 900;
  font-size: 16px;
  flex-shrink: 0;
}

.submit-btn {
  border: none;
  padding: 12px;
  border-radius: var(--neu-radius-sm);
  font-size: 15px;
  font-weight: 700;
  color: var(--neu-text);
  cursor: pointer;
  transition: all var(--anim-fast) var(--ease-smooth);
}

.submit-btn:active {
  box-shadow: inset 3px 3px 7px var(--neu-shadow-dark),
              inset -3px -3px 7px var(--neu-shadow-light);
}

.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
