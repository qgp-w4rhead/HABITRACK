<template>
  <NeuSegmentedToggle
    :modelValue="modelValue"
    :options="[{ label: '+', value: 'positive' }, { label: '-', value: 'negative' }]"
    size="sm"
    @update:modelValue="$emit('update:modelValue', $event as HabitType)"
  />
</template>

<script setup lang="ts">
import type { HabitType } from '@/types/habit'
import NeuSegmentedToggle from './NeuSegmentedToggle.vue'

defineProps<{
  modelValue: HabitType
}>()

defineEmits<{
  'update:modelValue': [value: HabitType]
}>()
</script>
