<template>
  <div
    class="micro-dial-scale-wrapper"
    :class="`micro-dial-scale-wrapper--${orientation}`"
    :style="{ '--dial-scale': scale }"
  >
    <div
      ref="dialRef"
      class="micro-dial neu-carved"
      :class="`micro-dial--${orientation}`"
      :style="{ '--accent': accentColor, transform: `scale(var(--dial-scale))` }"
      @pointerdown.stop="onPointerDown"
    >
    <div class="micro-dial-window">
      <div class="micro-dial-track" :style="{ transform: isHorizontal ? `translateX(${scrollOffset}px)` : `translateY(${scrollOffset}px)` }">
        <div
          v-for="line in lines"
          :key="line.value"
          class="micro-line"
          :class="{ 'micro-line--active': line.offset === 0, 'micro-line--faded': !line.inRange }"
        >
          <span class="micro-line-mark"></span>
          <span v-if="line.inRange" class="micro-line-value">{{ line.value }}</span>
        </div>
      </div>
    </div>
    <div class="micro-center-indicator"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch } from 'vue'

const props = withDefaults(defineProps<{
  value: number
  maxValue: number
  accentColor?: string
  orientation?: 'vertical' | 'horizontal'
  scale?: number
}>(), {
  accentColor: '#4ECDC4',
  orientation: 'vertical',
  scale: 1,
})

const isHorizontal = computed(() => props.orientation === 'horizontal')

const emit = defineEmits<{
  'update:value': [value: number]
}>()

const VISIBLE_LINES = 8
const BUFFER_LINES = 8
const LINE_HEIGHT = 28

const dialRef = ref<HTMLElement | null>(null)
const offset = ref(0)

const scrollOffset = computed(() => {
  return (props.value - 1) * LINE_HEIGHT - offset.value
})

const lines = computed(() => {
  const arr: { value: number; offset: number; inRange: boolean }[] = []
  const half = Math.floor(VISIBLE_LINES / 2) + BUFFER_LINES
  for (let i = -half; i <= half; i++) {
    const val = props.value + i
    arr.push({ value: val, offset: i, inRange: val >= 1 && val <= props.maxValue })
  }
  return arr
})

let isDragging = false
let startPos = 0
let startOffset = 0

function onPointerDown(e: PointerEvent) {
  if (!dialRef.value) return
  isDragging = true
  startPos = isHorizontal.value ? e.clientX : e.clientY
  startOffset = offset.value
  dialRef.value.setPointerCapture(e.pointerId)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging) return
  const currentPos = isHorizontal.value ? e.clientX : e.clientY
  offset.value = startOffset + (startPos - currentPos) / props.scale

  const rawValue = 1 + Math.round(offset.value / LINE_HEIGHT)
  const clamped = Math.min(Math.max(rawValue, 1), props.maxValue)
  if (clamped !== props.value) {
    emit('update:value', clamped)
  }
}

function onPointerUp() {
  isDragging = false
  offset.value = (props.value - 1) * LINE_HEIGHT
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}

watch(() => props.value, (val) => {
  if (!isDragging) {
    offset.value = (val - 1) * LINE_HEIGHT
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
})
</script>

<style scoped>
.micro-dial-scale-wrapper {
  position: relative;
  width: calc(60px * var(--dial-scale));
  height: calc(220px * var(--dial-scale));
  flex-shrink: 0;
}

.micro-dial-scale-wrapper--horizontal {
  width: calc(220px * var(--dial-scale));
  height: calc(60px * var(--dial-scale));
}

.micro-dial {
  position: relative;
  width: 60px;
  height: 220px;
  transform-origin: top left;
  border-radius: var(--neu-radius-sm);
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  cursor: ns-resize;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.micro-dial--horizontal {
  width: 220px;
  height: 60px;
  cursor: ew-resize;
  flex-direction: row;
}

.micro-dial-window {
  position: relative;
  flex: 1;
  width: 100%;
  overflow: hidden;
}

.micro-dial-track {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform var(--anim-fast) var(--ease-smooth);
}

.micro-dial--horizontal .micro-dial-track {
  flex-direction: row;
}

.micro-dial:active .micro-dial-track {
  transition: none;
}

.micro-line {
  height: 28px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.micro-dial--horizontal .micro-line {
  width: 28px;
  height: auto;
  flex-direction: column;
}

.micro-line-mark {
  width: 18px;
  height: 1px;
  background: var(--neu-shadow-dark);
  border-radius: 1px;
  transition: background var(--anim-fast) var(--ease-smooth), box-shadow var(--anim-fast) var(--ease-smooth);
}

.micro-dial--horizontal .micro-line-mark {
  width: 1px;
  height: 18px;
}

.micro-line--active .micro-line-mark {
  background: var(--accent);
  box-shadow: 0 0 6px color-mix(in srgb, var(--accent) 50%, transparent);
}

.micro-line-value {
  font-size: 9px;
  font-weight: 700;
  color: var(--neu-text-light);
  transition: color var(--anim-fast) var(--ease-smooth);
}

.micro-line--active .micro-line-value {
  color: var(--accent);
}

.micro-center-indicator {
  position: absolute;
  top: 50%;
  left: 4px;
  right: 4px;
  width: 32px;
  height: 2px;
  transform: translate(0, -50%);
  background: var(--accent);
  border-radius: 1px;
  box-shadow: 0 0 6px color-mix(in srgb, var(--accent) 50%, transparent);
  pointer-events: none;
  z-index: 2;
}

.micro-dial--horizontal .micro-center-indicator {
  top: 4px;
  bottom: 4px;
  left: 50%;
  right: auto;
  width: 2px;
  height: 32px;
  transform: translate(-50%, 0);
}
</style>
