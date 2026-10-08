<template>
  <div class="field-group" :class="{ 'field-group--fill': fill }">
    <label class="field-label">{{ label }}</label>
    <div class="stepper neu-carved-sm" :class="{ 'stepper--fill': fill }">
      <button class="stepper-btn neu-press-sm" @click="decrement" :disabled="modelValue <= min">
        <span>-</span>
      </button>
      <div class="counter-wrapper" :style="{ minWidth: counterMinWidth }">
        <input
          :value="modelValue"
          @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
          class="stepper-input"
          type="number"
          :min="min"
          :max="max"
          inputmode="numeric"
        />
      </div>
      <button class="stepper-btn neu-press-sm" @click="increment" :disabled="modelValue >= max">
        <span>+</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: number
  label: string
  min?: number
  max?: number
  fill?: boolean
}>(), {
  min: 0,
  max: 99,
  fill: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const counterMinWidth = computed(() => {
  const digits = String(props.max).length
  return `${digits + 1}ch`
})

function increment() {
  if (props.modelValue < props.max) emit('update:modelValue', props.modelValue + 1)
}

function decrement() {
  if (props.modelValue > props.min) emit('update:modelValue', props.modelValue - 1)
}
</script>

<style scoped>
.field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.field-group--fill {
  width: 100%;
}

.field-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--neu-text-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: var(--neu-radius-sm);
  gap: 4px;
  width: fit-content;
}

.stepper--fill {
  width: 100%;
}

.counter-wrapper {
  flex: 1;
  text-align: center;
  min-width: 0;
}

.stepper-input {
  border: none;
  background: transparent;
  outline: none;
  width: 100%;
  min-width: 0;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--neu-text);
  font-family: inherit;
  -moz-appearance: textfield;
  appearance: textfield;
}

.stepper-input::-webkit-outer-spin-button,
.stepper-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.stepper-btn {
  border: 0px solid transparent;
  background: var(--neu-bg);
  width: 26px;
  height: 26px;
  border-radius: 100vw;
  font-size: 16px;
  font-weight: 700;
  color: var(--neu-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    2px 2px 4px var(--neu-shadow-dark),
    -2px -2px 4px var(--neu-shadow-light);
  transition: box-shadow var(--anim-fast) ease,
              border var(--anim-fast) var(--ease-bounce, ease);
}

.stepper-btn:active {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    0 0 0 0 var(--neu-shadow-dark),
    0 0 0 0 var(--neu-shadow-light);
  border: 0.2px solid rgba(128, 128, 128, 0.2);
}

.stepper-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
