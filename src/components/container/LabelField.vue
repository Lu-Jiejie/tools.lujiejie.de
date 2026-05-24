<script setup lang="ts">
defineProps<{
  label?: string
}>()
</script>

<template>
  <div flex="~ col gap-2" min-w-0>
    <label
      v-if="label"
      text="[0.8125rem] c-text-muted"
      leading-snug font-medium
      select-none
    >
      {{ label }}
    </label>
    <slot />
  </div>
</template>
