<script setup lang="ts">
import type { Tool } from '~/tools'
import { useI18n } from '~/composables/useI18n'
import { useTools } from '~/composables/useTools'

defineProps<{
  tool: Tool
}>()

const { t } = useI18n()
const { isFavorite, toggleFavorite } = useTools()
</script>

<template>
  <RouterLink :to="`/${tool.id}`" group p-5 border="~ c-border" rounded-2xl bg-c-surface flex="~ col gap-4" h="[152px]" cursor-pointer transition-all duration-200 relative hover:border-c-border-strong>
    <div mb-1 flex items-start justify-between>
      <span text-lg font-semibold transition-colors>{{ tool.name }}</span>
      <button
        :class="isFavorite(tool.id) ? 'btn-favorite-active' : 'btn-favorite'"
        :title="t('tool.favorite')"
        @click.prevent.stop="toggleFavorite(tool.id)"
      >
        <div :class="isFavorite(tool.id) ? 'i-carbon-star-filled' : 'i-carbon-star'" text-base />
      </button>
    </div>
    <div mt-1 flex="~ col gap-1.5" w-full relative z-10>
      <p text-sm leading-snug op-60 line-clamp-4>
        {{ tool.description }}
      </p>
    </div>
  </RouterLink>
</template>
