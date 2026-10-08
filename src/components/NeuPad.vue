<template>
  <button
    type="button"
    class="neu-pad"
    :class="`neu-pad--${shape}`"
    :style="{ width: padSize, height: padSize }"
    @click="$emit('activate')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  padSize?: string
  shape?: 'circle' | 'diamond'
}>(), {
  padSize: '38px',
  shape: 'circle',
})

defineEmits<{
  activate: []
}>()
</script>

<style scoped>
.neu-pad {
  border: 0px solid transparent;
  position: relative;
  border-radius: 100vw;
  aspect-ratio: 1 / 1;
  cursor: pointer;
  padding: 0;
  box-sizing: border-box;
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    4px 4px 10px var(--neu-shadow-dark),
    -4px -4px 10px var(--neu-shadow-light);
  background: linear-gradient(145deg, var(--neu-bg-dark), var(--neu-bg-light));
  transition: box-shadow var(--anim-fast) ease,
              background var(--anim-fast) var(--ease-bounce, ease),
              border var(--anim-fast) var(--ease-bounce, ease),
              transform var(--anim-fast) ease;
}

.neu-pad:active {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    0 0 0 0 var(--neu-shadow-dark),
    0 0 0 0 var(--neu-shadow-light);
  border: 0.2px solid rgba(128, 128, 128, 0.2);
}

/* ---- Diamond shape ---- */
.neu-pad--diamond {
  border-radius: 3px;
}

.neu-pad--diamond:active {
  border-radius: 3px;
}
</style>
