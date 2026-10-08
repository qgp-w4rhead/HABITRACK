<template>
  <div class="neu-bulb-wrapper" :style="{ '--bulb-accent': accentColor, '--bulb-size': bulbSize, '--wave-room': waveRoom }">
    <button
      type="button"
      class="neu-bulb"
      :class="{ 'neu-bulb--active': isAnimating, 'neu-bulb--no-blur': !showWaves }"
      @click="handleClick"
    >
      <svg
        v-if="!hideSigil"
        class="neu-bulb__io"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      >
        <defs>
          <filter :id="filterId" x="-50%" y="-50%" width="200%" height="200%">
            <!-- Inner dark shadow (bottom-right interior) -->
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.6" result="blurDark" />
            <feOffset in="blurDark" dx="0.5" dy="0.5" result="offsetDark" />
            <feFlood flood-color="black" flood-opacity="0.35" result="floodDark" />
            <feComposite in="floodDark" in2="offsetDark" operator="in" result="coloredDark" />
            <feComposite in="coloredDark" in2="SourceAlpha" operator="in" result="innerDark" />
            <!-- Inner light highlight (top-left interior) -->
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.6" result="blurLight" />
            <feOffset in="blurLight" dx="-0.5" dy="-0.5" result="offsetLight" />
            <feFlood flood-color="white" flood-opacity="0.5" result="floodLight" />
            <feComposite in="floodLight" in2="offsetLight" operator="in" result="coloredLight" />
            <feComposite in="coloredLight" in2="SourceAlpha" operator="in" result="innerLight" />
            <!-- Merge: strokes + inner highlights + inner shadows -->
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="innerLight" />
              <feMergeNode in="innerDark" />
            </feMerge>
          </filter>
        </defs>
        <g :filter="`url(#${filterId})`">
          <path d="M12 3 L12 9" />
          <path d="M7.5 6.5 A 6 6 0 1 0 16.5 6.5" />
        </g>
      </svg>
      <div v-if="showWaves" class="neu-bulb__waves"></div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

let filterCounter = 0

const props = withDefaults(defineProps<{
  hideSigil?: boolean
  showWaves?: boolean
  accentColor?: string
  bulbSize?: string
  waveRoom?: string
}>(), {
  hideSigil: false,
  showWaves: true,
  accentColor: '#00b4d8',
  bulbSize: '200px',
  waveRoom: '80px',
})

const filterId = `neu-io-carve-${filterCounter++}`

const emit = defineEmits<{
  activate: []
}>()

const isAnimating = ref(false)

function handleClick() {
  if (isAnimating.value) return
  isAnimating.value = true
  emit('activate')
  setTimeout(() => {
    isAnimating.value = false
  }, 1500)
}
</script>

