<template>
  <button
    class="neu-toggle neu-press-sm"
    :class="{ 'neu-toggle--on': modelValue }"
    role="switch"
    :aria-checked="modelValue"
    @click="modelValue = !modelValue"
  >
    <span class="neu-toggle-thumb"></span>
  </button>
</template>

<script setup lang="ts">
const modelValue = defineModel<boolean>({ default: false })
</script>

<style scoped>
.neu-toggle {
  position: relative;
  width: 44px;
  height: 24px;
  border: none;
  border-radius: 12px;
  background: var(--neu-bg);
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: inset 2px 2px 4px var(--neu-shadow-dark),
              inset -2px -2px 4px var(--neu-shadow-light);
  transition: box-shadow var(--anim-fast) var(--ease-smooth);
}

.neu-toggle--on {
  box-shadow: inset 2px 2px 4px var(--neu-shadow-dark),
              inset -2px -2px 4px var(--neu-shadow-light),
              0 0 0 1px color-mix(in srgb, var(--accent, #4ECDC4) 40%, transparent);
}

.neu-toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--neu-bg);
  box-shadow: 1px 1px 3px var(--neu-shadow-dark),
              -1px -1px 3px var(--neu-shadow-light);
  transition: transform var(--anim-fast) var(--ease-smooth),
              background var(--anim-fast) var(--ease-smooth);
}

.neu-toggle--on .neu-toggle-thumb {
  transform: translateX(20px);
  background: color-mix(in srgb, var(--accent, #4ECDC4) 60%, var(--neu-bg));
}

.neu-toggle:active {
  box-shadow: inset 3px 3px 7px var(--neu-shadow-dark),
              inset -3px -3px 7px var(--neu-shadow-light);
}
</style>
