<template>
  <component
    :is="tag"
    class="neu-row"
    :class="`neu-row--${state}`"
    @click="$emit('click', $event)"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  state?: 'raised' | 'caved' | 'flat'
  tag?: string
}>(), {
  state: 'raised',
  tag: 'div',
})

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<style scoped>
.neu-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--neu-row-gap, 8px);
  border: 1px solid transparent;
  background: var(--neu-bg);
  padding: var(--neu-row-padding, 12px 14px);
  border-radius: var(--neu-radius-sm);
  font-size: var(--neu-row-font-size, 14px);
  font-weight: 600;
  color: var(--neu-row-color, var(--neu-text));
  cursor: pointer;
  text-align: left;
  transition: box-shadow var(--anim-fast) ease,
              border var(--anim-fast) var(--ease-bounce, ease);
}

/* Raised state (default ; same as .menu-item / .neu-raised) */
.neu-row--raised {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    var(--neu-distance-sm) var(--neu-distance-sm) var(--neu-distance) var(--neu-shadow-dark),
    calc(-1 * var(--neu-distance-sm)) calc(-1 * var(--neu-distance-sm)) var(--neu-distance) var(--neu-shadow-light);
}

/* Caved state (expanded accordion ; inset shadows) */
.neu-row--caved {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    inset var(--neu-distance-sm) var(--neu-distance-sm) var(--neu-distance) var(--neu-shadow-dark),
    inset calc(-1 * var(--neu-distance-sm)) calc(-1 * var(--neu-distance-sm)) var(--neu-distance) var(--neu-shadow-light);
}

/* Flat state (inactive toggle ; transparent shadows, visible border) */
.neu-row--flat {
  border: 1px solid rgba(128, 128, 128, 0.2);
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    var(--neu-distance-sm) var(--neu-distance-sm) var(--neu-distance) transparent,
    calc(-1 * var(--neu-distance-sm)) calc(-1 * var(--neu-distance-sm)) var(--neu-distance) transparent;
}

/* Press behavior (momentary :active for raised and caved) */
.neu-row--raised:active,
.neu-row--caved:active {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    0 0 0 0 var(--neu-shadow-dark),
    0 0 0 0 var(--neu-shadow-light);
  border: 0.2px solid rgba(128, 128, 128, 0.2);
}
</style>
