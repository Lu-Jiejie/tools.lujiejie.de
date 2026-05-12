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
  <div class="page-container">
    <!-- 标题区 -->
    <div class="mb-8">
      <h1 class="page-title mb-3">
        Tools<span class="text-c-accent">.</span>
      </h1>
      <p class="text-base text-c-muted leading-relaxed">
        Tools I need.
      </p>
    </div>

    <!-- 搜索框 -->
    <div class="mb-10 search-box">
      <div class="i-carbon-search text-base text-c-faint shrink-0" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search tools..."
        class="text-sm text-c-text outline-none bg-transparent flex-1 placeholder-c-faint"
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
      <div v-if="filteredTools.length > 0" class="gap-3 grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2">
        <ToolCard v-for="tool in filteredTools" :key="tool.id" :tool="tool" />
      </div>
      <div v-else class="py-20 text-center flex flex-col gap-3 items-center">
        <div class="i-carbon-search text-4xl text-c-faint" />
        <p class="text-sm text-c-faint">
          没有找到 "{{ searchQuery }}"
        </p>
      </div>
    </template>

    <!-- 分组展示 -->
    <template v-else>
      <TransitionGroup name="list" tag="div">
        <div
          v-for="group in toolsByCategory"
          :key="group.category"
          class="mb-12"
        >
          <h2 class="section-label mb-4">
            {{ CATEGORY_LABELS[group.category] }}
          </h2>
          <div class="gap-3 grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2">
            <ToolCard v-for="tool in group.tools" :key="tool.id" :tool="tool" />
          </div>
        </div>
      </TransitionGroup>
    </template>
  </div>
</template>
