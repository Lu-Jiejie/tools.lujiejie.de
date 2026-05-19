<script setup lang="ts">
defineProps<{
  label?: string
}>()
</script>

<template>
  <div flex="~ col gap-1.5" min-w-0>
    <label
      v-if="label"
      text-xs tracking-wide font-medium op-60 w-auto select-none uppercase
    >
      {{ label }}
    </label>
    <slot />
  </div>
</template>
