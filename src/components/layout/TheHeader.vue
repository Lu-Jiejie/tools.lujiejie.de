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
  <header px-4 border-b border-c-border header-blur flex gap-4 h-15 items-center top-0 sticky z-40 md:px-6>
    <!-- Logo / 面包屑 -->
    <div flex flex-1 gap-3 min-w-0 items-center>
      <RouterLink
        to="/"
        text-3xl leading-none font-normal font-serif op-92 shrink-0 select-none transition-opacity hover:op-70
      >
        Tools<span text-c-accent>.</span>
      </RouterLink>
      <span v-if="currentTool" border="l c-border" pl-3 flex flex-1 min-w-0 items-center>
        <span text-sm op-64 min-w-0 select-none truncate :title="currentTool.name">{{ currentTool.name }}</span>
      </span>
    </div>

    <!-- 右侧操作区 -->
    <div flex shrink-0 gap-1 items-center>
      <a href="https://github.com/Lu-Jiejie/tools.lujiejie.de" target="_blank" rel="noreferrer" title="GitHub" text-lg size-8.5 class="header-action">
        <div i-ri-github-fill />
      </a>

      <button :title="t('switchLocale')" text-lg size-8.5 class="header-action" @click="toggleLocale()">
        <div :class="locale === 'zh' ? 'i-icon-park-outline-chinese' : 'i-icon-park-outline-english'" />
      </button>

      <button :title="isDark ? t('toLight') : t('toDark')" text-lg size-8.5 class="header-action" @click="toggleDark()">
        <div :class="isDark ? 'i-ri-sun-line' : 'i-ri-moon-line'" />
      </button>

      <button :title="t('openSidebar')" text-lg size-8.5 md:important-hidden class="header-action" @click="toggleMobile()">
        <div i-ri-menu-fill />
      </button>
    </div>
  </header>
</template>

<style scoped>
.header-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  opacity: 0.58;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    opacity 160ms ease;
}

.header-action:hover {
  background-color: var(--c-surface-raised);
  color: var(--c-accent);
  opacity: 1;
}
</style>
