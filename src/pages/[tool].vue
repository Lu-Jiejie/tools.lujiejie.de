<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ToolEmpty from '~/components/tools/ToolEmpty.vue'
import { useTools } from '~/composables/useTools'
import { CATEGORY_LABELS } from '~/data/tools'

const route = useRoute()
const router = useRouter()
const { findTool } = useTools()

const tool = computed(() => findTool(route.params.tool as string))

if (!tool.value) {
  router.replace('/')
}
</script>

<template>
  <div v-if="tool" class="mx-auto px-6 py-12 max-w-4xl md:px-12">
    <!-- Tool header -->
    <div class="mb-8 flex gap-4 items-start">
      <div class="rounded-xl bg-zinc-100 flex shrink-0 h-11 w-11 items-center justify-center dark:bg-zinc-800">
        <div :class="tool.icon" class="text-xl text-zinc-600 dark:text-zinc-400" />
      </div>
      <div class="flex flex-col gap-1 min-w-0">
        <div class="flex flex-wrap gap-2 items-center">
          <h1 class="text-lg text-zinc-900 tracking-tight font-semibold dark:text-zinc-100">
            {{ tool.name }}
          </h1>
          <span class="category-pill">{{ CATEGORY_LABELS[tool.category] }}</span>
          <span v-if="tool.status === 'coming-soon'" class="status-badge">Coming soon</span>
        </div>
        <p class="text-sm text-zinc-500 leading-relaxed dark:text-zinc-400">
          {{ tool.description }}
        </p>
      </div>
    </div>

    <!-- Tool content -->
    <div class="border border-zinc-200 rounded-xl bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
      <ToolEmpty v-if="tool.status === 'coming-soon'" :tool="tool" />
      <!-- Future: dynamic tool component slot -->
    </div>
  </div>
</template>
