<script setup lang="ts">
import { computed } from 'vue'
import ToolCard from '~/components/container/ToolCard.vue'
import { useI18n } from '~/composables/useI18n'
import { useTools } from '~/composables/useTools'

defineOptions({ name: 'IndexPage' })

const { t } = useI18n()
const { filteredTools, toolsByCategory, searchQuery } = useTools()
const isSearching = computed(() => searchQuery.value.trim().length > 0)
</script>

<template>
  <div page-container>
    <!-- 标题区 -->
    <div mb-8>
      <h1 text-5xl leading-none tracking-tight font-bold mb-3 op-90 select-none>
        Tools<span text-c-accent>.</span>
      </h1>
      <p text-base leading-relaxed op-60>
        Tools I need.
      </p>
    </div>

    <!-- 搜索框 -->
    <div border="~ c-border" mb-10 px-3.5 py-2 rounded-xl bg-c-surface flex gap-2.5 transition-colors duration-200 items-center focus-within:border-c-border-strong hover:border-c-border-strong>
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

    <!-- 搜索结果 -->
    <template v-if="isSearching">
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
          <h2 text-sm tracking-widest font-semibold mb-4 op-50 select-none uppercase>
            {{ t(`category.${group.category}`) }}
          </h2>
          <div class="tools-grid">
            <ToolCard v-for="tool in group.tools" :key="tool.id" :tool="tool" />
          </div>
        </div>
      </TransitionGroup>
    </template>
  </div>
</template>
