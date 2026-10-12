<template>
  <ion-page>
    <ion-content :fullscreen="true" class="home-content">
      <div class="home-container">
        <!-- Header: title / profile switcher / burger -->
        <div class="app-header">
          <span class="app-title text-carved">HABITRACK</span>
          <button class="profile-btn neu-raised" @click="profileMenuOpen = true" aria-label="Change profile">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span class="profile-btn-name">{{ currentProfileName }}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <div class="header-actions">
            <button class="burger-btn neu-raised" @click="calendarOpen = true" aria-label="History">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </button>
            <button class="burger-btn neu-raised" @click="burgerOpen = true" aria-label="Menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Habit board -->
        <div class="board-wrapper neu-carved neu-scroll">
          <HabitBoard
            :habits="activeHabits"
            :show-form="formExpanded"
            :switching="switching"
            @press="onHabitPress"
            @gauge-press="onGaugePress"
            @manage="onHabitManage"
          />
        </div>

        <!-- Omni drawer: add habit / gauge wheel -->
        <AddHabitButton
          :expanded="formExpanded"
          :mode="drawerMode"
          :gauge-habit="gaugeHabit"
          @expand="onDrawerExpand"
          @collapse="onDrawerCollapse"
          @submit="onCreateHabit"
          @gauge-confirm="onGaugeConfirm"
        />
      </div>

      <!-- Burger Slide Menu (inverted, slides from left) -->
      <BurgerSlide
        :open="burgerOpen"
        @close="burgerOpen = false"
        @manage="openManage"
        @settings="openSettings"
      />

      <!-- Profile switcher popover -->
      <ProfileMenu :open="profileMenuOpen" @close="profileMenuOpen = false" />

      <!-- Settings Slide-over Panel -->
      <transition name="slide-right">
        <div v-if="settingsOpen" class="manage-overlay" @click.self="settingsOpen = false">
          <div class="manage-panel-container neu-raised neu-scroll">
            <SettingsPanel @back="settingsOpen = false" />
          </div>
        </div>
      </transition>

      <!-- History Calendar Slide-over Panel -->
      <transition name="slide-right">
        <div v-if="calendarOpen" class="manage-overlay" @click.self="calendarOpen = false">
          <div class="manage-panel-container neu-raised neu-scroll">
            <HistoryCalendar @back="calendarOpen = false" />
          </div>
        </div>
      </transition>

      <!-- Justification prompt (peg drop / gauge add) -->
      <JustifyModal
        :open="justifyOpen"
        :habit-name="justifyHabitName"
        :context-label="justifyLabel"
        @confirm="onJustifyConfirm"
        @cancel="onJustifyCancel"
      />

      <!-- Manage Habits Slide-over Panel -->
      <transition name="slide-right">
        <div v-if="manageOpen" class="manage-overlay" @click.self="closeManage">
          <div class="manage-panel-container neu-raised neu-scroll">
            <transition mode="out-in" name="blur-fade">
              <ManageHabitsPanel
                v-if="manageView === 'list'"
                key="list"
                :habits="habits"
                @back="closeManage"
                @edit="onEditHabit"
                @cheat="onCheatPeriod"
                @deactivate="onDeactivate"
                @reactivate="onReactivate"
                @delete="onDelete"
              />
              <EditHabitPanel
                v-else-if="manageView === 'edit'"
                key="edit"
                :habit="selectedHabit"
                @back="manageView = 'list'"
                @save="onSaveHabit"
              />
              <CheatPeriodPanel
                v-else-if="manageView === 'cheat'"
                key="cheat"
                :habit="selectedHabit"
                @back="manageView = 'list'"
              />
            </transition>
          </div>
        </div>
      </transition>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { IonPage, IonContent } from '@ionic/vue'
import { useHabits } from '@/composables/useHabits'
import { useProfile } from '@/composables/useProfile'
import type { Habit, HabitInput } from '@/types/habit'
import { getHabitName } from '@/types/habit'
import HabitBoard from '@/components/HabitBoard.vue'
import AddHabitButton from '@/components/AddHabitButton.vue'
import BurgerSlide from '@/components/BurgerSlide.vue'
import ProfileMenu from '@/components/ProfileMenu.vue'
import ManageHabitsPanel from '@/components/ManageHabitsPanel.vue'
import EditHabitPanel from '@/components/EditHabitPanel.vue'
import CheatPeriodPanel from '@/components/CheatPeriodPanel.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'
import HistoryCalendar from '@/components/HistoryCalendar.vue'
import JustifyModal from '@/components/JustifyModal.vue'

const {
  habits,
  activeHabits,
  switching,
  addHabit,
  incrementPeg,
  addGaugeValue,
  deactivateHabit,
  reactivateHabit,
  removeHabit,
  updateHabit,
} = useHabits()

const { profiles, currentProfileId } = useProfile()
const currentProfileName = computed(
  () => profiles.value.find(p => p.id === currentProfileId.value)?.name ?? 'Profile',
)

const burgerOpen = ref(false)
const profileMenuOpen = ref(false)
const settingsOpen = ref(false)
const calendarOpen = ref(false)
const formExpanded = ref(false)
const drawerMode = ref<'create' | 'gauge'>('create')
const gaugeHabit = ref<Habit | null>(null)
const manageOpen = ref(false)
const manageView = ref<'list' | 'edit' | 'cheat'>('list')
const selectedHabit = ref<Habit | null>(null)
const justifyOpen = ref(false)
const justifyHabit = ref<Habit | null>(null)
const pendingDrop = ref<{ id: string; value?: number } | null>(null)

