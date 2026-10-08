<template>
  <NeuSegmentedToggle
    :modelValue="modelValue"
    :options="[{ label: '+', value: 'positive' }, { label: '◦', value: 'neutral' }, { label: '-', value: 'negative' }]"
    size="sm"
    @update:modelValue="$emit('update:modelValue', $event as OverflowType)"
  />
</template>

<script setup lang="ts">
import type { OverflowType } from '@/types/habit'
import NeuSegmentedToggle from './NeuSegmentedToggle.vue'

defineProps<{
  modelValue: OverflowType
}>()

defineEmits<{
  'update:modelValue': [value: OverflowType]
}>()
</script>
