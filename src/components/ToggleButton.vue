<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: boolean
  label?: string
  icon?: string
  activeIcon?: string
}>(), {
  icon: 'i-carbon-radio-button',
  activeIcon: 'i-carbon-radio-button-checked',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <button
    border="~"
    flex="~ items-center gap-1.5"
    p="x-3.5 y-2.5"

    text-sm font-medium rounded-xl min-h-10
    transition="colors duration-200"
    :class="modelValue
      ? 'border-c-accent bg-c-soft text-c-accent'
      : 'border-transparent bg-c-input text-c-text hover:border-c-border hover:bg-c-surface'"
    @click="emit('update:modelValue', !modelValue)"
  >
    <div
      v-if="icon || activeIcon"
      :class="modelValue ? (activeIcon ?? icon) : icon"
      text-sm op-65
    />
    <slot />
  </button>
</template>
