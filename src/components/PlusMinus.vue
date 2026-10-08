<template>
  <div class="plus-minus">
    <div class="plus-minus-pad plus-minus-pad--vertical"></div>
    <div class="plus-minus-pad plus-minus-pad--horizontal"></div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
/* ---- L1: parent ; shape vars + layer positioning ---- */
.plus-minus {
  --pad-w: 40px;
  --pad-h: 10px;
  --pad-radius: 5px;
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

/* ---- Pad base ; shared shape + horizontal shadow ---- */
.plus-minus-pad {
  width: var(--pad-w);
  height: var(--pad-h);
  position: absolute;
  z-index: 2;
  border-radius: var(--pad-radius);
  background: var(--color-base);
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    4px 4px 10px #b6b6b5,
    -4px -4px 10px #ebebeb;
}

/* ---- Vertical bar ; same shape, rotated 90deg ---- */
.plus-minus-pad--vertical::before {
  content: '';
  display: block;
  position: absolute;
  width: inherit;
  height: inherit;
  border-radius: inherit;
  background: inherit;
  box-shadow:
    inset 1px -1px 2px 0 rgba(255, 255, 255, 0.8),
    4px -4px 10px #b6b6b5,
    -4px 4px 10px #ebebeb;
  transform: rotate(90deg);
}

  /* Cover: masks shadow clash at the intersection of vertical + horizontal bars */
  .plus-minus-pad--vertical::after {
    content: '';
    display: block;
    position: absolute;
    width: inherit;
    height: inherit;
    border-radius: inherit;
    background: inherit;
  }
</style>