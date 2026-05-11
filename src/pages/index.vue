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
    <!-- Hero -->
    <div class="mb-10">
      <h1 class="text-5xl text-zinc-900 leading-none tracking-tight font-bold mb-4 dark:text-zinc-100">
        Tools<span class="text-orange-500">.</span>
      </h1>
      <p class="text-base text-zinc-500 leading-relaxed dark:text-zinc-400">
        A growing collection of small utilities for everyday development tasks.
      </p>
    </div>

    <!-- Search -->
    <div class="mb-12 px-4 py-3.5 border border-zinc-200 rounded-xl bg-white flex gap-3 transition-colors items-center dark:border-zinc-800 focus-within:border-zinc-400 dark:bg-zinc-900 dark:focus-within:border-zinc-600">
      <div class="i-carbon-search text-xl text-zinc-400 shrink-0 dark:text-zinc-600" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search tools..."
        class="text-base text-zinc-700 outline-none bg-transparent flex-1 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-600"
      >
      <button
        v-if="searchQuery"
        class="text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
        @click="searchQuery = ''"
      >
        <div class="i-carbon-close text-base" />
      </button>
    </div>

    <!-- Search results -->
    <template v-if="isSearching">
      <div v-if="filteredTools.length > 0" class="gap-3 grid grid-cols-1 md:grid-cols-2">
        <ToolCard v-for="tool in filteredTools" :key="tool.id" :tool="tool" />
      </div>
      <div v-else class="py-20 text-center flex flex-col gap-3 items-center">
        <div class="i-carbon-search text-4xl text-zinc-300 dark:text-zinc-700" />
        <p class="text-sm text-zinc-400 dark:text-zinc-600">
          No tools match "{{ searchQuery }}"
        </p>
      </div>
    </template>

    <!-- Grouped sections -->
    <template v-else>
      <div
        v-for="group in toolsByCategory"
        :key="group.category"
        class="mb-12"
      >
        <h2 class="text-xs text-zinc-400 tracking-widest font-semibold mb-4 uppercase dark:text-zinc-600">
          {{ CATEGORY_LABELS[group.category] }}
        </h2>
        <div class="gap-3 grid grid-cols-1 md:grid-cols-2">
          <ToolCard v-for="tool in group.tools" :key="tool.id" :tool="tool" />
        </div>
      </div>
    </template>
  </div>
</template>
