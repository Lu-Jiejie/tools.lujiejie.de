<script setup lang="ts">
import type { ToolCategory } from '~/tools'
import { useLocalStorage } from '@vueuse/core'
import { useI18n } from '~/composables/useI18n'
import { useTools } from '~/composables/useTools'

defineEmits<{ close: [] }>()

const { t } = useI18n()
const { toolsByCategory, isFavorite } = useTools()

const collapsed = useLocalStorage<ToolCategory[]>('tools-sidebar-collapsed', [])

const categoryAccentClasses: Record<ToolCategory, string> = {
  favorites: 'bg-amber-400/80',
  convert: 'bg-teal-500/75',
  generate: 'bg-sky-500/70',
  dev: 'bg-zinc-500/70 dark:bg-zinc-300/55',
  text: 'bg-violet-500/65',
  design: 'bg-rose-500/65',
  utility: 'bg-cyan-600/65',
}

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
    <nav px-3 py-5 flex-1 overflow-y-auto>
      <TransitionGroup name="list" tag="div">
        <div
          v-for="group in toolsByCategory"
          :key="group.category"
          mb-5
        >
          <!-- 分类标题（可折叠） -->
          <button
            class="group/category"
            mb-2.5 py-1.5 flex w-full select-none items-center justify-between
            @click="toggleCategory(group.category)"
          >
            <span flex gap-2.5 min-w-0 items-center>
              <span :class="categoryAccentClasses[group.category]" rounded-full shrink-0 h-5 w-1 />
              <span text-base leading-none font-normal font-serif op-84 truncate>
                {{ t(`category.${group.category}`) }}
              </span>
            </span>
            <span flex shrink-0 gap-2 items-center>
              <span text-xs font-mono op-34>{{ group.tools.length }}</span>
              <div
                class="group-hover/category:op-55"
                i-carbon-chevron-down text-xs op-28 transition-all duration-200
                :class="{ '-rotate-90': isCollapsed(group.category) }"
              />
            </span>
          </button>

          <!-- 工具列表：用 grid-template-rows 实现流畅高度动画 -->
          <div
            grid transition-all-200
            :style="{ gridTemplateRows: isCollapsed(group.category) ? '0fr' : '1fr' }"
          >
            <div ml-0 pl-3 overflow-hidden border="l c-border">
              <RouterLink
                v-for="tool in group.tools"
                :key="tool.id" :to="`/${tool.id}`"
                m="b-0.5" p="x-2 y-1.5" border="l-2 transparent" text-sm leading-snug rounded-lg op-70 flex transition-colors duration-150 items-center hover:(border-c-border-strong op-100)
                active-class="!border-c-accent !text-c-accent !op-100"
                @click="$emit('close')"
              >
                <span min-w-0 truncate>{{ tool.name }}</span>
                <div v-if="group.category !== 'favorites' && isFavorite(tool.id)" i-carbon-star-filled text="[12px] amber-500" ml-1 op-55 shrink-0 />
              </RouterLink>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </nav>
  </aside>
</template>
