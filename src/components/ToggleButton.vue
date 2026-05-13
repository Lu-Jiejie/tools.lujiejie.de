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
    border="~" flex="~ gap-1.5" text-sm px-3 py-1.5 rounded-lg transition-colors items-center
    :class="modelValue
      ? 'border-c-accent bg-c-raised text-c-accent'
      : 'border-c-border bg-c-raised hover:border-c-border-strong'"
    @click="emit('update:modelValue', !modelValue)"
  >
    <div
      v-if="icon || activeIcon"
      :class="modelValue ? (activeIcon ?? icon) : icon"
      text-sm
    />
    <slot />
  </button>
</template>
