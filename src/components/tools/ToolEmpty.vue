<script setup lang="ts">
import type { Tool } from '~/data/tools'

defineProps<{
  tool: Tool
}>()
</script>

<template>
  <div class="py-20 text-center flex flex-col gap-4 items-center justify-center">
    <div class="rounded-2xl bg-zinc-100 flex h-14 w-14 items-center justify-center dark:bg-zinc-800">
      <div :class="tool.icon" class="text-2xl text-zinc-400 dark:text-zinc-600" />
    </div>
    <div class="flex flex-col gap-1.5">
      <p class="text-sm text-zinc-500 font-medium dark:text-zinc-400">
        This tool is coming soon
      </p>
      <p class="text-xs text-zinc-400 max-w-xs dark:text-zinc-600">
        {{ tool.name }} is not yet implemented. Check back later.
      </p>
    </div>
  </div>
</template>
