<template>
  <div class="habit-board">
    <TransitionGroup name="row-grow" tag="div" class="board-rows">
      <HabitRow
        v-for="habit in habits"
        :key="habit.id"
        :habit="habit"
        @press="onPress"
        @gauge-press="onGaugePress"
        @manage="onManage"
      />
    </TransitionGroup>

    <Transition name="empty-fade">
      <div v-if="habits.length === 0 && !showForm && !switching" class="empty-state">
        <p class="empty-text text-carved">No habits yet</p>
        <p class="empty-subtext">Tap + to create your first habit</p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Habit } from '@/types/habit'
import HabitRow from './HabitRow.vue'

defineProps<{
  habits: Habit[]
  showForm: boolean
  switching: boolean
}>()

const emit = defineEmits<{
  press: [id: string]
  gaugePress: [id: string]
  manage: [id: string]
}>()

function onPress(id: string) {
  emit('press', id)
}

function onGaugePress(id: string) {
  emit('gaugePress', id)
}

function onManage(id: string) {
  emit('manage', id)
}
</script>

<style scoped>
.habit-board {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.board-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.row-grow-enter-active,
.row-grow-leave-active {
  transition: all var(--anim-slow) var(--ease-bounce);
}

.row-grow-enter-from {
  opacity: 0;
  transform: translateX(-30px) scale(0.9);
}

.row-grow-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.9);
}

.row-grow-move {
  transition: transform var(--anim-normal) var(--ease-smooth);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-fade-enter-active,
.empty-fade-leave-active {
  transition: opacity var(--anim-normal) var(--ease-smooth),
              transform var(--anim-normal) var(--ease-smooth);
}

.empty-fade-enter-from,
.empty-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.empty-text {
  font-size: 18px;
  margin: 0 0 4px 0;
}

.empty-subtext {
  font-size: 13px;
  color: var(--neu-text-light);
  margin: 0;
}
</style>
