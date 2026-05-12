<script setup lang="ts">
import type { ToolCategory } from '~/data/tools'
import { useLocalStorage } from '@vueuse/core'
import { useTools } from '~/composables/useTools'
import { CATEGORY_LABELS } from '~/data/tools'

defineEmits<{ close: [] }>()

const { toolsByCategory, isFavorite } = useTools()

const collapsed = useLocalStorage<ToolCategory[]>('tools-sidebar-collapsed', [])

function isCollapsed(cat: ToolCategory) {
  return collapsed.value.includes(cat)
}

function toggleCategory(cat: ToolCategory) {
  const idx = collapsed.value.indexOf(cat)
  if (idx >= 0)
    collapsed.value.splice(idx, 1)
  else
    collapsed.value.push(cat)
}
</script>

<template>
  <aside class="border-r border-c-border bg-c-surface flex flex-col h-full">
    <nav class="px-2 py-4 flex-1 overflow-y-auto">
      <TransitionGroup name="list" tag="div">
        <div
          v-for="group in toolsByCategory"
          :key="group.category"
          class="mb-2"
        >
          <!-- 分类标题（可折叠） -->
          <button
            class="mb-0.5 px-3 py-1.5 rounded-lg flex w-full select-none items-center justify-between"
            @click="toggleCategory(group.category)"
          >
            <span class="section-label">
              {{ CATEGORY_LABELS[group.category] }}
            </span>
            <div
              class="i-carbon-chevron-down text-xs text-c-faint transition-transform duration-200"
              :class="{ '-rotate-90': isCollapsed(group.category) }"
            />
          </button>

          <!-- 工具列表：用 grid-template-rows 实现流畅高度动画 -->
          <div
            class="category-items"
            :class="{ collapsed: isCollapsed(group.category) }"
          >
            <div class="category-items-inner ml-2 border-l border-c-border">
              <RouterLink
                v-for="tool in group.tools"
                :key="tool.id"
                :to="`/${tool.id}`"
                class="nav-item"
                active-class="nav-item-active"
                @click="$emit('close')"
              >
                <span>{{ tool.name }}</span>
                <div v-if="group.category !== 'favorites' && isFavorite(tool.id)" class="i-carbon-star-filled text-[10px] text-amber-500 ml-1.5 shrink-0" />
              </RouterLink>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </nav>
  </aside>
</template>

<style scoped>
/* grid-template-rows 高度动画：从 1fr → 0fr，比 max-height 更流畅 */
.category-items {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.2s ease;
}
.category-items.collapsed {
  grid-template-rows: 0fr;
}
.category-items-inner {
  overflow: hidden;
}
</style>
