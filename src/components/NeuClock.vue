<template>
  <div class="neu-clock">
    <!-- Analog face -->
    <div class="clock-face neu-carved" ref="faceRef">
      <!-- Tick marks -->
      <div
        v-for="tick in ticks"
        :key="tick.index"
        class="clock-tick"
        :class="{ 'clock-tick--hour': tick.isHour }"
        :style="{ transform: `rotate(${tick.angle}deg)` }"
      >
        <span class="tick-line" :class="{ 'tick-line--hour': tick.isHour }"></span>
        <span v-if="tick.isHour" class="tick-number" :style="{ transform: `rotate(${-tick.angle}deg)` }">
          {{ tick.label }}
        </span>
      </div>

      <!-- Hands -->
      <div
        class="clock-hand clock-hand--hour"
        :class="{ 'clock-hand--dragging': draggingHand === 'hour' }"
        :style="{ transform: `rotate(${hourDisplayAngle}deg)` }"
      >
        <span class="hand-shape hand-shape--hour"></span>
        <span class="hand-grab" @pointerdown.stop="onHandDown($event, 'hour')"></span>
      </div>
      <div
        class="clock-hand clock-hand--minute"
        :class="{ 'clock-hand--dragging': draggingHand === 'minute' }"
        :style="{ transform: `rotate(${minuteDisplayAngle}deg)` }"
      >
        <span class="hand-shape hand-shape--minute"></span>
        <span class="hand-grab" @pointerdown.stop="onHandDown($event, 'minute')"></span>
      </div>
      <div
        class="clock-hand clock-hand--second"
        :class="secondHandClasses"
        :style="{ transform: `rotate(${secondDisplayAngle}deg)` }"
      >
        <span class="hand-shape hand-shape--second"></span>
        <span class="hand-grab hand-grab--second" @pointerdown.stop="onHandDown($event, 'second')"></span>
      </div>

      <!-- Digital readout embedded in face -->
      <div class="clock-digital neu-carved-sm">
        <span class="digital-time">{{ digitalTime }}</span>
      </div>

      <!-- Center cap -->
      <div class="clock-center neu-raised"></div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

defineEmits<{
  close: []
}>()

type HandId = 'hour' | 'minute' | 'second'

const faceRef = ref<HTMLElement | null>(null)
const now = ref(new Date())

// Drag state
const draggingHand = ref<HandId | null>(null)
const dragAngle = ref(0)
const springingHand = ref<HandId | null>(null)
const springFrom = ref(0)
const springStart = ref(0)
const SPRING_DURATION = 600
const frameTick = ref(0)

let rafId: number | null = null
let faceCenter = { x: 0, y: 0 }

const ticks = computed(() => {
  const arr: { index: number; angle: number; isHour: boolean; label: number }[] = []
  for (let i = 0; i < 60; i++) {
    const angle = i * 6
    const isHour = i % 5 === 0
    const label = i / 5 === 0 ? 12 : i / 5
    arr.push({ index: i, angle, isHour, label })
  }
  return arr
})

const displayDate = computed(() => now.value)

const hourAngle = computed(() => {
  const h = displayDate.value.getHours() % 12
  const m = displayDate.value.getMinutes()
  const s = displayDate.value.getSeconds()
  return (h * 30) + (m * 0.5) + (s * (0.5 / 60))
})

const minuteAngle = computed(() => {
  const m = displayDate.value.getMinutes()
  const s = displayDate.value.getSeconds()
  return (m * 6) + (s * 0.1)
})

const secondAngle = computed(() => {
  const s = displayDate.value.getSeconds()
  const ms = displayDate.value.getMilliseconds()
  return (s * 6) + (ms * 0.006)
})

