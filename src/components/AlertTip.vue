<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'warning' | 'error' | 'info' | 'success'
}>(), {
  type: 'warning',
})
</script>

<template>
  <div
    flex="~ gap-1.5" px-3 py-2 border rounded-lg select-none items-center
    :class="{
      'text-yellow-500 bg-yellow-400/10 border-yellow-400': type === 'warning',
      'text-red-400 bg-red-400/10 border-red-400': type === 'error',
      'text-blue-400 bg-blue-400/10 border-blue-400': type === 'info',
      'text-green-500 bg-green-400/10 border-green-400': type === 'success',
    }"
  >
    <div
      shrink-0
      :class="{
        'i-carbon-warning-filled': type === 'warning',
        'i-carbon-close-filled': type === 'error',
        'i-carbon-information-filled': type === 'info',
        'i-carbon-checkmark-filled': type === 'success',
      }"
    />
    <slot />
  </div>
</template>
