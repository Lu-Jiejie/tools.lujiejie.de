<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  rows?: number
  readonly?: boolean
  resize?: 'none' | 'y' | 'both'
  monospace?: boolean
  error?: boolean
}>(), {
  rows: 4,
  resize: 'y',
  monospace: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaClass = computed(() => [
  props.error
    ? 'border-red-400 text-red-500 focus:border-red-400'
    : 'border-transparent text-c-text',
  props.monospace ? 'font-mono' : '',
  props.readonly
    ? 'bg-c-input-readonly text-c-text-muted'
    : 'bg-c-input hover:bg-c-surface hover:border-c-border focus:border-c-border-strong focus:bg-c-surface',
  props.resize === 'none' ? 'resize-none' : '',
  props.resize === 'both' ? 'resize' : '',
  props.resize === 'y' ? 'resize-y' : '',
])
</script>

<template>
  <textarea
    :value="modelValue"
    :placeholder="placeholder"
    :rows="rows"
    :readonly="readonly"
    :class="textareaClass"
    text-sm px-3 py-2 outline-none border rounded-xl w-full transition-colors
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
