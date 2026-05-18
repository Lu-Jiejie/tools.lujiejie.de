<script setup lang="ts">
import type { MessageRecord } from '~/composables'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { isDark, toggleDark, useI18n, useLocale, useSidebar, useTools } from '~/composables'

const messages: MessageRecord = {
  toLight: ['Switch to Light Mode', '切换到亮色模式'],
  toDark: ['Switch to Dark Mode', '切换到暗色模式'],
  switchLocale: ['Switch to Chinese', '切换到英文'],
  openSidebar: ['Open Sidebar', '打开侧边栏'],
}

const route = useRoute()
const { findTool } = useTools()
const { toggleLocale, locale } = useLocale()
const { t } = useI18n(messages)
const { toggleMobile } = useSidebar()

const currentTool = computed(() => {
  const id = route.params.tool as string | undefined
  return id ? findTool(id) : null
})
</script>

<template>
  <header px-4 border-b border-c-border header-blur flex gap-3 h-14 items-center top-0 sticky z-10>
    <!-- Logo / 面包屑 -->
    <div flex flex-1 gap-2 min-w-0 items-center>
      <RouterLink
        to="/"
        text-3xl tracking-tight font-bold op-90 shrink-0 select-none transition-opacity hover:op-70
      >
        Tools<span text-c-accent>.</span>
      </RouterLink>
      <template v-if="currentTool">
        <span text-sm op-30 shrink-0 select-none>/</span>
        <span text-sm op-60 select-none truncate>{{ currentTool.name }}</span>
      </template>
    </div>

    <!-- 右侧操作区 -->
    <div flex shrink-0 gap-1 items-center>
      <a href="https://github.com/Lu-Jiejie/tools.lujiejie.de" target="_blank" rel="noreferrer" title="GitHub" text-lg icon-btn size-9>
        <div i-ri-github-fill />
      </a>

      <button :title="t('switchLocale')" text-lg icon-btn size-9 @click="toggleLocale()">
        <div :class="locale === 'zh' ? 'i-icon-park-outline-chinese' : 'i-icon-park-outline-english'" />
      </button>

      <button :title="isDark ? t('toLight') : t('toDark')" text-lg icon-btn size-9 @click="toggleDark()">
        <div :class="isDark ? 'i-ri-sun-line' : 'i-ri-moon-line'" />
      </button>

      <button :title="t('openSidebar')" text-lg icon-btn size-9 md:important-hidden @click="toggleMobile()">
        <div i-ri-menu-fill />
      </button>
    </div>
  </header>
</template>
