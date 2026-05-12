<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { isDark, toggleDark, useLocale, useSidebar } from '~/composables'
import { useTools } from '~/composables/useTools'

const route = useRoute()
const { findTool } = useTools()
const { locale, toggleLocale } = useLocale()
const { toggleMobile } = useSidebar()

const currentTool = computed(() => {
  const id = route.params.tool as string | undefined
  return id ? findTool(id) : null
})
</script>

<template>
  <header class="app-header px-4 border-b border-c-border flex gap-3 h-14 items-center top-0 sticky z-10">
    <!-- Logo / 面包屑 -->
    <div class="flex flex-1 gap-2 min-w-0 items-center">
      <RouterLink
        to="/"
        class="text-xl text-c-text tracking-tight font-bold shrink-0 select-none transition-opacity hover:opacity-70"
      >
        Tools<span class="text-c-accent">.</span>
      </RouterLink>
      <template v-if="currentTool">
        <span class="text-sm text-c-faint shrink-0 select-none">/</span>
        <span class="text-sm text-c-muted select-none truncate">{{ currentTool.name }}</span>
      </template>
    </div>

    <!-- 右侧操作区 -->
    <div class="flex shrink-0 gap-1 items-center">
      <a
        href="https://github.com/Lu-Jiejie"
        target="_blank"
        rel="noreferrer"
        class="icon-btn"
        title="GitHub"
      >
        <div class="i-carbon-logo-github text-base" />
      </a>

      <button
        class="text-xs text-c-muted font-mono font-semibold px-2 rounded-lg h-7 select-none transition-colors duration-150 hover:text-c-text hover:bg-c-raised"
        :title="locale === 'zh' ? '切换到英文' : 'Switch to Chinese'"
        @click="toggleLocale()"
      >
        {{ locale.toUpperCase() }}
      </button>

      <button
        class="icon-btn"
        :title="isDark ? '切换到亮色模式' : '切换到暗色模式'"
        @click="toggleDark()"
      >
        <div :class="isDark ? 'i-carbon-sun' : 'i-carbon-moon'" class="text-base" />
      </button>

      <!-- 移动端汉堡菜单（仅手机端显示） -->
      <button class="icon-btn md:hidden" title="打开菜单" @click="toggleMobile()">
        <div class="i-carbon-menu text-base" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background-color: color-mix(in srgb, var(--c-surface) 85%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
</style>
