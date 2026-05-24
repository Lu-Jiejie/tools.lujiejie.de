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
  neutral: 'border-c-border text-c-text-muted bg-c-surface',
  warning: 'border-yellow-500/30 text-yellow-600 bg-yellow-500/8',
  error: 'border-red-500/30 text-red-500 bg-red-500/8',
  info: 'border-sky-500/30 text-sky-500 bg-sky-500/8',
  success: 'border-emerald-500/30 text-emerald-500 bg-emerald-500/8',
}[props.type]))
</script>

<template>
  <div
    flex="~ gap-2.5 items-start"
    border="~"

    text-sm leading-relaxed px-3.5 py-3 rounded-xl select-none
    :class="toneClass"
  >
    <div
      text-base mt-0.5 shrink-0
      :class="iconClass"
    />
    <slot />
  </div>
</template>