// Spring easing ; overshoot bounce
function springEase(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Display angles: use drag/spring override when active, otherwise real time
// frameTick is referenced to force recompute every RAF frame during spring
const hourDisplayAngle = computed(() => {
  void frameTick.value
  if (draggingHand.value === 'hour') return dragAngle.value
  if (springingHand.value === 'hour') {
    const elapsed = performance.now() - springStart.value
    const t = Math.min(elapsed / SPRING_DURATION, 1)
    const eased = springEase(t)
    return springFrom.value + (hourAngle.value - springFrom.value) * eased
  }
  return hourAngle.value
})

const minuteDisplayAngle = computed(() => {
  void frameTick.value
  if (draggingHand.value === 'minute') return dragAngle.value
  if (springingHand.value === 'minute') {
    const elapsed = performance.now() - springStart.value
    const t = Math.min(elapsed / SPRING_DURATION, 1)
    const eased = springEase(t)
    return springFrom.value + (minuteAngle.value - springFrom.value) * eased
  }
  return minuteAngle.value
})

const secondDisplayAngle = computed(() => {
  void frameTick.value
  if (draggingHand.value === 'second') return dragAngle.value
  if (springingHand.value === 'second') {
    const elapsed = performance.now() - springStart.value
    const t = Math.min(elapsed / SPRING_DURATION, 1)
    const eased = springEase(t)
    return springFrom.value + (secondAngle.value - springFrom.value) * eased
  }
  return secondAngle.value
})

const secondHandClasses = computed(() => ({
  'clock-hand--dragging': draggingHand.value === 'second',
  'clock-hand--springing': springingHand.value === 'second',
}))

const digitalTime = computed(() => {
  const d = displayDate.value
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  const s = d.getSeconds().toString().padStart(2, '0')
  return `${h}:${m}:${s}`
})

function tick() {
  now.value = new Date()
  // Clear spring when done
  if (springingHand.value) {
    const elapsed = performance.now() - springStart.value
    if (elapsed >= SPRING_DURATION) {
      springingHand.value = null
    }
  }
  frameTick.value++
  rafId = requestAnimationFrame(tick)
}

function getPointerAngle(e: PointerEvent): number {
  const dx = e.clientX - faceCenter.x
  const dy = e.clientY - faceCenter.y
  return Math.atan2(dy, dx) * (180 / Math.PI) + 90
}

function onHandDown(e: PointerEvent, hand: HandId) {
  if (!faceRef.value) return
  const rect = faceRef.value.getBoundingClientRect()
  faceCenter = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
  const currentAngles: Record<HandId, number> = {
    hour: hourDisplayAngle.value,
    minute: minuteDisplayAngle.value,
    second: secondDisplayAngle.value,
  }
  dragAngle.value = currentAngles[hand]
  draggingHand.value = hand
  springingHand.value = null
  window.addEventListener('pointermove', onHandMove)
  window.addEventListener('pointerup', onHandUp)
}

function onHandMove(e: PointerEvent) {
  if (!draggingHand.value) return
  const angle = getPointerAngle(e)
  // Normalize to stay near previous value to avoid jumps
  let delta = angle - dragAngle.value
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  dragAngle.value += delta
}

function onHandUp() {
  if (!draggingHand.value) return
  const hand = draggingHand.value
  const currentAngles: Record<HandId, number> = {
    hour: hourAngle.value,
    minute: minuteAngle.value,
    second: secondAngle.value,
  }
  springFrom.value = dragAngle.value
  springStart.value = performance.now()
  springingHand.value = hand
  draggingHand.value = null
  window.removeEventListener('pointermove', onHandMove)
  window.removeEventListener('pointerup', onHandUp)
}

onMounted(() => {
  rafId = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
  window.removeEventListener('pointermove', onHandMove)
  window.removeEventListener('pointerup', onHandUp)
})
</script>

<style scoped>
.neu-clock {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 8px 0 4px;
}

/* ── Analog face ─────────────────────────────── */
.clock-face {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  flex-shrink: 0;
}

.clock-tick {
  position: absolute;
  left: 50%;
  top: 0;
  width: 2px;
  height: 50%;
  transform-origin: bottom center;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.tick-line {
  width: 1px;
  height: 6px;
  background: var(--neu-shadow-dark);
  margin-top: 4px;
  border-radius: 1px;
  flex-shrink: 0;
}

.tick-line--hour {
  width: 2px;
  height: 10px;
  background: var(--neu-text-light);
}

.tick-number {
  position: absolute;
  top: 16px;
  font-size: 11px;
  font-weight: 700;
  color: var(--neu-text-light);
  transform-origin: center;
}

/* ── Hands ───────────────────────────────────── */
.clock-hand {
  position: absolute;
  left: 50%;
  bottom: 50%;
  transform-origin: bottom center;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  z-index: 2;
}

.clock-hand--hour {
  z-index: 4;
}

.clock-hand--minute {
  z-index: 3;
}

.clock-hand--second {
  z-index: 5;
}

/* Grab handle at the tip of each hand */
.hand-grab {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: grab;
  pointer-events: auto;
  touch-action: none;
  z-index: 10;
}

.hand-grab--second {
  width: 20px;
  height: 20px;
  top: -8px;
}

.clock-hand--dragging .hand-grab {
  cursor: grabbing;
}

/* When dragging, disable transitions for 1:1 tracking */
.clock-hand--dragging {
  transition: none !important;
}

/* Spring-back transition on release */
.clock-hand--springing {
  transition: none !important;
}

.hand-shape {
  border-radius: var(--neu-radius-xs);
  background: var(--neu-text);
  box-shadow: 1px 1px 2px var(--neu-shadow-dark);
}

.hand-shape--hour {
  width: 4px;
  height: 50px;
}

.hand-shape--minute {
  width: 3px;
  height: 72px;
}

.hand-shape--second {
  width: 2px;
  height: 82px;
  background: var(--accent);
  box-shadow: 0 0 4px color-mix(in srgb, var(--accent) 50%, transparent);
}

/* Enlarge grab area visual hint on hover */
.hand-grab:hover {
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 30%, transparent);
}

/* ── Center cap ──────────────────────────────── */
.clock-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  z-index: 6;
}

/* ── Digital readout (embedded in face) ─────── */
.clock-digital {
  position: absolute;
  top: 62%;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 12px;
  border-radius: var(--neu-radius-sm);
  z-index: 1;
  pointer-events: none;
}

.digital-time {
  display: inline-block;
  font-size: 13px;
  font-weight: 700;
  color: var(--neu-text-light);
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
}
</style>
