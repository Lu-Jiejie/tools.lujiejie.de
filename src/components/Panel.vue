<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div border="~ c-border" rounded-2xl bg-c-surface panel-shadow overflow-hidden>
    <div
      v-if="title"
      p="x-4 y-2" border="b c-border" text-sm tracking-wide font-medium op-50 select-none uppercase
    >
      {{ title }}
    </div>
    <slot />
  </div>
</template>
