<template>
  <button type="button" class="neu-up-down" @click="$emit('activate')">
    <div class="neu-caret" :class="`neu-caret--${direction}`"></div>
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  direction?: 'up' | 'down' | 'left' | 'right'
}>(), {
  direction: 'up',
})

defineEmits<{
  activate: []
}>()
</script>

<style scoped>
.neu-up-down {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

/* Diamond caret ; rotated square with same shadow system as pads */
.neu-caret {
  width: 20px;
  height: 20px;
  background: var(--color-base, #eaeae8);
  border-radius: 3px;
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    4px 4px 10px #b6b6b5,
    -4px -4px 10px #ebebeb;
  transform: rotate(45deg);
  transition: box-shadow var(--anim-fast) ease;
}

.neu-up-down:active .neu-caret {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    1px 1px 3px #b6b6b5,
    -1px -1px 3px #ebebeb;
}

/* ---- Direction variants ---- */
.neu-caret--down {
  transform: rotate(225deg);
}

.neu-caret--left {
  transform: rotate(-45deg);
}

.neu-caret--right {
  transform: rotate(135deg);
}
</style>
