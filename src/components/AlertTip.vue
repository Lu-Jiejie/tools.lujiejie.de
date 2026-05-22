<script setup lang="ts">
import { computed } from 'vue'

type AlertTipType = 'neutral' | 'warning' | 'error' | 'info' | 'success'

const props = withDefaults(defineProps<{
  type?: AlertTipType
}>(), {
  type: 'warning',
})

const iconClass = computed(() => ({
  neutral: 'i-carbon-information',
  warning: 'i-carbon-warning',
  error: 'i-carbon-close-outline',
  info: 'i-carbon-information',
  success: 'i-carbon-checkmark-outline',
}[props.type]))

const toneClass = computed(() => ({
  neutral: 'text-[var(--c-text-muted)]',
  warning: 'text-yellow-500',
  error: 'text-red-400',
  info: 'text-blue-400',
  success: 'text-green-500',
}[props.type]))
</script>

<template>
  <div
    flex="~ gap-2" px-3 py-2 border="~ c-border" rounded-lg bg-c-raised select-none items-start
    :class="toneClass"
  >
    <div
      text-sm mt-0.5 shrink-0
      :class="iconClass"
    />
    <slot />
  </div>
</template>
