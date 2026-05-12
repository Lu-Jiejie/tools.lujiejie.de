<script setup lang="ts">
import type { ToolCategory } from '~/data/tools'
import { useLocalStorage } from '@vueuse/core'
import { useRoute } from 'vue-router'
import { useTools } from '~/composables/useTools'
import { CATEGORY_LABELS } from '~/data/tools'

defineEmits<{ close: [] }>()

const route = useRoute()
const { toolsByCategory } = useTools()

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

function isActive(toolId: string) {
  return route.params.tool === toolId
}
</script>

<template>
  <aside class="border-r border-[var(--c-border)] bg-[var(--c-surface)] flex flex-col h-full">
    <nav class="px-2 py-4 flex-1 overflow-y-auto">
      <div
        v-for="group in toolsByCategory"
        :key="group.category"
        class="mb-2"
      >
        <!-- 分类标题（可折叠） -->
        <button
          class="category-btn mb-0.5 px-3 py-1.5 rounded-lg flex w-full select-none transition-colors duration-150 items-center justify-between"
          @click="toggleCategory(group.category)"
        >
          <span class="text-[10px] text-[var(--c-text-faint)] tracking-widest font-semibold uppercase">
            {{ CATEGORY_LABELS[group.category] }}
          </span>
          <div
            class="i-carbon-chevron-down text-xs text-[var(--c-text-faint)] transition-transform duration-200"
            :class="{ '-rotate-90': isCollapsed(group.category) }"
          />
        </button>

        <!-- 工具列表：用 grid-template-rows 实现流畅高度动画 -->
        <div
          class="category-items"
          :class="{ collapsed: isCollapsed(group.category) }"
        >
          <div class="category-items-inner">
            <RouterLink
              v-for="tool in group.tools"
              :key="tool.id"
              :to="`/${tool.id}`"
              class="nav-item text-sm mb-0.5 px-3 py-1.5 rounded-lg flex transition-colors duration-150 items-center"
              :class="{ 'nav-item-active': isActive(tool.id) }"
              @click="$emit('close')"
            >
              {{ tool.name }}
            </RouterLink>
          </div>
        </div>
      </div>
    </nav>
  </aside>
</template>

<style scoped>
.category-btn:hover {
  background: var(--c-surface-raised);
}

.nav-item {
  color: var(--c-text-muted);
}
.nav-item:hover {
  background: var(--c-surface-raised);
  color: var(--c-text);
}
.nav-item-active {
  background: var(--c-accent-soft);
  color: var(--c-accent);
}
.nav-item-active:hover {
  background: var(--c-accent-soft);
  color: var(--c-accent);
}

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
