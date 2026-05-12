<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTools } from '~/composables/useTools'
import { CATEGORY_LABELS, getToolComponent } from '~/data/tools'

const route = useRoute()
const router = useRouter()
const { findTool, isFavorite, toggleFavorite } = useTools()

const tool = computed(() => findTool(route.params.tool as string))

if (!tool.value) {
  router.replace('/')
}
</script>

<template>
  <div v-if="tool" class="page-container">
    <!-- 工具头部 -->
    <div class="mb-8 flex gap-4 items-start">
      <div class="flex flex-col gap-1.5 min-w-0">
        <div class="flex flex-wrap gap-3 items-center">
          <h1 class="text-xl text-c-text tracking-tight font-bold select-none">
            {{ tool.name }}
          </h1>

          <span class="category-pill ml-1 select-none">{{ CATEGORY_LABELS[tool.category] }}</span>

          <button
            :class="isFavorite(tool.id) ? 'btn-favorite-active' : 'btn-favorite'"
            title="Favorite"
            @click="toggleFavorite(tool.id)"
          >
            <div :class="isFavorite(tool.id) ? 'i-carbon-star-filled' : 'i-carbon-star'" class="text-xl" />
          </button>
        </div>
        <p class="text-sm text-c-muted leading-relaxed">
          {{ tool.description }}
        </p>
      </div>
    </div>

    <!-- 工具内容区 -->
    <div class="tool-content border border-c-border rounded-2xl bg-c-surface min-h-48 overflow-hidden">
      <!-- 动态加载对应的组件 -->
      <component :is="getToolComponent(tool.id)" />
    </div>
  </div>
</template>

<style scoped>
.tool-content {
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
</style>
