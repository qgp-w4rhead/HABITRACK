<template>
  <div class="settings-panel">
    <div class="panel-header">
      <span class="panel-title">Settings</span>
      <button class="close-btn neu-press-sm" @click="$emit('back')" aria-label="Close settings">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </div>

    <div class="settings-body neu-scroll">
      <!-- Calendar -->
      <div class="settings-section">
        <span class="section-label">Calendar</span>
        <NeuRow tag="span" state="flat" style="--neu-row-font-size: 13px">
          <span>Week starts on</span>
          <NeuSegmentedToggle
            :modelValue="settings.calendar.weekStart"
            :options="[{ label: 'Sun', value: 'sunday' }, { label: 'Mon', value: 'monday' }]"
            size="md"
            @update:modelValue="settings.calendar.weekStart = $event as WeekStart"
          />
        </NeuRow>
      </div>

      <!-- Accessibility -->
      <div class="settings-section">
        <span class="section-label">Accessibility</span>
        <NeuRow tag="span" :state="buttonOnRight ? 'raised' : 'flat'" style="--neu-row-font-size: 13px">
          <span>Habit button on right</span>
          <NeuToggle v-model="buttonOnRight" />
        </NeuRow>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSettings } from '@/composables/useSettings'
import type { WeekStart } from '@/composables/useSettings'
import NeuRow from './NeuRow.vue'
import NeuSegmentedToggle from './NeuSegmentedToggle.vue'
import NeuToggle from './NeuToggle.vue'

defineEmits<{
  back: []
}>()

const { settings } = useSettings()

const buttonOnRight = computed({
  get: () => settings.value.accessibility.buttonPosition === 'right',
  set: (val: boolean) => {
    settings.value.accessibility.buttonPosition = val ? 'right' : 'left'
  },
})
</script>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--neu-bg);
  padding-bottom: 4px;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--neu-text);
}

.close-btn {
  border: 0px solid transparent;
  background: var(--neu-bg);
  width: 32px;
  height: 32px;
  border-radius: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--neu-text-light);
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    2px 2px 4px var(--neu-shadow-dark),
    -2px -2px 4px var(--neu-shadow-light);
  transition: box-shadow var(--anim-fast) ease,
              border var(--anim-fast) var(--ease-bounce, ease),
              color var(--anim-fast) var(--ease-smooth);
}

.close-btn:active {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    0 0 0 0 var(--neu-shadow-dark),
    0 0 0 0 var(--neu-shadow-light);
  border: 0.2px solid rgba(128, 128, 128, 0.2);
}

.settings-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1 1 auto;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--neu-text-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 0;
}
</style>
