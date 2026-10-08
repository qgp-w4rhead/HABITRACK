<template>
  <div class="add-habit-wrapper">
    <div class="button-row">
      <!-- Single toggle button: + morphs into × via 45° rotation -->
      <button
        class="toggle-btn neu-raised neu-press"
        :class="{ expanded }"
        @click="onToggle"
        :aria-label="expanded ? 'Close drawer' : 'Add habit'"
      >
        <svg class="toggle-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>

    <!-- Omni drawer: expands with same smooth animation for any mode -->
    <transition name="expand">
      <div v-if="expanded" ref="formContainerRef" class="form-container neu-carved neu-scroll">
        <transition mode="out-in" name="blur-fade"
          @before-leave="onSwapBeforeLeave"
          @enter="onSwapEnter"
          @after-enter="onSwapAfterEnter">
          <CreateHabitForm
            v-if="mode === 'create'"
            key="create"
            @submit="onSubmit"
            @cancel="$emit('collapse')"
          />
          <GaugeWheel
            v-else-if="mode === 'gauge' && gaugeHabit"
            key="gauge"
            :value="1"
            :goal="gaugeHabit.goal"
            :accent-color="gaugeHabit.accentColor"
            :habit-name="gaugeHabitName"
            @close="$emit('collapse')"
            @confirm="onGaugeConfirm"
          />
        </transition>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import CreateHabitForm from './CreateHabitForm.vue'
import GaugeWheel from './GaugeWheel.vue'
import type { HabitInput, Habit } from '@/types/habit'
import { getHabitName } from '@/types/habit'

const props = withDefaults(defineProps<{
  expanded: boolean
  mode?: 'create' | 'gauge'
  gaugeHabit?: Habit | null
}>(), {
  mode: 'create',
  gaugeHabit: null,
})

const emit = defineEmits<{
  expand: []
  collapse: []
  submit: [input: HabitInput]
  gaugeConfirm: [id: string, value: number]
}>()

const gaugeHabitName = computed(() =>
  props.gaugeHabit ? getHabitName(props.gaugeHabit) : ''
)

const formContainerRef = ref<HTMLElement | null>(null)

function onSwapBeforeLeave() {
  const el = formContainerRef.value
  if (!el) return
  el.style.height = el.clientHeight + 'px'
  el.style.overflow = 'hidden'
}

function onSwapEnter() {
  const el = formContainerRef.value
  if (!el) return
  const frozen = el.style.height
  el.style.height = 'auto'
  const target = el.clientHeight
  el.style.height = frozen
  void el.offsetHeight
  el.style.height = target + 'px'
}

function onSwapAfterEnter() {
  const el = formContainerRef.value
  if (!el) return
  el.style.height = ''
  el.style.overflow = ''
}

function onToggle() {
  if (props.expanded) {
    emit('collapse')
  } else {
    emit('expand')
  }
}

function onSubmit(input: HabitInput) {
  emit('submit', input)
}

function onGaugeConfirm(value: number) {
  if (props.gaugeHabit) {
    emit('gaugeConfirm', props.gaugeHabit.id, value)
  }
}
</script>

<style scoped>
.add-habit-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 1;
  min-height: 0;
}

.button-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle-btn {
  width: 44px;
  height: 44px;
  border: 0px solid transparent;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--neu-text);
  transition: box-shadow var(--anim-fast) ease,
              border var(--anim-fast) var(--ease-bounce, ease),
              color var(--anim-fast) var(--ease-smooth);
}

.toggle-icon {
  transition: transform var(--anim-normal) var(--ease-bounce);
}

.toggle-btn.expanded .toggle-icon {
  transform: rotate(45deg);
}

.toggle-btn:active {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    0 0 0 0 var(--neu-shadow-dark),
    0 0 0 0 var(--neu-shadow-light);
  border: 0.2px solid rgba(128, 128, 128, 0.2);
}

.form-container {
  width: 100%;
  padding: 16px;
  margin-top: 12px;
  border-radius: var(--neu-radius);
  overflow-x: hidden;
  overflow-y: auto;
  max-height: 80vh;
  -webkit-overflow-scrolling: touch;
  transform: translateZ(0);
  transition: height var(--anim-normal) var(--ease-smooth);
}

.expand-enter-active,
.expand-leave-active {
  transition: opacity var(--anim-slow) var(--ease-smooth),
              max-height var(--anim-slow) var(--ease-smooth),
              padding var(--anim-slow) var(--ease-smooth),
              margin var(--anim-slow) var(--ease-smooth);
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 800px;
}
</style>
