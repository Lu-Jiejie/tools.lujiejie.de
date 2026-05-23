<script setup lang="ts">
import type { ToolCategory } from '~/tools'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '~/composables/useI18n'
import { useTools } from '~/composables/useTools'
import { getToolComponent } from '~/tools'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { findTool, isFavorite, toggleFavorite } = useTools()

const tool = computed(() => findTool(route.params.tool as string))
const keywordTags = computed(() => tool.value?.keywords?.slice(0, 3) ?? [])
const categoryAccentClasses: Record<ToolCategory, string> = {
  favorites: 'bg-amber-400/80',
  convert: 'bg-teal-500/75',
  generate: 'bg-sky-500/70',
  dev: 'bg-zinc-500/70 dark:bg-zinc-300/55',
  text: 'bg-violet-500/65',
  design: 'bg-rose-500/65',
  utility: 'bg-cyan-600/65',
}

if (!tool.value) {
  router.replace('/')
}
</script>

<template>
  <div v-if="tool" page-container max-w-5xl>
    <!-- 工具头部 -->
    <header mb-10 relative border="b c-border">
      <div
        grid="~ cols-[auto_1fr] gap-4"
        mb-6 pr-12 select-none items-center
      >
        <span :class="categoryAccentClasses[tool.category]" rounded-full size-2 />
        <div flex="~ items-center gap-3" min-w-0>
          <span text-sm text-c-text-muted font-medium whitespace-nowrap>
            {{ t(`category.${tool.category}`) }}
          </span>
          <span bg-c-border flex-1 h-px />
          <span
            text="[0.625rem] c-text-faint"
            leading-none font-mono
            hidden sm:inline
          >
            {{ tool.id }}
          </span>
        </div>
      </div>

      <button
        :title="t('tool.favorite')"
        :class="isFavorite(tool.id) ? 'text-amber-500 op-100' : 'text-c-text-faint op-58 hover:text-c-text hover:op-90'"

        flex="~ items-center justify-center"

        rounded-lg bg-transparent size-8.5 right-0 top-0 absolute
        transition="colors duration-160"
        @click="toggleFavorite(tool.id)"
      >
        <div :class="isFavorite(tool.id) ? 'i-carbon-star-filled' : 'i-carbon-star'" text-lg />
      </button>

      <div
        pb-8
      >
        <div max-w-3xl min-w-0>
          <h1
            text="5xl md:6xl"
            leading="[0.9]"
            font-normal font-serif op-92 select-none
          >
            {{ tool.name }}
          </h1>
          <p leading="[1.7]" text-base mt-4 op-58 max-w-2xl>
            {{ tool.description }}
          </p>

          <div
            v-if="keywordTags.length"
            flex="~ wrap items-center gap-2"
            mt-5 min-w-0
          >
            <span
              v-for="keyword in keywordTags"
              :key="keyword"
              border="~ c-border"

              text-xs text-c-text-muted leading-none font-mono px-2 py-0.75 rounded-md max-w-32 truncate
            >
              {{ keyword }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <!-- 工具内容区 -->
    <main>
      <component :is="getToolComponent(tool.id)" />
    </main>
  </div>
</template>
