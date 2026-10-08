<template>
  <span :key="animKey" class="animated-counter drop-in">
    {{ displayValue }}
  </span>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  value: number
  duration?: number
}>(), {
  duration: 400,
})

const displayValue = ref(props.value)
const animKey = ref(0)

watch(() => props.value, (newVal, oldVal) => {
  if (newVal === oldVal) return
  animKey.value++
  const start = oldVal ?? 0
  const diff = newVal - start
  const startTime = performance.now()

  function tick(now: number) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / props.duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    displayValue.value = Math.round(start + diff * eased)
    if (progress < 1) {
      requestAnimationFrame(tick)
    } else {
      displayValue.value = newVal
    }
  }
  requestAnimationFrame(tick)
})
</script>

<style scoped>
.animated-counter {
  font-weight: 600;
  font-size: 12px;
  color: var(--neu-text);
  display: inline-block;
  min-width: 1.2em;
  text-align: center;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.drop-in {
  animation: drop-in 0.15s ease-out;
}

@keyframes drop-in {
  0% {
    transform: scale(2.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
