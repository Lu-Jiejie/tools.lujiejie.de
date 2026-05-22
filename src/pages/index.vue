<script setup lang="ts">
import { computed } from 'vue'
import BaseButton from '~/components/BaseButton.vue'
import Panel from '~/components/container/Panel.vue'
import ToolCard from '~/components/container/ToolCard.vue'
import { useI18n } from '~/composables/useI18n'
import { useTools } from '~/composables/useTools'
import { CATEGORY_ORDER } from '~/tools'

defineOptions({ name: 'IndexPage' })

const { t } = useI18n({
  allCategories: ['All', '全部'],
  description: [
    'A collection of tools I find useful.',
    '一个我觉得有用的工具集合。',
  ],
})
const { filteredTools, toolsByCategory, searchQuery, activeCategory } = useTools()
const isFiltering = computed(() => searchQuery.value.trim().length > 0 || activeCategory.value !== 'all')
</script>

<template>
  s\
  <div page-container>
    <!-- 标题区 -->
    <div mb-4>
      <h1 text-5xl leading-none tracking-tight font-bold mb-3 op-90 select-none>
        Tools<span text-c-accent>.</span>
      </h1>
      <p text-base leading-relaxed op-60>
        {{ t('description') }}
      </p>
    </div>

    <Panel mb-10>
      <!-- 搜索与分类 -->
      <div p-4 flex="~ col gap-3">
        <div flex="~ gap-2 wrap">
          <BaseButton :active="activeCategory === 'all'" @click="activeCategory = 'all'">
            {{ t('allCategories') }}
          </BaseButton>
          <BaseButton
            v-for="category in CATEGORY_ORDER"
            :key="category"
            :active="activeCategory === category"
            @click="activeCategory = category"
          >
            {{ t(`category.${category}`) }}
          </BaseButton>
        </div>

        <div border="~ c-border" px-3.5 py-2 rounded-xl bg-c-input flex gap-2.5 transition-colors duration-200 items-center focus-within:border-c-border-strong hover:border-c-border-strong>
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
    </Panel>

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
          mb-12
        >
          <Panel>
            <div p="x-4 y-2.5" border="b c-border" flex gap-3 select-none items-center>
              <div flex gap-2 min-w-0 items-center>
                <span rounded-full bg-c-accent h-1.5 w-1.5 shadow="[0_0_0_4px_var(--c-accent-soft)]" />
                <h2 text-sm op-78 truncate>
                  {{ t(`category.${group.category}`) }}
                </h2>
              </div>
              <div flex-1 h-px bg="[linear-gradient(to_right,var(--c-border),transparent)]" />
              <span text-xs font-mono px-2 py-0.5 rounded-full bg-c-raised op-55 border="~ c-border">
                {{ group.tools.length }}
              </span>
            </div>
            <div p-4 class="tools-grid">
              <ToolCard v-for="tool in group.tools" :key="tool.id" :tool="tool" />
            </div>
          </Panel>
        </div>
      </TransitionGroup>
    </template>
  </div>
</template>
