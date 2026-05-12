<script setup lang="ts">
import { computed } from 'vue'
import ToolCard from '~/components/tools/ToolCard.vue'
import { useTools } from '~/composables/useTools'
import { CATEGORY_LABELS } from '~/data/tools'

defineOptions({ name: 'IndexPage' })

const { filteredTools, toolsByCategory, searchQuery } = useTools()

const isSearching = computed(() => searchQuery.value.trim().length > 0)
</script>

<template>
  <div class="mx-auto px-6 py-12 max-w-4xl md:px-12">
    <!-- 标题区 -->
    <div class="mb-8">
      <h1 class="text-5xl text-[var(--c-text)] leading-none tracking-tight font-bold mb-3 select-none">
        Tools<span class="text-[var(--c-accent)]">.</span>
      </h1>
      <p class="text-base text-[var(--c-text-muted)] leading-relaxed">
        持续增长的小工具集合，为日常开发提效。
      </p>
    </div>

    <!-- 搜索框 -->
    <div class="search-box mb-10 px-3.5 py-2 border border-[var(--c-border)] rounded-xl bg-[var(--c-surface)] flex gap-2.5 transition-colors duration-200 items-center">
      <div class="i-carbon-search text-base text-[var(--c-text-faint)] shrink-0" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索工具..."
        class="text-sm text-[var(--c-text)] outline-none bg-transparent flex-1 placeholder-[var(--c-text-faint)]"
      >
      <button
        v-if="searchQuery"
        class="icon-btn h-5 w-5"
        @click="searchQuery = ''"
      >
        <div class="i-carbon-close text-xs" />
      </button>
    </div>

    <!-- 搜索结果 -->
    <template v-if="isSearching">
      <div v-if="filteredTools.length > 0" class="gap-3 grid grid-cols-1 md:grid-cols-2">
        <ToolCard v-for="tool in filteredTools" :key="tool.id" :tool="tool" />
      </div>
      <div v-else class="py-20 text-center flex flex-col gap-3 items-center">
        <div class="i-carbon-search text-4xl text-[var(--c-text-faint)]" />
        <p class="text-sm text-[var(--c-text-faint)]">
          没有找到 "{{ searchQuery }}"
        </p>
      </div>
    </template>

    <!-- 分组展示 -->
    <template v-else>
      <div
        v-for="group in toolsByCategory"
        :key="group.category"
        class="mb-12"
      >
        <h2 class="section-label mb-4">
          {{ CATEGORY_LABELS[group.category] }}
        </h2>
        <div class="gap-3 grid grid-cols-1 md:grid-cols-2">
          <ToolCard v-for="tool in group.tools" :key="tool.id" :tool="tool" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.search-box:focus-within {
  border-color: var(--c-border-strong);
}
</style>
