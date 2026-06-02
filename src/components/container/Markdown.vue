<script setup lang="ts">
import { useDark } from '@vueuse/core'
import { computed, shallowRef, watchEffect } from 'vue'
import { useLocale } from '~/composables'
import { useCodeHighlighter } from '~/composables/useCodeHighlighter'
import { createMarkdownRenderer, extractMarkdownLangs } from '~/utils/markdown'
import '~/styles/markdown.css'

type Localized = string | [string, string]

const props = defineProps<{
  content: Localized
}>()

const { locale } = useLocale()
const isDark = useDark()

const markdown = computed(() => {
  if (typeof props.content === 'string')
    return props.content

  return locale.value === 'zh'
    ? props.content[1]
    : props.content[0]
})

const langsToLoad = computed(() =>
  extractMarkdownLangs(
    markdown.value,
  ),
)

const {
  highlighter,
} = useCodeHighlighter(
  langsToLoad,
)

const renderer = computed(() => {
  if (!highlighter.value)
    return null

  return createMarkdownRenderer(
    highlighter.value,
    isDark.value
      ? 'vitesse-dark'
      : 'vitesse-light',
  )
})

const rendered
  = shallowRef('')

watchEffect(() => {
  if (!renderer.value)
    return

  rendered.value
    = renderer.value(
      markdown.value,
    )
})
</script>

<template>
  <div
    class="shiki markdown" p-5 op-90
    v-html="rendered"
  />
</template>
