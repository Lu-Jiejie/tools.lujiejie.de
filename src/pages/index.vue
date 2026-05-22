<script setup lang="ts">
import type { ToolCategory } from '~/tools'
import { computed } from 'vue'
import ToolCard from '~/components/container/ToolCard.vue'
import { useI18n } from '~/composables/useI18n'
import { useTools } from '~/composables/useTools'
import { CATEGORY_ORDER } from '~/tools'

defineOptions({ name: 'IndexPage' })

const { t } = useI18n({
  allCategories: ['All', '全部'],
  browseByCategory: ['browse by category', '按分类浏览'],
  description: [
    'A collection of tools I find useful.',
    '一个我觉得有用的工具集合。',
  ],
  groupsLabel: ['Groups', '分组'],
  toolsLabel: ['Tools', '工具'],
  toolboxLabel: ['personal toolbox', '个人工具箱'],
})
const { tools, filteredTools, toolsByCategory, searchQuery, activeCategory } = useTools()
const isFiltering = computed(() => searchQuery.value.trim().length > 0 || activeCategory.value !== 'all')
const totalTools = computed(() => tools.value.length)
const totalCategories = computed(() => CATEGORY_ORDER.length)
const categoryAccentClasses: Record<ToolCategory, string> = {
  favorites: 'bg-amber-400/80',
  convert: 'bg-teal-500/75',
  generate: 'bg-sky-500/70',
  dev: 'bg-zinc-500/70 dark:bg-zinc-300/55',
  text: 'bg-violet-500/65',
  design: 'bg-rose-500/65',
  utility: 'bg-cyan-600/65',
}
const categoryFilters = computed<{ id: ToolCategory | 'all', label: string, count: number }[]>(() => [
  {
    id: 'all',
    label: t('allCategories'),
    count: totalTools.value,
  },
  ...CATEGORY_ORDER.map(category => ({
    id: category,
    label: t(`category.${category}`),
    count: tools.value.filter(tool => tool.category === category).length,
  })),
])
</script>

<template>
  <div page-container max-w-5xl>
    <!-- 标题区 -->
    <div mb-10 pb-8>
      <div mb-6 flex gap-3 select-none items-center>
        <span bg-c-border h-px w-10 />
        <span text-xs tracking-widest font-mono op-38 uppercase>{{ t('toolboxLabel') }}</span>
        <span text-xs font-mono op-28>/</span>
        <span text-xs font-mono op-38>LuJiejie</span>
        <span bg-c-border flex-1 h-px />
      </div>
      <div flex="~ col gap-6 md:row md:items-end md:justify-between">
        <div>
          <h1 text="7xl md:9xl" leading="[0.82]" font-normal font-serif mb-5 op-92 select-none>
            Tools<span text-c-accent>.</span>
          </h1>
          <p text-base leading-relaxed op-58 max-w-xl>
            {{ t('description') }}
          </p>
        </div>
        <div border="t b c-border" py-4 min-w-44>
          <div flex gap-8 items-end justify-between>
            <div>
              <div text-xs font-mono op-38 uppercase>
                {{ t('toolsLabel') }}
              </div>
              <div text-4xl leading-none font-serif mt-1>
                {{ totalTools }}
              </div>
            </div>
            <div text-right>
              <div text-xs font-mono op-38 uppercase>
                {{ t('groupsLabel') }}
              </div>
              <div text-4xl leading-none font-serif mt-1>
                {{ totalCategories }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div mb-12>
      <!-- 搜索与分类 -->
      <div border="t b c-border" py-4 flex="~ col gap-3">
        <div flex gap-3 items-center justify-between>
          <span text-xs tracking-widest font-mono op-38 select-none uppercase>{{ t('browseByCategory') }}</span>
          <span bg-c-border flex-1 h-px />
        </div>

        <div grid="~ cols-2 sm:cols-3 lg:cols-7 gap-1.5">
          <button
            v-for="filter in categoryFilters"
            :key="filter.id"
            :class="activeCategory === filter.id ? 'border-c-accent text-c-accent bg-c-soft' : 'border-c-border bg-c-surface op-74 hover:op-100 hover:border-c-border-strong hover:bg-c-raised'"
            border="~" px-3 py-2.5 text-left rounded-xl min-w-0 transition-colors duration-200
            @click="activeCategory = filter.id"
          >
            <span flex gap-2 min-w-0 items-baseline justify-between>
              <span text-sm font-medium whitespace-nowrap>{{ filter.label }}</span>
              <span text-xs font-mono op-48 shrink-0>{{ filter.count }}</span>
            </span>
          </button>
        </div>

        <div border="~ c-border" px-3.5 py-2.5 rounded-xl bg-c-surface flex gap-2.5 transition-colors duration-200 items-center focus-within:border-c-accent hover:border-c-border-strong>
          <div i-carbon-search text-base op-30 shrink-0 />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('search.placeholder')"
            text-sm outline-none bg-transparent op-90 flex-1 placeholder-op-30
          >
          <button
            v-if="searchQuery"
            class="icon-btn"
            h-5 w-5
            @click="searchQuery = ''"
          >
            <div i-carbon-close text-xs />
          </button>
        </div>
      </div>
    </div>

    <!-- 搜索结果 -->
    <template v-if="isFiltering">
      <div v-if="filteredTools.length > 0" class="tools-grid">
        <ToolCard v-for="tool in filteredTools" :key="tool.id" :tool="tool" />
      </div>
      <div v-else py-20 text-center flex="~ col gap-3" items-center>
        <div i-carbon-search text-4xl op-30 />
        <p text-sm op-30>
          {{ t('search.noResults') }} "{{ searchQuery }}"
        </p>
      </div>
    </template>

    <!-- 分组展示 -->
    <template v-else>
      <TransitionGroup name="list" tag="div">
        <div
          v-for="group in toolsByCategory"
          :key="group.category"
          mb-14
        >
          <section>
            <div grid-cols="[auto_1fr_auto]" mb-5 gap-4 grid select-none items-end>
              <span :class="categoryAccentClasses[group.category]" rounded-full h-8 w-1.5 translate-y--0.5 />
              <div min-w-0>
                <h2 text="2xl md:3xl" leading-none font-normal font-serif op-88 truncate>
                  {{ t(`category.${group.category}`) }}
                </h2>
                <div mt-3 bg-c-border h-px />
              </div>
              <span border="~ c-border" text-xs font-mono px-2.5 py-1 rounded-full bg-c-surface op-48>
                {{ group.tools.length }}
              </span>
            </div>
            <div class="tools-grid">
              <ToolCard v-for="tool in group.tools" :key="tool.id" :tool="tool" />
            </div>
          </section>
        </div>
      </TransitionGroup>
    </template>
  </div>
</template>
