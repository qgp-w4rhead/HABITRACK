<template>
  <div
    class="stepped-slider"
    :class="{ 'stepped-slider--vertical': vertical, 'stepped-slider--tooltip-left': vertical && tooltipSide === 'left' }"
    :style="{ '--accent': accentColor }"
  >
    <div
      ref="trackRef"
      class="slider-track neu-carved-xs"
      @pointerdown="onPointerDown"
    >
      <div class="slider-fill" :style="vertical ? { height: `${fillPercent}%` } : { width: `${fillPercent}%` }"></div>
      <div class="slider-ticks">
        <div
          v-for="step in tickMarks"
          :key="step.value"
          class="slider-tick"
          :class="{ 'slider-tick--active': step.value === displayValue }"
          :style="vertical ? { top: `${step.percent}%` } : { left: `${step.percent}%` }"
        ></div>
      </div>
      <div
        class="slider-thumb neu-raised"
        :class="{ 'slider-thumb--active': isDragging }"
        :style="vertical ? { top: `${thumbPercent}%` } : { left: `${thumbPercent}%` }"
      >
        <span class="slider-thumb-line"></span>
      </div>
      <div
        class="slider-balloon"
        :class="{ 'slider-balloon--visible': isDragging }"
        :style="vertical ? { top: `${balloonPercent}%` } : { left: `${balloonPercent}%` }"
      >
        <span>{{ displayValue }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch } from 'vue'

const props = withDefaults(defineProps<{
  value: number
  min?: number
  max: number
  step?: number
  accentColor?: string
  vertical?: boolean
  tooltipSide?: 'left' | 'right'
}>(), {
  min: 0,
  step: 1,
  accentColor: '#4ECDC4',
  vertical: false,
  tooltipSide: 'right',
})

const emit = defineEmits<{
  'update:value': [value: number]
  confirm: [value: number]
}>()

const trackRef = ref<HTMLElement | null>(null)
const currentValue = ref(props.value)
const thumbPercent = ref(0)
const balloonPercent = ref(0)

const stepCount = computed(() => Math.round((props.max - props.min) / props.step))
const fillPercent = computed(() => {
  const range = props.max - props.min
  if (range === 0) return 0
  return ((currentValue.value - props.min) / range) * 100
})

const displayValue = computed(() => Math.round(snapToStep(currentValue.value)))

const tickMarks = computed(() => {
  const arr: { value: number; percent: number }[] = []
  for (let i = 1; i < stepCount.value; i++) {
    const val = props.min + i * props.step
    const pct = (i / stepCount.value) * 100
    arr.push({ value: val, percent: props.vertical ? 100 - pct : pct })
  }
  return arr
})

function valueToPercent(val: number): number {
  const range = props.max - props.min
  if (range === 0) return 0
  const pct = ((val - props.min) / range) * 100
  return props.vertical ? 100 - pct : pct
}

function percentToValue(percent: number): number {
  const effectivePercent = props.vertical ? 100 - percent : percent
  const raw = props.min + (effectivePercent / 100) * (props.max - props.min)
  return Math.min(Math.max(raw, props.min), props.max)
}

function snapToStep(val: number): number {
  const steps = Math.round((val - props.min) / props.step)
  return Math.min(Math.max(props.min + steps * props.step, props.min), props.max)
}

let isDragging = ref(false)
let trackRect = { left: 0, width: 0, top: 0, height: 0 }

function onPointerDown(e: PointerEvent) {
  if (!trackRef.value) return
  trackRect = trackRef.value.getBoundingClientRect()
  isDragging.value = true
  trackRef.value.setPointerCapture(e.pointerId)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  updateFromPointer(props.vertical ? e.clientY : e.clientX)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  updateFromPointer(props.vertical ? e.clientY : e.clientX)
}

function updateFromPointer(clientCoord: number) {
  const percent = props.vertical
    ? ((clientCoord - trackRect.top) / trackRect.height) * 100
    : ((clientCoord - trackRect.left) / trackRect.width) * 100
  const raw = percentToValue(percent)
  currentValue.value = raw
  thumbPercent.value = valueToPercent(raw)
  balloonPercent.value = thumbPercent.value
  emit('update:value', raw)
}

function onPointerUp() {
  isDragging.value = false
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  snap()
}

function snap() {
  const snapped = snapToStep(currentValue.value)
  currentValue.value = snapped
  thumbPercent.value = valueToPercent(snapped)
  emit('update:value', snapped)
  emit('confirm', snapped)
}

watch(() => props.value, (val) => {
  if (!isDragging.value) {
    currentValue.value = val
    thumbPercent.value = valueToPercent(val)
  }
})

watch([() => props.min, () => props.max, () => props.step], () => {
  thumbPercent.value = valueToPercent(currentValue.value)
}, { flush: 'post' })

thumbPercent.value = valueToPercent(currentValue.value)
balloonPercent.value = thumbPercent.value

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
})
</script>

