<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="tool-panel" border="~ c-border" rounded-2xl bg-c-surface overflow-hidden>
    <div
      v-if="title"
      p="x-4 y-2" border="b c-border" text-sm tracking-wide font-medium op-50 select-none uppercase
    >
      {{ title }}
    </div>
    <slot />
  </div>
</template>

<style scoped>
.tool-panel {
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
</style>
