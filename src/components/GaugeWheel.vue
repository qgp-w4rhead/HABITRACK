<template>
  <div class="gauge-wheel" :style="{ '--accent': accentColor }">
    <div class="dial-row">
      <MicroDial
        v-if="isChunked && decimals"
        :value="intPart"
        :max-value="maxVal"
        :accent-color="accentColor"
        :scale="0.8"
        @update:value="onMicroUpdate"
      />
      <div v-else-if="isChunked || decimals" class="dial-spacer"></div>
      <div
        ref="wheelRef"
        class="wheel-container neu-carved"
        @pointerdown="onPointerDown"
      >
        <div class="wheel-track" :style="{ transform: `rotate(${rotation}deg)` }">
          <div
            v-for="tick in ticks"
            :key="tick.value"
            class="wheel-tick"
            :class="{ 'wheel-tick--major': tick.value % majorInterval === 0, 'wheel-tick--active': tick.value === currentTickValue }"
            :style="{ transform: `rotate(${tick.angle}deg)` }"
          >
            <span class="tick-mark"></span>
            <span v-if="tick.value % majorInterval === 0" class="tick-label">{{ tick.value }}</span>
          </div>
        </div>
        <button
          ref="centerBtnRef"
          class="wheel-center neu-raised"
          :class="{ 'wheel-center--pressed': isPressed, 'wheel-center--releasing': isReleasing }"
          @click="onConfirm"
          @pointerdown.stop="onCenterDown"
          @pointerup="onCenterUp"
          @pointerleave="onCenterUp"
          aria-label="Add value"
        >
          <span class="center-value">{{ displayValue }}</span>
        </button>
        <div class="wheel-pointer"></div>
      </div>

      <MicroDial
        v-if="decimals"
        :value="totalTenths"
        :min="-10"
        :max-value="maxTenthsIndex"
        :accent-color="accentColor"
        :scale="isChunked ? 0.8 : 1"
        :format-value="formatDecimalValue"
        @update:value="onTenthsUpdate"
      />
      <MicroDial
        v-else-if="isChunked"
        :value="intPart"
        :max-value="maxVal"
        :accent-color="accentColor"
        @update:value="onMicroUpdate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import MicroDial from './MicroDial.vue'

const props = withDefaults(defineProps<{
  value: number
  goal: number
  accentColor?: string
  habitName?: string
  decimals?: boolean
}>(), {
  accentColor: '#4ECDC4',
  habitName: '',
  decimals: false,
})

const emit = defineEmits<{
  close: []
  confirm: [value: number]
}>()

const wheelRef = ref<HTMLElement | null>(null)
const centerBtnRef = ref<HTMLElement | null>(null)
const currentValue = ref(Math.max(props.value, 1))
const rotation = ref(0)
const isPressed = ref(false)
const isReleasing = ref(false)

// In decimals mode the wheel still selects the integer part only; the micro
// dial becomes an infinite tenths scale showing the full value (0.9, 1, 1.1
// …) — it emits an unbounded tenths index so carrying into the integer just
// falls out of the index itself.
const intPart = computed(() => Math.floor(currentValue.value))
const frac = computed(() => currentValue.value - intPart.value)
const totalTenths = computed(() => Math.round((currentValue.value - 1) * 10))
const maxTenthsIndex = computed(() => (maxVal.value - 1) * 10)
const displayValue = computed(() => props.decimals ? currentValue.value.toFixed(1) : String(currentValue.value))
// Tenths index → full value label (index 0 = 1.0, −10 = 0.0, 65 = 7.5).
const formatDecimalValue = (v: number) => String((v + 10) / 10)

function onCenterDown() {
  if (isReleasing.value) {
    isReleasing.value = false
  }
  isPressed.value = true
}

function onCenterUp() {
  if (!isPressed.value) return
  isPressed.value = false
  isReleasing.value = true
  centerBtnRef.value?.addEventListener('animationend', () => {
    isReleasing.value = false
  }, { once: true })
}

const maxVal = computed(() => Math.max(props.goal, 10))

const MAX_VISUAL_TICKS = 100
const chunkSize = computed(() => {
  if (maxVal.value <= MAX_VISUAL_TICKS) return 1
  const raw = Math.ceil(maxVal.value / MAX_VISUAL_TICKS)
  const niceNumbers = [2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]
  for (const n of niceNumbers) {
    if (n >= raw) return n
  }
  return raw
})

