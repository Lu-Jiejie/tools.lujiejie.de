<script setup lang="ts">
import type { Tool } from '~/data/tools'

defineProps<{
  tool: Tool
}>()
</script>

<template>
  <RouterLink :to="`/${tool.id}`" class="tool-card">
    <!-- Icon + status -->
    <div class="flex items-start justify-between">
      <div class="rounded-lg bg-zinc-100 flex shrink-0 h-10 w-10 items-center justify-center dark:bg-zinc-800">
        <div :class="tool.icon" class="text-lg text-zinc-600 dark:text-zinc-400" />
      </div>
      <span v-if="tool.status === 'coming-soon'" class="status-badge">Soon</span>
    </div>

    <!-- Content -->
    <div class="flex flex-col gap-1.5">
      <span class="text-base text-zinc-900 font-semibold dark:text-zinc-100">{{ tool.name }}</span>
      <p class="text-sm text-zinc-500 leading-relaxed line-clamp-2 dark:text-zinc-400">
        {{ tool.description }}
      </p>
    </div>
  </RouterLink>
</template>