const justifyHabitName = computed(() =>
  justifyHabit.value ? getHabitName(justifyHabit.value) : '',
)
const justifyLabel = computed(() =>
  pendingDrop.value?.value !== undefined ? `+${pendingDrop.value.value}` : 'peg',
)

function onHabitPress(id: string) {
  const habit = habits.value.find(h => h.id === id)
  if (habit?.justify) {
    pendingDrop.value = { id }
    justifyHabit.value = habit
    justifyOpen.value = true
    return
  }
  incrementPeg(id)
}

function onGaugePress(id: string) {
  gaugeHabit.value = habits.value.find(h => h.id === id) ?? null
  drawerMode.value = 'gauge'
  formExpanded.value = true
}

function onDrawerExpand() {
  drawerMode.value = 'create'
  gaugeHabit.value = null
  formExpanded.value = true
}

function onDrawerCollapse() {
  formExpanded.value = false
  gaugeHabit.value = null
}

function onGaugeConfirm(id: string, value: number) {
  const habit = habits.value.find(h => h.id === id)
  if (habit?.justify) {
    pendingDrop.value = { id, value }
    justifyHabit.value = habit
    justifyOpen.value = true
    return
  }
  addGaugeValue(id, value)
  formExpanded.value = false
  gaugeHabit.value = null
}

function onJustifyConfirm(note: string) {
  const pending = pendingDrop.value
  justifyOpen.value = false
  pendingDrop.value = null
  justifyHabit.value = null
  if (!pending) return
  if (pending.value !== undefined) {
    addGaugeValue(pending.id, pending.value, note)
    formExpanded.value = false
    gaugeHabit.value = null
  } else {
    incrementPeg(pending.id, note)
  }
}

// Cancelling keeps the gauge drawer open so the wheel retains its value.
function onJustifyCancel() {
  justifyOpen.value = false
  pendingDrop.value = null
  justifyHabit.value = null
}

function onHabitManage(id: string) {
  selectedHabit.value = habits.value.find(h => h.id === id) ?? null
  manageOpen.value = true
  manageView.value = 'list'
}

function openManage() {
  burgerOpen.value = false
  manageOpen.value = true
  manageView.value = 'list'
}

function openSettings() {
  burgerOpen.value = false
  settingsOpen.value = true
}

function closeManage() {
  burgerOpen.value = false
  manageOpen.value = false
  manageView.value = 'list'
  selectedHabit.value = null
}

function onEditHabit(id: string) {
  selectedHabit.value = habits.value.find(h => h.id === id) ?? null
  manageView.value = 'edit'
}

function onCheatPeriod(id: string) {
  selectedHabit.value = habits.value.find(h => h.id === id) ?? null
  manageView.value = 'cheat'
}

function onDeactivate(id: string) {
  deactivateHabit(id)
}

function onReactivate(id: string) {
  reactivateHabit(id)
}

function onDelete(id: string) {
  removeHabit(id)
}

function onSaveHabit(updates: Partial<Habit>) {
  if (selectedHabit.value) {
    updateHabit(selectedHabit.value.id, updates)
  }
  manageView.value = 'list'
}

function onCreateHabit(input: HabitInput) {
  const reactivated = addHabit(input)
  if (reactivated.similar.length > 0) {
    // Could show a toast here
    console.warn('Similar habits exist:', reactivated.similar)
  }
  formExpanded.value = false
  gaugeHabit.value = null
}
</script>

<style scoped>
.home-content {
  --background: var(--neu-bg);
}

.home-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  padding-top: calc(16px + env(safe-area-inset-top, 0px));
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
}

.app-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
}

.header-actions {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 8px;
}

.burger-btn {
  border: 0px solid transparent;
  width: 40px;
  height: 40px;
  border-radius: var(--neu-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--neu-text);
  background: var(--neu-bg);
  flex-shrink: 0;
  margin-left: auto;
}

.burger-btn:active {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    0 0 0 0 var(--neu-shadow-dark),
    0 0 0 0 var(--neu-shadow-light);
  border: 0.2px solid rgba(128, 128, 128, 0.2);
}

.profile-btn {
  border: 0px solid transparent;
  min-width: 0;
  max-width: 100%;
  height: 40px;
  padding: 0 14px;
  border-radius: var(--neu-radius-sm);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--neu-text);
  background: var(--neu-bg);
  font-size: 14px;
  font-weight: 700;
}

.profile-btn:active {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    0 0 0 0 var(--neu-shadow-dark),
    0 0 0 0 var(--neu-shadow-light);
  border: 0.2px solid rgba(128, 128, 128, 0.2);
}

.profile-btn-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: normal;
  max-width: 140px;
}

.app-title {
  font-size: 20px;
}

.board-wrapper {
  padding: 12px;
  border-radius: var(--neu-radius);
  flex: 1;
  min-height: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.manage-overlay {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.15);
  z-index: 105;
  display: flex;
  justify-content: flex-end;
}

.manage-panel-container {
  width: 320px;
  max-width: 85vw;
  height: 100%;
  padding: 16px;
  border-radius: var(--neu-radius) 0 0 var(--neu-radius);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
</style>