const visualTickCount = computed(() => Math.ceil(maxVal.value / chunkSize.value))
const anglePerTick = computed(() => 360 / visualTickCount.value)
const majorInterval = computed(() => (chunkSize.value === 1 ? 5 : chunkSize.value * 5))

function tickToValue(tickIndex: number): number {
  if (chunkSize.value === 1) return tickIndex + 1
  return Math.min((tickIndex + 1) * chunkSize.value, maxVal.value)
}

// The wheel only carries whole values: decimals floor to the integer part
// (clamped at tick 1 — the tenths dial can take the value below 1).
function valueToTickIndex(val: number): number {
  if (chunkSize.value === 1) return Math.max(Math.floor(val) - 1, 0)
  const idx = Math.max(Math.floor(val / chunkSize.value) - 1, 0)
  return ((idx % visualTickCount.value) + visualTickCount.value) % visualTickCount.value
}

const ticks = computed(() => {
  const arr: { value: number; angle: number }[] = []
  for (let i = 0; i < visualTickCount.value; i++) {
    arr.push({ value: tickToValue(i), angle: i * anglePerTick.value })
  }
  return arr
})

const isChunked = computed(() => chunkSize.value > 1)
const currentTickIndex = computed(() => valueToTickIndex(currentValue.value))
const currentTickValue = computed(() => tickToValue(currentTickIndex.value))

let isDragging = false
let lastAngle = 0
let wheelCenter = { x: 0, y: 0 }

function getAngle(e: PointerEvent): number {
  const dx = e.clientX - wheelCenter.x
  const dy = e.clientY - wheelCenter.y
  return Math.atan2(dy, dx) * (180 / Math.PI)
}

function onPointerDown(e: PointerEvent) {
  if (!wheelRef.value) return
  const rect = wheelRef.value.getBoundingClientRect()
  wheelCenter = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
  lastAngle = getAngle(e)
  isDragging = true
  wheelRef.value.setPointerCapture(e.pointerId)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging) return
  const angle = getAngle(e)
  let delta = angle - lastAngle
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  rotation.value += delta
  lastAngle = angle

  const rawTickIndex = Math.trunc(-rotation.value / anglePerTick.value)
  const clamped = ((rawTickIndex % visualTickCount.value) + visualTickCount.value) % visualTickCount.value
  const intTick = Math.min(Math.max(tickToValue(clamped), 1), maxVal.value)
  // Whole ticks move the integer part; any decimal fraction rides along.
  currentValue.value = props.decimals
    ? Math.min(intTick + frac.value, maxVal.value)
    : intTick
}

function onPointerUp() {
  isDragging = false
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  snapToTick()
}

function snapToTick() {
  const tickIndex = valueToTickIndex(currentValue.value)
  const targetAngle = -tickIndex * anglePerTick.value
  const currentMod = ((rotation.value % 360) + 360) % 360
  const targetMod = ((targetAngle % 360) + 360) % 360
  let diff = targetMod - currentMod
  if (diff > 180) diff -= 360
  if (diff < -180) diff += 360
  rotation.value += diff
}

function onMicroUpdate(val: number) {
  currentValue.value = props.decimals
    ? Math.min(val + frac.value, maxVal.value)
    : val
}

// The tenths dial emits an absolute tenths index (0 … maxTenthsIndex), so
// carrying past .9 and borrowing below .0 happen inside the value itself.
function onTenthsUpdate(index: number) {
  currentValue.value = (10 + index) / 10
}

function onConfirm() {
  emit('confirm', props.decimals ? Math.round(currentValue.value * 10) / 10 : currentValue.value)
}

onMounted(() => {
  const tickIndex = valueToTickIndex(currentValue.value)
  rotation.value = -tickIndex * anglePerTick.value
})

// Sync big wheel rotation when micro dial changes value
watch(currentValue, (val) => {
  if (!isDragging) {
    const tickIndex = valueToTickIndex(val)
    const targetAngle = -tickIndex * anglePerTick.value
    let diff = targetAngle - rotation.value
    diff = ((diff % 360) + 360) % 360
    if (diff > 180) diff -= 360
    rotation.value += diff
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
})
</script>

<style scoped>
.gauge-wheel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
  overflow: hidden;
}

.dial-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.dial-spacer {
  width: 60px;
  flex-shrink: 0;
}

