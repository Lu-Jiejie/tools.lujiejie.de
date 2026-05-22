<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'
import { computed } from 'vue'

const { y } = useWindowScroll()
const visible = computed(() => y.value > 350)

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-200 ease-out"
    enter-from-class="op-0"
    enter-to-class="op-65"
    leave-active-class="transition-opacity duration-150 ease-in"
    leave-from-class="op-65"
    leave-to-class="op-0"
  >
    <button
      v-if="visible"
      type="button"
      title="Back to top"
      aria-label="Back to top"

      border="~ c-border"

      text-lg rounded-xl bg-c-surface op-65 place-center size-10 panel-shadow transition-colors duration-150 bottom-4 right-4 fixed z-20
      hover="op-90 border-c-border-strong"
      @click="scrollToTop"
    >
      <span i-carbon-chevron-up op-60 />
    </button>
  </Transition>
</template>
