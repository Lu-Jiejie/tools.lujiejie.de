<script setup lang="ts">
import type { ToolCategory } from '~/tools'
import { useLocalStorage } from '@vueuse/core'
import { useI18n } from '~/composables/useI18n'
import { useTools } from '~/composables/useTools'

defineEmits<{ close: [] }>()

const { t } = useI18n()
const { toolsByCategory, isFavorite } = useTools()

const collapsed = useLocalStorage<ToolCategory[]>('tools-sidebar-collapsed', [])

const categoryColors: Record<ToolCategory, string> = {
  favorites: '#f59e0b',
  convert: '#0d9488',
  generate: '#0284c7',
  dev: '#71717a',
  text: '#7c3aed',
  design: '#e11d48',
  utility: '#0891b2',
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
  <aside
    flex="~ col"

    border="r c-border"
    bg-c-surface h-full w-64 select-none
  >
    <nav

      px-3 pb-6 pt-4 flex-1 min-h-0 overflow-y-auto
    >
      <div
        flex="~ items-center gap-2.5"
        px-1 pb-4
      >
        <span
          text="[0.625rem] c-text-faint uppercase"
          leading-none tracking-widest
          font-mono
        >
          catalogue
        </span>
        <span bg-c-border flex-1 h-px />
      </div>

      <TransitionGroup
        name="list"
        tag="div"
        flex="~ col gap-4.5"
      >
        <div
          v-for="group in toolsByCategory"
          :key="group.category"
          :style="{ '--category-color': categoryColors[group.category] }"
        >
          <button
            class="group/category"
            flex="~ items-center justify-between gap-3"

            text-c-text px-1 pb-2 pt-0.5 min-h-9 w-full select-none
            @click="toggleCategory(group.category)"
          >
            <span
              flex="~ items-center gap-2.5"
              min-w-0
            >
              <span
                flex="~ shrink-0"

                bg="[var(--category-color)]"
                rounded-full op-76 h-5 w-1
              />
              <span

                leading="[1.12]"
                font="serif normal"
                text-lg text-c-text op-84 min-w-0 truncate
              >
                {{ t(`category.${group.category}`) }}
              </span>
            </span>
            <span flex="~ shrink-0 items-center gap-2">
              <span

                border="~ c-border rounded-full"
                text="[0.625rem] c-text-faint center"
                leading-none font-mono px-1.5 py-0.5 min-w-5.5
              >
                {{ group.tools.length }}
              </span>
              <div
                class="group-hover/category:op-70"

                i-carbon-chevron-down text-xs text-c-text-faint op-42
                transition="opacity duration-160 transform duration-180"
                :class="{ '-rotate-90': isCollapsed(group.category) }"
              />
            </span>
          </button>

          <div
            grid
            transition="grid-rows duration-200"
            :style="{ gridTemplateRows: isCollapsed(group.category) ? '0fr' : '1fr' }"
          >
            <div

              ml-0.5 py-0.5 pl-4.75 min-h-0 relative overflow-hidden
              border="l c-border"
            >
              <RouterLink
                v-for="tool in group.tools"
                :key="tool.id"
                :to="`/${tool.id}`"

                flex="~ items-center"

                border="~ transparent l-2"

                leading="[1.2]"
                text-sm text-c-text-muted my-0.25 py-1.5 pl-3 pr-2.5 rounded-lg decoration-none min-h-8 relative
                transition="colors duration-160"
                hover="bg-c-raised text-c-text"
                active-class="border-c-border !border-l-c-border-strong bg-[color-mix(in_srgb,var(--c-surface-raised)_72%,var(--c-surface))] text-c-text"
                @click="$emit('close')"
              >
                <span flex-1 min-w-0 truncate>{{ tool.name }}</span>
                <span
                  v-if="group.category !== 'favorites' && isFavorite(tool.id)"
                  i-carbon-star-filled
                  flex="~ shrink-0"
                  text-xs text-amber-500
                  op-62
                />
              </RouterLink>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </nav>
  </aside>
</template>