.wheel-container {
  position: relative;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.wheel-container:active {
  cursor: grabbing;
}

.wheel-track {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  transition: transform var(--anim-fast) var(--ease-smooth);
}

.wheel-container:active .wheel-track {
  transition: none;
}

.wheel-tick {
  position: absolute;
  left: 0;
  right: 0;
  margin: 0 auto;
  top: 0;
  width: 2px;
  height: 50%;
  transform-origin: bottom center;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.tick-mark {
  width: 2px;
  height: 10px;
  background: var(--neu-shadow-dark);
  margin-top: 6px;
  border-radius: 1px;
  flex-shrink: 0;
  transition: background var(--anim-fast) var(--ease-smooth), height var(--anim-fast) var(--ease-smooth), width var(--anim-fast) var(--ease-smooth), box-shadow var(--anim-fast) var(--ease-smooth);
}

.wheel-tick--major .tick-mark {
  height: 16px;
  width: 3px;
  background: var(--neu-text-light);
}

.wheel-tick--active .tick-mark {
  background: var(--accent);
  height: 16px;
  width: 3px;
  box-shadow: 0 0 6px color-mix(in srgb, var(--accent) 50%, transparent);
}

.tick-label {
  position: absolute;
  top: 24px;
  font-size: 10px;
  font-weight: 700;
  color: var(--neu-text-light);
  transform: translateX(-50%);
  left: 50%;
  transition: color var(--anim-fast) var(--ease-smooth);
}

.wheel-tick--active .tick-label {
  color: var(--accent);
}

.wheel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  padding: 0;
  border: 0px solid transparent;
  cursor: pointer;
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    inset 0 0 0 0 var(--neu-shadow-dark),
    inset 0 0 0 0 var(--neu-shadow-light),
    4px 4px 10px var(--neu-shadow-dark),
    -4px -4px 10px var(--neu-shadow-light);
  transition: box-shadow var(--anim-fast) ease,
              background var(--anim-fast) var(--ease-bounce, ease),
              border var(--anim-fast) var(--ease-bounce, ease),
              transform var(--anim-fast) ease;
}

.wheel-center--pressed {
  animation: wheel-press var(--anim-fast) linear forwards;
}

.wheel-center--releasing {
  animation: wheel-release var(--anim-fast) linear forwards;
}

@keyframes wheel-press {
  0% {
    box-shadow:
      inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
      inset 0 0 0 0 var(--neu-shadow-dark),
      inset 0 0 0 0 var(--neu-shadow-light),
      4px 4px 10px var(--neu-shadow-dark),
      -4px -4px 10px var(--neu-shadow-light);
  }
  50% {
    box-shadow:
      inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
      inset 0 0 0 0 var(--neu-shadow-dark),
      inset 0 0 0 0 var(--neu-shadow-light),
      0 0 0 0 var(--neu-shadow-dark),
      0 0 0 0 var(--neu-shadow-light);
  }
  100% {
    box-shadow:
      inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
      inset 4px 4px 10px var(--neu-shadow-dark),
      inset -4px -4px 10px var(--neu-shadow-light),
      0 0 0 0 var(--neu-shadow-dark),
      0 0 0 0 var(--neu-shadow-light);
  }
}

@keyframes wheel-release {
  0% {
    box-shadow:
      inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
      inset 4px 4px 10px var(--neu-shadow-dark),
      inset -4px -4px 10px var(--neu-shadow-light),
      0 0 0 0 var(--neu-shadow-dark),
      0 0 0 0 var(--neu-shadow-light);
  }
  50% {
    box-shadow:
      inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
      inset 0 0 0 0 var(--neu-shadow-dark),
      inset 0 0 0 0 var(--neu-shadow-light),
      0 0 0 0 var(--neu-shadow-dark),
      0 0 0 0 var(--neu-shadow-light);
  }
  100% {
    box-shadow:
      inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
      inset 0 0 0 0 var(--neu-shadow-dark),
      inset 0 0 0 0 var(--neu-shadow-light),
      4px 4px 10px var(--neu-shadow-dark),
      -4px -4px 10px var(--neu-shadow-light);
  }
}

.center-value {
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
  transform: translateY(-2px);
  color: var(--neu-text);
}

.wheel-pointer {
  position: absolute;
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 12px solid var(--accent);
  z-index: 3;
  filter: drop-shadow(0 2px 3px var(--neu-shadow-dark));
}

</style>
