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
  <RouterLink :to="`/${tool.id}`" border="~ c-border" rows="[2.75rem_1fr]" h="[168px]" group p-5 rounded-2xl bg-c-surface gap-3 grid cursor-pointer transition-all duration-200 relative overflow-hidden hover:border-c-border-strong>
    <div h="[2.75rem]" flex gap-3 min-w-0 items-start justify-between overflow-hidden>
      <span text-lg leading-tight font-semibold flex-1 min-w-0 break-words transition-colors line-clamp-2>{{ tool.name }}</span>
      <button
        :class="isFavorite(tool.id) ? 'btn-favorite-active' : 'btn-favorite'"
        :title="t('tool.favorite')"
        @click.prevent.stop="toggleFavorite(tool.id)"
      >
        <div :class="isFavorite(tool.id) ? 'i-carbon-star-filled' : 'i-carbon-star'" text-base />
      </button>
    </div>
    <div h="[4.5rem]" pb-0.5 relative z-10 overflow-hidden>
      <p text-sm leading="[1.45]" op-60 break-words line-clamp-3>
        {{ tool.description }}
      </p>
    </div>
  </RouterLink>
</template>
