<template>
  <transition name="justify-modal">
    <div v-if="open" class="justify-modal-overlay" @click.self="onCancel">
      <div
        class="justify-modal neu-raised"
        role="dialog"
        aria-modal="true"
        aria-labelledby="justify-modal-title"
      >
        <span id="justify-modal-title" class="modal-title text-carved">Justify this {{ contextLabel }}</span>
        <span v-if="habitName" class="modal-subtext">{{ habitName }}</span>
        <input
          ref="inputEl"
          v-model="note"
          class="modal-input neu-carved-sm"
          type="text"
          placeholder="Reason or note..."
          maxlength="140"
          aria-label="Justification"
          @keydown.enter="onConfirm"
          @keydown.esc="onCancel"
        />
        <div class="modal-actions">
          <button class="modal-btn neu-raised neu-press" @click="onCancel">Cancel</button>
          <button
            class="modal-btn submit-btn neu-raised neu-press"
            :disabled="!note.trim()"
            @click="onConfirm"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  open: boolean
  habitName?: string
  contextLabel?: string
}>(), {
  habitName: '',
  contextLabel: 'peg',
})

const emit = defineEmits<{
  confirm: [note: string]
  cancel: []
}>()

const note = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

watch(() => props.open, async (val) => {
  if (!val) return
  note.value = ''
  await nextTick()
  inputEl.value?.focus()
}, { immediate: true })

function onConfirm() {
  const text = note.value.trim()
  if (!text) return
  emit('confirm', text)
}

function onCancel() {
  emit('cancel')
}
</script>

<style scoped>
.justify-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 130;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.15);
}

.justify-modal {
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

.modal-actions {
  display: flex;
  gap: 8px;
}

.modal-btn {
  border: none;
  flex: 1;
  padding: 12px;
  border-radius: var(--neu-radius-sm);
  font-size: 15px;
  font-weight: 700;
  color: var(--neu-text);
  cursor: pointer;
  transition: all var(--anim-fast) var(--ease-smooth);
}

.modal-btn:active {
  box-shadow: inset 3px 3px 7px var(--neu-shadow-dark),
              inset -3px -3px 7px var(--neu-shadow-light);
}

.modal-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.justify-modal-enter-active,
.justify-modal-leave-active {
  transition: opacity var(--anim-normal) var(--ease-smooth);
}

.justify-modal-enter-active .justify-modal,
.justify-modal-leave-active .justify-modal {
  transition: transform var(--anim-normal) var(--ease-bounce);
}

.justify-modal-enter-from,
.justify-modal-leave-to {
  opacity: 0;
}

.justify-modal-enter-from .justify-modal,
.justify-modal-leave-to .justify-modal {
  transform: scale(0.94);
}
</style>
