<script setup lang="ts">
import type { Tool } from '~/data/tools'
import { useTools } from '~/composables/useTools'

defineProps<{
  tool: Tool
}>()

const { isFavorite, toggleFavorite } = useTools()
</script>

<template>
  <RouterLink :to="`/${tool.id}`" class="group tool-card h-[152px] relative">
    <div class="mb-1 flex items-start justify-between">
      <span class="text-lg text-c-text font-semibold transition-colors">{{ tool.name }}</span>
      <button
        :class="isFavorite(tool.id) ? 'btn-favorite-active' : 'btn-favorite'"
        title="收藏"
        @click.prevent.stop="toggleFavorite(tool.id)"
      >
        <div :class="isFavorite(tool.id) ? 'i-carbon-star-filled' : 'i-carbon-star'" class="text-base" />
      </button>
    </div>
    <div class="mt-1 flex flex-col gap-1.5 w-full relative z-10">
      <p class="text-sm text-c-muted leading-snug line-clamp-4">
        {{ tool.description }}
      </p>
    </div>
  </RouterLink>
</template>
