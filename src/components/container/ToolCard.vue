<script setup lang="ts">
import type { Tool, ToolCategory } from '~/tools'
import { computed } from 'vue'
import { useI18n } from '~/composables/useI18n'
import { useTools } from '~/composables/useTools'

const props = defineProps<{
  tool: Tool
}>()

const { t } = useI18n()
const { isFavorite, toggleFavorite } = useTools()

const categoryDotClasses: Record<ToolCategory, string> = {
  favorites: 'bg-amber-400/80',
  convert: 'bg-teal-500/75',
  generate: 'bg-sky-500/70',
  dev: 'bg-zinc-500/70 dark:bg-zinc-300/55',
  text: 'bg-violet-500/65',
  design: 'bg-rose-500/65',
  utility: 'bg-cyan-600/65',
}

const keywordTags = computed(() => props.tool.keywords?.slice(0, 2) ?? [])
</script>

<template>
  <RouterLink
    :to="`/${tool.id}`"
    border="~ c-border" rows="[auto_1fr_auto]" min-h="[178px]" group p-5 rounded-2xl bg-c-surface gap-3.5 grid cursor-pointer transition-colors duration-200 relative hover:border-c-border-strong hover:bg-[color-mix(in_srgb,var(--c-surface-raised)_58%,var(--c-surface))]
  >
    <div grid-cols="[minmax(0,1fr)_auto]" gap-3 grid min-w-0 items-start>
      <span text="xl md:2xl" leading="[1.02]" font-normal font-serif flex-1 min-w-0 break-words transition-colors line-clamp-2 group-hover:text-c-accent>
        {{ tool.name }}
      </span>
      <button
        :class="isFavorite(tool.id) ? 'btn-favorite-active' : 'btn-favorite'"
        :title="t('tool.favorite')"
        @click.prevent.stop="toggleFavorite(tool.id)"
      >
        <div :class="isFavorite(tool.id) ? 'i-carbon-star-filled' : 'i-carbon-star'" text-base />
      </button>
    </div>
    <div min-h-0 relative z-10>
      <p text-sm leading="[1.55]" op-50 break-words line-clamp-3>
        {{ tool.description }}
      </p>
    </div>
    <div text-xs flex gap-4 items-center justify-between>
      <span flex gap-2 min-w-0 items-center>
        <span :class="categoryDotClasses[tool.category]" rounded-full shrink-0 size-1.5 />
        <span flex gap-1.5 min-w-0 overflow-hidden>
          <span
            v-for="keyword in keywordTags"
            :key="keyword"
            border="~ c-border-strong" font-mono px-2 py-0.5 rounded-full op-50 max-w-20 truncate
          >
            {{ keyword }}
          </span>
        </span>
      </span>
    </div>
  </RouterLink>
</template>
