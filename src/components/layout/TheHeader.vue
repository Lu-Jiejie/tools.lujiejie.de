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
  <header

    flex="~ items-center gap-4"
    px-4 header-blur h-15 top-0 sticky z-40 md:px-6
    border="b c-border"
  >
    <!-- Logo / 面包屑 -->
    <div
      flex="~ 1 items-baseline gap-3.5"
      min-w-0 max-sm:gap-2.5
    >
      <RouterLink
        to="/"
        class="brand-link"
        leading="[0.92]"

        font="serif normal"
        flex="~ shrink-0"

        transition="opacity duration-160"
        text-3xl text-c-text op-92 decoration-none select-none hover:op-70
      >
        Tools<span text-c-accent>.</span>
      </RouterLink>
      <span
        v-if="currentTool"
        flex="~ 1 items-baseline"
        pb-0.25 pl-3.5 min-w-0
        border="l c-border"
      >
        <span

          text-sm text-c-text-muted leading-none font-medium op-60 min-w-0 select-none truncate
          :title="currentTool.name"
        >
          {{ currentTool.name }}
        </span>
      </span>
    </div>

    <!-- 右侧操作区 -->
    <div flex="~ shrink-0 items-center gap-1">
      <a href="https://github.com/Lu-Jiejie/tools.lujiejie.de" target="_blank" rel="noreferrer" title="GitHub" class="header-action" text-lg icon-btn size-8.5>
        <div i-ri-github-fill />
      </a>

      <button :title="t('switchLocale')" class="header-action" text-lg icon-btn size-8.5 @click="toggleLocale()">
        <div :class="locale === 'zh' ? 'i-icon-park-outline-chinese' : 'i-icon-park-outline-english'" />
      </button>

      <button :title="isDark ? t('toLight') : t('toDark')" class="header-action" text-lg icon-btn size-8.5 @click="toggleDark()">
        <div :class="isDark ? 'i-ri-sun-line' : 'i-ri-moon-line'" />
      </button>

      <button :title="t('openSidebar')" class="header-action" text-lg icon-btn size-8.5 md:important-hidden @click="toggleMobile()">
        <div i-ri-menu-fill />
      </button>
    </div>
  </header>
</template>

<style scoped>
.header-action:hover {
  background-color: var(--c-surface-raised);
  color: var(--c-text);
  opacity: 1;
}
</style>
