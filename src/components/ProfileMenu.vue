<template>
  <transition name="profile-menu">
    <div v-if="open" class="profile-menu-overlay" @click.self="$emit('close')">
      <div class="profile-menu neu-raised">
        <span class="menu-label">Profile</span>
        <NeuRow
          v-for="p in profiles"
          :key="p.id"
          tag="button"
          :state="p.id === currentProfileId ? 'caved' : 'flat'"
          @click="onSelect(p.id)"
        >
          <span class="profile-name">{{ p.name }}</span>
          <svg v-if="p.id === currentProfileId" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </NeuRow>
        <div class="profile-add">
          <input
            v-model="newProfileName"
            class="profile-input neu-carved-sm"
            placeholder="New profile"
            @keydown.enter="onAddProfile"
          />
          <button class="profile-add-btn neu-press-sm" @click="onAddProfile" aria-label="Add profile">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useProfile } from '@/composables/useProfile'
import NeuRow from './NeuRow.vue'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { profiles, currentProfileId, selectProfile, createProfile } = useProfile()

const newProfileName = ref('')

function onSelect(id: string) {
  selectProfile(id)
  emit('close')
}

function onAddProfile() {
  const name = newProfileName.value.trim()
  if (!name) return
  const p = createProfile(name)
  selectProfile(p.id)
  newProfileName.value = ''
  emit('close')
}
</script>

<style scoped>
.profile-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 110;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.profile-menu {
  margin-top: calc(64px + env(safe-area-inset-top, 0px));
  width: 240px;
  max-width: 85vw;
  max-height: 60dvh;
  padding: 12px;
  border-radius: var(--neu-radius);
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.menu-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--neu-text-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 4px;
}

.profile-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: normal;
}

.profile-add {
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-input {
  flex: 1;
  min-width: 0;
  border: none;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--neu-text);
  background: var(--neu-bg);
  outline: none;
  font-family: inherit;
  border-radius: var(--neu-radius-sm);
}

.profile-input::placeholder {
  color: var(--neu-text-light);
  opacity: 0.7;
}

.profile-add-btn {
  border: 0px solid transparent;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--neu-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--neu-text);
  background: var(--neu-bg);
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    2px 2px 4px var(--neu-shadow-dark),
    -2px -2px 4px var(--neu-shadow-light);
}

.profile-menu-enter-active,
.profile-menu-leave-active {
  transition: opacity 0.15s ease;
}

.profile-menu-enter-active .profile-menu,
.profile-menu-leave-active .profile-menu {
  transition: transform 0.15s ease;
}

.profile-menu-enter-from,
.profile-menu-leave-to {
  opacity: 0;
}

.profile-menu-enter-from .profile-menu,
.profile-menu-leave-to .profile-menu {
  transform: translateY(-6px);
}
</style>
