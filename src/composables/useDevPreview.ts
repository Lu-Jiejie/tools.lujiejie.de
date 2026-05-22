import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'
import { isDev } from './useDevMode'

export const isPreviewProduction = useLocalStorage('preview-production', false)

export const showDevTools = computed(() => isDev && !isPreviewProduction.value)
