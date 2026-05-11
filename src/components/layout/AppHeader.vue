<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { isDark, toggleDark } from '~/composables'
import { useTools } from '~/composables/useTools'

const route = useRoute()
const { findTool } = useTools()

const currentTool = computed(() => {
  const id = route.params.tool as string | undefined
  return id ? findTool(id) : null
})
</script>

<template>
  <header class="px-5 border-b border-zinc-200 bg-white/80 flex gap-3 h-12 items-center top-0 sticky z-10 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
    <!-- Logo / Breadcrumb -->
    <div class="text-sm flex flex-1 gap-1.5 min-w-0 items-center">
      <RouterLink
        to="/"
        class="text-zinc-900 tracking-tight font-semibold flex shrink-0 gap-2 transition-opacity items-center dark:text-zinc-100 hover:opacity-70"
      >
        <div class="i-carbon-tool-box text-base text-orange-500" />
        <span>Tools</span>
      </RouterLink>
      <template v-if="currentTool">
        <div class="i-carbon-chevron-right text-xs text-zinc-300 shrink-0 dark:text-zinc-700" />
        <span class="text-zinc-500 truncate dark:text-zinc-400">{{ currentTool.name }}</span>
      </template>
    </div>

    <!-- Dark mode toggle -->
    <button
      class="text-zinc-500 rounded-md flex shrink-0 h-7 w-7 transition-colors items-center justify-center hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
      :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="toggleDark()"
    >
      <div :class="isDark ? 'i-carbon-sun' : 'i-carbon-moon'" class="text-base" />
    </button>
  </header>
</template>
