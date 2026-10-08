<template>
  <transition name="slide-right">
    <div v-if="open" class="burger-slide-overlay" @click.self="$emit('close')">
      <div class="burger-slide-panel neu-raised neu-scroll">
        <!-- X button positioned on the right side (inverted logic) -->
        <button class="close-x neu-press-sm" @click="$emit('close')" aria-label="Close menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div class="panel-header">
          <span class="panel-title">Menu</span>
        </div>

        <div class="panel-body neu-scroll">
          <NeuRow tag="button" @click="$emit('manage')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
            <span>Manage habits</span>
          </NeuRow>

          <NeuRow tag="button" @click="$emit('settings')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Settings</span>
          </NeuRow>

          <div class="profiles-section">
            <span class="section-label">Profile</span>
            <NeuRow
              v-for="p in profiles"
              :key="p.id"
              tag="button"
              :state="p.id === currentProfileId ? 'caved' : 'flat'"
              @click="selectProfile(p.id)"
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

defineEmits<{
  close: []
  manage: []
  settings: []
}>()

const { profiles, currentProfileId, selectProfile, createProfile } = useProfile()

const newProfileName = ref('')

function onAddProfile() {
  const name = newProfileName.value.trim()
  if (!name) return
  const p = createProfile(name)
  selectProfile(p.id)
  newProfileName.value = ''
}
</script>

<style scoped>
.burger-slide-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.15);
  z-index: 100;
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
}

.burger-slide-panel {
  width: 240px;
  max-width: 80vw;
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: var(--neu-radius) 0 0 var(--neu-radius);
  position: relative;
  overflow-y: auto;
}

.close-x {
  position: absolute;
  top: 12px;
  right: 12px;
  border: 0px solid transparent;
  background: var(--neu-bg);
  width: 32px;
  height: 32px;
  border-radius: 50%;
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

.close-x:active {
  box-shadow:
    inset 1px 1px 2px 0 rgba(255, 255, 255, 0.8),
    0 0 0 0 var(--neu-shadow-dark),
    0 0 0 0 var(--neu-shadow-light);
  border: 0.2px solid rgba(128, 128, 128, 0.2);
}

.panel-header {
  padding: 8px 0 4px 0;
}

.panel-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--neu-text);
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1 1 auto;
}

.profiles-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid var(--neu-shadow-dark);
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

.section-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--neu-text-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 0;
}

</style>