<style scoped>
.stepped-slider {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 28px 28px 4px;
}

.stepped-slider--vertical {
  flex-direction: row;
  align-items: stretch;
  justify-content: center;
  height: 100%;
  padding: 8px 8px;
}

.slider-track {
  position: relative;
  height: 28px;
  border-radius: var(--neu-radius-xs);
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  overflow: visible;
}

.stepped-slider--vertical .slider-track {
  width: 25px;
  height: 100%;
  min-height: 120px;
}

.slider-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: var(--neu-radius-xs);
  background: color-mix(in srgb, var(--accent) 20%, transparent);
  transition: width var(--anim-fast) var(--ease-smooth);
  pointer-events: none;
}

.stepped-slider--vertical .slider-fill {
  width: 100%;
  height: 0;
  top: auto;
  bottom: 0;
  transition: height var(--anim-fast) var(--ease-smooth);
}

.slider-track:active .slider-fill {
  transition: none;
}

.slider-ticks {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.slider-tick {
  position: absolute;
  top: 50%;
  width: 2px;
  height: 6px;
  transform: translate(-50%, -50%);
  background: var(--neu-shadow-dark);
  border-radius: 1px;
  transition: background var(--anim-fast) var(--ease-smooth),
              height var(--anim-fast) var(--ease-smooth),
              box-shadow var(--anim-fast) var(--ease-smooth);
}

.stepped-slider--vertical .slider-tick {
  width: 6px;
  height: 2px;
  left: 50%;
  top: auto;
  transform: translate(-50%, -50%);
  transition: background var(--anim-fast) var(--ease-smooth),
              width var(--anim-fast) var(--ease-smooth),
              box-shadow var(--anim-fast) var(--ease-smooth);
}

.stepped-slider--vertical .slider-tick--active {
  width: 10px;
}

.slider-tick--active {
  background: var(--accent);
  height: 10px;
  box-shadow: 0 0 6px color-mix(in srgb, var(--accent) 50%, transparent);
}

.slider-thumb {
  position: absolute;
  top: 50%;
  width: 56px;
  height: 36px;
  border-radius: var(--neu-radius-xs);
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  z-index: 2;
  box-shadow: inset 2px 2px 4px 0 rgba(255, 255, 255, 0.8),
              var(--neu-distance) var(--neu-distance) var(--neu-distance-lg) var(--neu-shadow-dark),
              calc(-1 * var(--neu-distance)) calc(-1 * var(--neu-distance)) var(--neu-distance-lg) var(--neu-shadow-dark);
  transition: left var(--anim-fast) var(--ease-smooth),
              box-shadow var(--anim-fast) var(--ease-smooth);
}

.stepped-slider--vertical .slider-thumb {
  width: 36px;
  height: 24px;
  left: 50%;
  top: 0;
  transition: top var(--anim-fast) var(--ease-smooth),
              box-shadow var(--anim-fast) var(--ease-smooth);
}

.slider-track:active .slider-thumb {
  transition: none;
  cursor: grabbing;
}

.slider-thumb-value {
  font-size: 10px;
  font-weight: 800;
  color: var(--neu-text);
}

.slider-balloon {
  position: absolute;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  padding: 4px 10px;
  border-radius: var(--neu-radius-xs);
  background: var(--neu-bg);
  box-shadow: var(--neu-distance-sm) var(--neu-distance-sm) var(--neu-distance) var(--neu-shadow-dark),
              calc(-1 * var(--neu-distance-sm)) calc(-1 * var(--neu-distance-sm)) var(--neu-distance) var(--neu-shadow-light);
  font-size: 13px;
  font-weight: 800;
  color: var(--neu-text);
  pointer-events: none;
  z-index: 3;
  opacity: 0;
  transition: opacity var(--anim-fast) var(--ease-smooth);
}

.stepped-slider--vertical .slider-balloon {
  bottom: auto;
  left: calc(100% + 8px);
  top: 0;
  transform: translateY(-50%);
}

.stepped-slider--tooltip-left .slider-balloon {
  left: auto;
  right: calc(100% + 8px);
}

.slider-balloon--visible {
  opacity: 1;
}

.slider-balloon::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid var(--neu-bg);
}

.stepped-slider--vertical .slider-balloon::after {
  top: 50%;
  left: auto;
  right: 100%;
  transform: translateY(-50%);
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-right: 5px solid var(--neu-bg);
  border-left: none;
}

.stepped-slider--tooltip-left .slider-balloon::after {
  right: auto;
  left: 100%;
  border-right: none;
  border-left: 5px solid var(--neu-bg);
}

.slider-thumb-line {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 50%;
  width: 1px;
  transform: translateX(-50%);
  background: var(--neu-shadow-dark);
  border-radius: 1px;
  pointer-events: none;
}

.stepped-slider--vertical .slider-thumb-line {
  left: 3px;
  right: 3px;
  top: 50%;
  bottom: auto;
  width: auto;
  height: 1px;
  transform: translateY(-50%);
}
</style>
