import type { BundledLanguage, BundledTheme, HighlighterGeneric } from 'shiki'
import type { ComputedRef } from 'vue'

import { shallowRef, watch } from 'vue'
import {
  ensureLanguages,
  getHighlighter,
} from './useShiki'

export function useCodeHighlighter(
  langs: ComputedRef<string[]>,
) {
  const highlighter = shallowRef<HighlighterGeneric<BundledLanguage, BundledTheme> | null>(null)

  watch(
    langs,
    async (value) => {
      highlighter.value = await getHighlighter()

      await ensureLanguages(value)
    },
    {
      immediate: true,
      deep: true,
    },
  )

  return {
    highlighter,
  }
}
