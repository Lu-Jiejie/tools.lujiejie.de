<script setup lang="ts">
import TheHeader from '~/components/layout/TheHeader.vue'
import TheSidebar from '~/components/layout/TheSidebar.vue'
import { useSidebar } from '~/composables'

const { mobileOpen, closeMobile } = useSidebar()
</script>

<template>
  <div font-sans flex="~ col" min-h-screen>
    <TheHeader />

    <div flex flex-1>
      <!-- 桌面端侧边栏（始终显示） -->
      <div shrink-0 w-56 class="hidden md:block">
        <div h="[calc(100vh-3.5rem)]" top-14 sticky overflow-y-auto>
          <TheSidebar />
        </div>
      </div>

      <!-- 移动端遮罩 -->
      <Transition name="fade">
        <div
          v-if="mobileOpen"
          bg="black/50"
          inset-0 fixed z-20 md:hidden
          @click="closeMobile()"
        />
      </Transition>

      <!-- 移动端侧边栏抽屉（从左侧滑入） -->
      <div
        w-56 transition-transform duration-200 inset-y-0 left-0 fixed z-30 md:hidden
        :class="mobileOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <TheSidebar @close="closeMobile()" />
      </div>

      <!-- 主内容 -->
      <main flex-1 min-w-0>
        <RouterView v-slot="{ Component }">
          <Transition name="slide" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>
