<script setup lang="ts">
import AppHeader from '~/components/layout/AppHeader.vue'
import AppSidebar from '~/components/layout/AppSidebar.vue'
import { useSidebar } from '~/composables'

const { mobileOpen, closeMobile } = useSidebar()
</script>

<template>
  <div class="text-c-text font-sans bg-c-bg flex flex-col min-h-screen">
    <AppHeader />

    <div class="flex flex-1">
      <!-- 桌面端侧边栏（始终显示） -->
      <div class="shrink-0 w-56 hidden md:block">
        <div class="h-[calc(100vh-3.5rem)] top-14 sticky overflow-y-auto">
          <AppSidebar />
        </div>
      </div>

      <!-- 移动端遮罩 -->
      <Transition name="fade">
        <div
          v-if="mobileOpen"
          class="bg-black/50 inset-0 fixed z-20 md:hidden"
          @click="closeMobile()"
        />
      </Transition>

      <!-- 移动端侧边栏抽屉（从左侧滑入） -->
      <div
        class="w-56 transition-transform duration-200 inset-y-0 left-0 fixed z-30 md:hidden"
        :class="mobileOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <AppSidebar @close="closeMobile()" />
      </div>

      <!-- 主内容 -->
      <main class="flex-1 min-w-0">
        <RouterView v-slot="{ Component }">
          <Transition name="slide" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>