<style scoped>
.neu-bulb-wrapper {
  --color-active: oklch(from var(--bulb-accent) l c h);
  --color-active-hover: oklch(from var(--bulb-accent) calc(l + 0.08) c h);
  --color-active-pressed: oklch(from var(--bulb-accent) calc(l - 0.06) c calc(h + 12));
  --button-content-color: var(--color-active);
  --light: 255, 255, 255;
  --shadow: 0, 0, 0;
  --bulb-size: 200px;
  --wave-room: 80px;
  position: relative;
  width: calc(var(--bulb-size) + var(--wave-room) * 2);
  height: calc(var(--bulb-size) + var(--wave-room) * 2);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ---- Button ---- */
.neu-bulb {
  position: relative;
  z-index: 1;
  display: block;
  -webkit-appearance: none;
  appearance: none;
  width: var(--bulb-size);
  height: var(--bulb-size);
  padding: 0;
  border: none;
  border-radius: 50%;
  box-sizing: border-box;
  background:
    radial-gradient(
      circle at 20% 20%,
      rgba(var(--light), 0.9) 25%,
      rgba(var(--shadow), 0.1)
    ),
    linear-gradient(120deg, rgba(var(--shadow), 0.1), rgba(var(--shadow), 0.3));
  box-shadow:
    inset 10px 15px 40px -10px rgba(var(--light), 1),
    inset -20px -30px 12px -32px rgba(var(--shadow), 0.4),
    inset -20px -30px 40px -20px rgba(var(--shadow), 0.3),
    -10px -15px 16px -2px rgba(var(--light), 1),
    12px 18px 12px -18px rgba(var(--shadow), 0.4),
    13px 20px 20px -12px rgba(var(--shadow), 0.2);
  outline: none;
  cursor: pointer;
}

.neu-bulb::before {
  content: '';
  position: absolute;
  z-index: 2;
  top: -100%;
  left: -100%;
  bottom: -100%;
  right: -100%;
  backdrop-filter: blur(1px);
  pointer-events: none;
}

.neu-bulb--no-blur::before {
  display: none;
}

.neu-bulb::after {
  content: '';
  position: absolute;
  left: 10%;
  top: 10%;
  right: 10%;
  bottom: 10%;
  border-radius: 100vw;
  background:
    radial-gradient(
      circle at 80% 80%,
      rgba(var(--light), 0.9) 25%,
      rgba(var(--shadow), 0.28)
    );
  opacity: 0;
  filter: blur(4px);
}

/* ---- IO sigil ---- */
.neu-bulb__io {
  position: absolute;
  z-index: 2;
  top: 50%;
  left: 50%;
  width: calc(var(--bulb-size) * 0.36);
  height: calc(var(--bulb-size) * 0.36);
  transform: translate(-50%, -50%) scale(1);
  color: rgba(var(--light), 1);
  filter:
    drop-shadow(0 1px 0 rgba(var(--shadow), 0.16))
    drop-shadow(0 -1px 0 rgba(var(--light), 0.6));
  transition: filter 0.4s, transform 0.4s;
}

.neu-bulb:hover .neu-bulb__io {
  filter:
    drop-shadow(0 1px 0 rgba(var(--shadow), 0.16))
    drop-shadow(0 -1px 0 rgba(var(--light), 0.6))
    drop-shadow(0 0 3px var(--bulb-accent));
}

/* ---- Waves ---- */
.neu-bulb__waves {
  opacity: 0;
}

.neu-bulb__waves,
.neu-bulb__waves::before,
.neu-bulb__waves::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 100vw;
  transform: translate(-50%, -50%) scale(1);
  filter: blur(2px);
}

.neu-bulb__waves::before,
.neu-bulb__waves::after {
  content: '';
  box-shadow:
    inset -14px -21px 20px -10px rgba(var(--light), 1),
    inset 14px 21px 20px -10px rgba(var(--shadow), 0.4),
    inset 10px 15px 20px -10px rgba(var(--light), 1),
    inset -20px -30px 12px -32px rgba(var(--shadow), 0.4),
    inset -20px -30px 40px -20px rgba(var(--shadow), 0.3),
    -10px -15px 16px -2px rgba(var(--light), 1),
    12px 18px 12px -18px rgba(var(--shadow), 0.4),
    13px 20px 20px -12px rgba(var(--shadow), 0.2);
}

/* ---- Hover ---- */
.neu-bulb:hover {
  --button-content-color: var(--color-active-hover);
}

/* ---- Click animation state ---- */
.neu-bulb--active::after {
  animation: neu-bulb-inner-shadow 0.8s ease both;
}

.neu-bulb--active .neu-bulb__io {
  animation: neu-bulb-io-pulse 0.8s ease;
}

.neu-bulb--active .neu-bulb__waves {
  animation: neu-bulb-wave-main 2s linear both;
}

.neu-bulb--active .neu-bulb__waves::before {
  animation: neu-bulb-wave-expand 1.1s 0.1s linear both;
}

.neu-bulb--active .neu-bulb__waves::after {
  animation: neu-bulb-wave-expand 0.9s 0.55s linear both;
}

/* ---- Keyframes ---- */
@keyframes neu-bulb-inner-shadow {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes neu-bulb-io-pulse {
  50% {
    transform: translate(-50%, -50%) scale(0.92);
    filter:
      drop-shadow(0 0 10px var(--bulb-accent))
      drop-shadow(0 1px 0 rgba(var(--shadow), 0.12))
      drop-shadow(0 -1px 0 rgba(var(--light), 0.24))
      drop-shadow(0 0 6px var(--bulb-accent));
  }
}

@keyframes neu-bulb-wave-main {
  30% { opacity: 1; }
}

@keyframes neu-bulb-wave-expand {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1);
  }
  30% { opacity: 1; }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.5);
  }
}
</style>
