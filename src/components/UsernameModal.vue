<template>
  <transition name="username-modal">
    <div v-if="open" class="username-modal-overlay">
      <div
        class="username-modal neu-raised"
        role="dialog"
        aria-modal="true"
        aria-labelledby="username-modal-title"
      >
        <span id="username-modal-title" class="modal-title text-carved">What's your name?</span>
        <span class="modal-subtext">(This will be used to refer to your session)</span>
        <input
          ref="inputEl"
          v-model="username"
          class="modal-input neu-carved-sm"
          type="text"
          placeholder="Username"
          maxlength="30"
          aria-label="Username"
          @keydown.enter="onSubmit"
        />
        <button
          class="submit-btn neu-raised neu-press"
          :disabled="!username.trim()"
          @click="onSubmit"
        >
          Continue
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useProfile } from '@/composables/useProfile'

const props = defineProps<{
  open: boolean
}>()

const { createProfile, selectProfile } = useProfile()

const username = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

watch(() => props.open, async (val) => {
  if (!val) return
  await nextTick()
  inputEl.value?.focus()
}, { immediate: true })

function onSubmit() {
  const name = username.value.trim()
  if (!name) return
  const p = createProfile(name)
  selectProfile(p.id)
}
</script>

<style scoped>
.username-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.15);
}

.username-modal {
  width: 280px;
  max-width: 85vw;
  padding: 20px;
  border-radius: var(--neu-radius);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-title {
  font-size: 18px;
  text-align: center;
}

.modal-subtext {
  font-size: 12px;
  color: var(--neu-text-light);
  text-align: center;
  margin-top: -6px;
}

.modal-input {
  border: none;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--neu-text);
  background: var(--neu-bg);
  outline: none;
  width: 100%;
  font-family: inherit;
}

.modal-input::placeholder {
  color: var(--neu-text-light);
  opacity: 0.7;
}

.modal-input:focus {
  box-shadow: inset 2px 2px 4px var(--neu-shadow-dark),
              inset -2px -2px 4px var(--neu-shadow-light),
              0 0 0 1px color-mix(in srgb, var(--accent, #4ECDC4) 30%, transparent);
}

.submit-btn {
  border: none;
  padding: 12px;
  border-radius: var(--neu-radius-sm);
  font-size: 15px;
  font-weight: 700;
  color: var(--neu-text);
  cursor: pointer;
  transition: all var(--anim-fast) var(--ease-smooth);
}

.submit-btn:active {
  box-shadow: inset 3px 3px 7px var(--neu-shadow-dark),
              inset -3px -3px 7px var(--neu-shadow-light);
}

.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.username-modal-enter-active,
.username-modal-leave-active {
  transition: opacity var(--anim-normal) var(--ease-smooth);
}

.username-modal-enter-active .username-modal,
.username-modal-leave-active .username-modal {
  transition: transform var(--anim-normal) var(--ease-bounce);
}

.username-modal-enter-from,
.username-modal-leave-to {
  opacity: 0;
}

.username-modal-enter-from .username-modal,
.username-modal-leave-to .username-modal {
  transform: scale(0.94);
}
</style>
