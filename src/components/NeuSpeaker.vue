<template>
  <div class="neu-speaker-wrapper">
    <div class="neu-speaker-scale">
      <div class="neu-speaker-body" :style="textureStyle">
        <div class="neu-speaker-gauge-slot">
          <GaugeWheel
            v-model:value="gaugeValue"
            :goal="10"
            accentColor="#4ECDC4"
            @confirm="gaugeValue = $event"
          />
        </div>
        <div class="neu-speaker-diamond" style="right: 260px">
          <NeuPad shape="diamond" padSize="20px" @activate="$emit('diamond1')" />
        </div>
        <div class="neu-speaker-diamond" style="right: 300px">
          <NeuPad shape="diamond" padSize="20px" @activate="$emit('diamond2')" />
        </div>
        <div class="neu-speaker-diamond" style="right: 340px">
          <NeuPad shape="diamond" padSize="20px" @activate="$emit('diamond3')" />
        </div>
        <div class="neu-speaker-pad-btn-slot">
          <NeuPad @activate="$emit('btn1')" />
        </div>
        <div class="neu-speaker-pad-btn-slot neu-speaker-pad-btn-slot--right">
          <NeuPad @activate="$emit('btn2')" />
        </div>
        <div class="neu-speaker-microdial-slot">
          <MicroDial
            v-model:value="dialValue"
            :max-value="10"
            orientation="horizontal"
            accent-color="#4ECDC4"
            :scale="0.5"
          />
        </div>
        <div class="neu-speaker" style="left: 125px; bottom: 125px; transform: translate(-50%, 50%)"></div>
        <div class="neu-speaker" style="right: 125px; bottom: 125px; transform: translate(50%, 50%)"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import NeuPad from './NeuPad.vue'
import PlusMinus from './PlusMinus.vue'
import MicroDial from './MicroDial.vue'
import GaugeWheel from './GaugeWheel.vue'
import { useTexture } from '../composables/useTexture'

const props = withDefaults(defineProps<{
  surface?: string
  surfaceSeed?: number
}>(), {
  surface: 'grain',
  surfaceSeed: 0,
})

const dialValue = ref(1)
const gaugeValue = ref(1)

const { textureStyle } = useTexture(
  () => props.surface,
  () => ({ seed: props.surfaceSeed }),
)

defineEmits<{
  btn1: []
  btn2: []
  diamond1: []
  diamond2: []
  diamond3: []
}>()
</script>

<style scoped>
/* ---- Wrapper: responsive container ---- */
.neu-speaker-wrapper {
  position: relative;
  width: 100%;
  max-width: 600px;
  aspect-ratio: 600 / 250;
  margin: 0 auto;
  container-type: inline-size;
}

.neu-speaker-scale {
  position: absolute;
  top: 0;
  left: 0;
  width: 600px;
  height: 250px;
  transform: scale(calc(1cqw / 6px));
  transform-origin: top left;
}

/* ---- Body ---- */
.neu-speaker-body {
  isolation: isolate;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
  background: var(--neu-bg);
  box-shadow:
    16px 8px 20px var(--neu-shadow-dark),
    -16px -8px 20px var(--neu-shadow-light);
}

/* ---- Surface texture overlay ---- */
.neu-speaker-body::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image: var(--surface-texture, none);
  background-size: var(--surface-size, 200px 200px);
  mix-blend-mode: var(--surface-blend, normal);
  opacity: var(--surface-opacity, 0);
  pointer-events: none;
  z-index: 0;
}

/* ---- Pad button slot (replaces btn--2) ---- */
.neu-speaker-pad-btn-slot {
  position: absolute;
  right: 325px;
  top: 75px;
  width: 40px;
  height: 40px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(50%, -50%);
}

.neu-speaker-pad-btn-slot--right {
  right: 275px;
}
/* ---- Speaker ---- */
.neu-speaker {
  position: absolute;
  z-index: 0;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: var(--neu-bg);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.8),
    5px 5px 16px var(--neu-shadow-dark),
    -5px -5px 16px var(--neu-shadow-light);
}

/* Speaker inner dotted pattern */
.neu-speaker::after {
  content: '';
  display: block;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  margin: auto;
  width: 200px;
  height: 200px;
  border-radius: inherit;
  background-image: radial-gradient(var(--neu-text-light) 25%, transparent 35%);
  background-position: 0px 0px;
  background-size: 8px 8px;
  transform: rotate(45deg);
}

/* Speaker inner shadow ring */
.neu-speaker::after {
  content: '';
  display: block;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  margin: auto;
  width: 170px;
  height: 170px;
  border-radius: inherit;
  box-shadow:
    inset 10px 10px 20px rgba(0, 0, 0, 0.15),
    inset -10px -10px 10px rgba(0, 0, 0, 0.1);
}

/* ---- GaugeWheel slot (above diamond buttons) ---- */
.neu-speaker-gauge-slot {
  position: absolute;
  top: 143px;
  right: 300px;
  z-index: 3;
  transform: translate(38.5px, -38.5px) scale(0.35);
  transform-origin: top right;
}

/* ---- Diamond pad slots (above each pad) ---- */
.neu-speaker-diamond {
  position: absolute;
  top: 35px;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  transform: translate(50%, -50%);
}

/* ---- MicroDial slot (under pad buttons) ---- */
.neu-speaker-microdial-slot {
  position: absolute;
  right: 300px;
  bottom: 40px;
  z-index: 3;
  transform: translate(50%, 50%);
}

</style>
