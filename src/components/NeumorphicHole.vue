<template>
  <div class="neu-hole" :style="{ '--accent': accentColor }">
    <transition name="peg-drop-transition" appear>
      <div
        v-if="filled"
        class="neu-peg"
        :class="{ 'joker-peg': joker }"
        :style="{ background: accentColor, anchorName: anchor }"
        @mouseenter="tipVisible = true"
        @mouseleave="tipVisible = false"
        @touchstart.passive="tipVisible = true"
        @touchend="tipVisible = false"
        @touchcancel="tipVisible = false"
      ></div>
    </transition>
    <!-- Balloon is teleported to body: .holes-scroll has overflow-x:auto and
         would clip a normally positioned tooltip -->
    <Teleport to="body">
      <template v-if="tipVisible && filled">
        <!-- Pointer: a rotated square anchored to the peg edge, straddling
             the balloon's edge so it reads as a nub aimed at the peg.
             As a diamond it reads correctly in both flip orientations. -->
        <div class="peg-tip-arrow" :style="{ positionAnchor: anchor }"></div>
        <div class="peg-tip" :style="{ positionAnchor: anchor }">{{ tipText }}</div>
      </template>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'

const props = withDefaults(defineProps<{
  filled: boolean
  accentColor?: string
  joker?: boolean
  droppedAt?: string | null
}>(), {
  accentColor: '#e0e0e0',
  joker: false,
  droppedAt: null,
})

// Unique CSS anchor name so this hole's balloon locks onto its own peg
const anchor = `--peg-${useId()}`
const tipVisible = ref(false)

const tipText = computed(() => {
  if (props.joker) return 'Joker'
  const d = props.droppedAt ? new Date(props.droppedAt) : null
  if (!d || isNaN(d.getTime())) return 'Unknown'
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
})
</script>

<style scoped>
.neu-hole {
  position: relative;
}

.joker-peg {
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, 0.4) 2px,
    rgba(255, 255, 255, 0.4) 4px
  ) !important;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.3),
              2px 2px 4px var(--neu-shadow-dark),
              -2px -2px 4px var(--neu-shadow-light);
}

.peg-drop-transition-enter-active {
  animation: peg-drop var(--anim-slow) var(--ease-peg-drop) forwards;
}

.peg-drop-transition-leave-active {
  transition: all var(--anim-fast) var(--ease-smooth);
}

.peg-drop-transition-leave-to {
  opacity: 0;
  transform: scale(0) translateY(-50px);
}

@keyframes peg-drop {
  from {
    transform: translateY(-200px) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* Hover balloon showing when the peg was dropped (teleported to body,
   anchored to the peg via CSS anchor positioning). Hidden entirely when
   anchor positioning isn't supported. */
.peg-tip {
  display: none;
}

@supports (anchor-name: --a) {
  .peg-tip {
    display: block;
    position: fixed;
    /* position-anchor comes from the inline style binding */
    position-area: top;
    /* Hug the anchor-adjacent cell edge; flips to the far edge's mirror
       under flip-block so the gap stays between balloon and peg */
    align-self: end;
    /* Centered on the peg; the engine auto-shifts it to stay inside the
       viewport when the peg sits near a horizontal edge */
    justify-self: anchor-center;
    margin-bottom: 4px;
    /* No room above -> flip below the peg */
    position-try-fallbacks: flip-block;
    /* Hide rather than clip when the peg is scrolled out of view */
    position-visibility: anchors-visible;
    padding: 4px 10px;
    border-radius: var(--neu-radius-xs);
    background: var(--neu-bg);
    color: var(--neu-text);
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    box-shadow: inset 1px 1px 1px rgba(255, 255, 255, 0.7),
                3px 3px 6px var(--neu-shadow-dark),
                -3px -3px 6px var(--neu-shadow-light);
    pointer-events: none;
    z-index: 1000;
    animation: peg-tip-in var(--anim-fast) var(--ease-smooth);
  }

  .peg-tip-arrow {
    display: block;
    position: fixed;
    /* position-anchor comes from the inline style binding */
    position-area: top;
    /* Bottom edge of the top cell = the peg's top edge. Flips in tandem
       with the balloon, so the diamond always sits on the peg's side. */
    align-self: end;
    justify-self: anchor-center;
    position-try-fallbacks: flip-block;
    position-visibility: anchors-visible;
    width: 8px;
    height: 8px;
    transform: rotate(45deg);
    background: var(--neu-bg);
    box-shadow: 2px 2px 3px var(--neu-shadow-dark);
    pointer-events: none;
    /* Above the balloon so the pointer nub isn't swallowed by its shadow */
    z-index: 1001;
    animation: peg-tip-in var(--anim-fast) var(--ease-smooth);
  }
}

@keyframes peg-tip-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
</style>
