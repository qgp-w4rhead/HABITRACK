<template>
  <div class="seg-toggle neu-carved-sm" :class="`seg-toggle--${size}`">
    <button
      v-for="opt in options"
      :key="opt.value"
      class="seg-btn"
      :class="{ active: modelValue === opt.value }"
      @click="$emit('update:modelValue', opt.value)"
    >{{ opt.label }}</button>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: string
  options: { label: string; value: string }[]
  size?: 'sm' | 'md'
}>(), {
  size: 'sm',
})

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style scoped>
.seg-toggle {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: var(--neu-radius-sm);
  align-self: flex-start;
}

.seg-btn {
  border: none;
  background: var(--neu-bg);
  border-radius: var(--neu-radius-xs);
  font-weight: 700;
  color: var(--neu-text-light);
  cursor: pointer;
  transition: all var(--anim-fast) var(--ease-smooth);
}

/* sm: compact fixed-size buttons (+ / −) */
.seg-toggle--sm .seg-btn {
  width: 30px;
  height: 24px;
  font-size: 14px;
}

/* md: padding-based buttons for text labels (Peg / Gauge) */
.seg-toggle--md .seg-btn {
  padding: 6px 14px;
  font-size: 12px;
}

.seg-btn.active {
  color: var(--neu-text);
  box-shadow: inset 1px 1px 3px var(--neu-shadow-dark),
              inset -1px -1px 3px var(--neu-shadow-light);
}

.seg-btn:active {
  box-shadow: inset 2px 2px 5px var(--neu-shadow-dark),
              inset -2px -2px 5px var(--neu-shadow-light);
}
</style>
