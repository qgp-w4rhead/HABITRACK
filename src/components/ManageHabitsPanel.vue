<template>
  <div class="manage-panel">
    <div class="panel-header">
      <span class="panel-title">Manage habits</span>
      <button class="close-btn neu-press-sm" @click="$emit('back')" aria-label="Back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </div>

    <div class="habits-list neu-scroll">
      <div
        v-for="habit in activeHabits"
        :key="habit.id"
        class="habit-manage-row"
        :style="{ '--accent': habit.accentColor }"
      >
        <span
          class="habit-dot"
          :style="{ background: habit.accentColor }"
        ></span>
        <span class="habit-name">{{ getHabitName(habit) }}</span>

        <div class="row-actions">
          <button class="action-btn neu-press-sm" @click="$emit('edit', habit.id)" aria-label="Edit habit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button class="action-btn neu-press-sm" @click="$emit('cheat', habit.id)" aria-label="Cheat period">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
          <button class="action-btn neu-press-sm danger" @click="$emit('deactivate', habit.id)" aria-label="Deactivate habit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="activeHabits.length === 0" class="empty-manage">
        <span>No active habits to manage</span>
      </div>
    </div>

    <!-- Deactivated habits section -->
    <div v-if="deactivatedHabits.length > 0" class="deactivated-section">
      <span class="section-label">Deactivated</span>
      <div
        v-for="habit in deactivatedHabits"
        :key="habit.id"
        class="habit-manage-row deactivated deactivated-row"
      >
        <button class="action-btn neu-press-sm" @click="$emit('reactivate', habit.id)" aria-label="Reactivate">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
        <span class="habit-name deactivated-name">{{ getHabitName(habit) }}</span>
        <button class="action-btn neu-press-sm danger" @click="$emit('delete', habit.id)" aria-label="Delete permanently">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useHabits } from '@/composables/useHabits'

const props = defineProps<{
  habits: import('@/types/habit').Habit[]
}>()

defineEmits<{
  back: []
  edit: [id: string]
  cheat: [id: string]
  deactivate: [id: string]
  reactivate: [id: string]
  delete: [id: string]
}>()

const { getHabitName } = useHabits()

const activeHabits = computed(() => props.habits.filter(h => h.active))
const deactivatedHabits = computed(() => props.habits.filter(h => !h.active))
</script>

<style scoped>
.manage-panel {
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

.habits-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.habit-manage-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--neu-radius-sm);
  background: var(--neu-bg);
  box-shadow: var(--neu-distance-sm) var(--neu-distance-sm) var(--neu-distance) var(--neu-shadow-dark),
              calc(-1 * var(--neu-distance-sm)) calc(-1 * var(--neu-distance-sm)) var(--neu-distance) var(--neu-shadow-light);
}

.habit-manage-row:hover .habit-name {
  color: oklch(from var(--accent) calc(l - 0.15) c h);
}

.habit-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 0.01em solid #000;
}

.habit-name {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--neu-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-bottom: 4px;
  margin-bottom: -4px;
  transition: color var(--anim-fast) var(--ease-smooth);
}

.row-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  border: 0px solid transparent;
  background: var(--neu-bg);
  width: 28px;
  height: 28px;
  border-radius: var(--neu-radius-xs);
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

.action-btn:active {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    0 0 0 0 var(--neu-shadow-dark),
    0 0 0 0 var(--neu-shadow-light);
  border: 0.2px solid rgba(128, 128, 128, 0.2);
}

.action-btn.danger {
  color: #e74c3c;
}

.empty-manage {
  text-align: center;
  padding: 30px 10px;
  font-size: 13px;
  color: var(--neu-text-light);
}

.deactivated-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid var(--neu-shadow-dark);
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--neu-text-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 0;
}

.habit-manage-row.deactivated {
  opacity: 0.5;
  box-shadow: none;
  border: 1px solid var(--neu-shadow-dark);
}

.deactivated-row {
  justify-content: space-between;
}

.deactivated-name {
  text-align: center;
}
</style>
