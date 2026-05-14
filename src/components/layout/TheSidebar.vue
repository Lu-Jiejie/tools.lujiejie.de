<script setup lang="ts">
import type { ToolCategory } from '~/tools'
import { useLocalStorage } from '@vueuse/core'
import { useI18n } from '~/composables/useI18n'
import { useTools } from '~/composables/useTools'

defineEmits<{ close: [] }>()

const { t } = useI18n()
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
  <aside border="r c-border" bg-c-surface flex="~ col" h-full>
    <nav px-2 py-4 flex-1 overflow-y-auto>
      <TransitionGroup name="list" tag="div">
        <div
          v-for="group in toolsByCategory"
          :key="group.category"
          mb-2
        >
          <!-- 分类标题（可折叠） -->
          <button
            mb-0.5 px-3 py-1.5 rounded-lg flex w-full select-none items-center justify-between
            @click="toggleCategory(group.category)"
          >
            <span text-xs tracking-widest font-semibold op-50 select-none uppercase>
              {{ t(`category.${group.category}`) }}
            </span>
            <div
              i-carbon-chevron-down text-xs op-30 transition-transform duration-200
              :class="{ '-rotate-90': isCollapsed(group.category) }"
            />
          </button>

          <!-- 工具列表：用 grid-template-rows 实现流畅高度动画 -->
          <div
            class="category-items"
            :class="{ collapsed: isCollapsed(group.category) }"
          >
            <div class="category-items-inner" ml-2 border="l c-border">
              <RouterLink
                v-for="tool in group.tools"
                :key="tool.id" :to="`/${tool.id}`"
                m="b-0.5 l-2" p="x-2 y-1.5" text-sm rounded-lg op-85 flex transition-colors duration-150 items-center hover:(bg-c-raised) !hover:op-90
                active-class="!bg-c-soft !text-c-accent !op-100"
                @click="$emit('close')"
              >
                <span>{{ tool.name }}</span>
                <div v-if="group.category !== 'favorites' && isFavorite(tool.id)" i-carbon-star-filled text="[12px] amber-500" ml-1 shrink-0 />
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
