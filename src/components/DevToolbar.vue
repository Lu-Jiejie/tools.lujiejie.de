<script setup lang="ts">
import { isDev } from '~/composables/useDevMode'
import { isPreviewProduction, showDevTools } from '~/composables/useDevPreview'
import BaseButton from './BaseButton.vue'
import ToggleButton from './ToggleButton.vue'

withDefaults(defineProps<{
  label?: string
  previewLabel?: string
  exitLabel?: string
}>(), {
  label: 'DEV',
  previewLabel: 'Preview Production',
  exitLabel: 'Exit Production Preview',
})

function setPreviewProduction(value: boolean) {
  isPreviewProduction.value = value
}
</script>

<template>
  <div v-if="isDev">
    <div
      v-if="showDevTools"
      border="~ dashed c-border"
      flex="~ gap-2 wrap" p-2 rounded-lg bg-c-raised items-center justify-between
    >
      <div flex="~ gap-2 wrap" items-center>
        <span
          border="~ c-border" text-xs font-mono px-1.5 py-0.5 rounded op-60
        >
          {{ label }}
        </span>
        <slot />
      </div>

      <ToggleButton
        :model-value="isPreviewProduction"
        icon="i-carbon-view"
        active-icon="i-carbon-view-off"
        @update:model-value="setPreviewProduction"
      >
        {{ previewLabel }}
      </ToggleButton>
    </div>

    <div v-else bottom-4 right-4 fixed z-50>
      <BaseButton icon="i-carbon-view-off" @click="setPreviewProduction(false)">
        {{ exitLabel }}
      </BaseButton>
    </div>
  </div>
</template>
