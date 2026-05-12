<script setup lang="ts">
import type { Tool } from '~/data/tools'

defineProps<{
  tool: Tool
}>()
</script>

<template>
  <RouterLink :to="`/${tool.id}`" class="tool-card">
    <div class="rounded-xl bg-[var(--c-accent-soft)] flex shrink-0 h-10 w-10 items-center justify-center">
      <div :class="tool.icon" class="text-lg text-[var(--c-accent)]" />
    </div>
    <div class="flex flex-col gap-1.5">
      <span class="text-base text-[var(--c-text)] font-semibold">{{ tool.name }}</span>
      <p class="text-sm text-[var(--c-text-muted)] leading-relaxed line-clamp-2">
        {{ tool.description }}
      </p>
    </div>
  </RouterLink>
</template>
