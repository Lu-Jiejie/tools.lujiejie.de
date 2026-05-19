<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { createHighlighter } from 'shiki'
import { computed, nextTick, onMounted, shallowRef, watch } from 'vue'
import { isDark } from '~/composables/dark'
import SelectInput from './SelectInput.vue'

const props = withDefaults(defineProps<{
  modelValue: string
  language?: string
  placeholder?: string
  rows?: number
  readonly?: boolean
  langs?: string[]
}>(), {
  language: 'json',
  placeholder: '',
  rows: 25,
  readonly: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

interface ThemeOption {
  label: string
  value: string
  light: string
  dark: string
}

const THEME_OPTIONS: ThemeOption[] = [
  { label: 'Vitesse', value: 'vitesse', light: 'vitesse-light', dark: 'vitesse-dark' },
  { label: 'GitHub', value: 'github', light: 'github-light', dark: 'github-dark' },
  { label: 'Catppuccin', value: 'catppuccin', light: 'catppuccin-latte', dark: 'catppuccin-mocha' },
  { label: 'Dracula', value: 'dracula', light: 'dracula-soft', dark: 'dracula' },
  { label: 'Rose Pine', value: 'rose-pine', light: 'rose-pine-dawn', dark: 'rose-pine-moon' },
  { label: 'One Dark', value: 'one-dark', light: 'one-light', dark: 'one-dark-pro' },
  { label: 'Solarized', value: 'solarized', light: 'solarized-light', dark: 'solarized-dark' },
  { label: 'Material Theme', value: 'material-theme', light: 'material-theme-lighter', dark: 'material-theme-darker' },
]

const ALL_SHIKI_THEMES = THEME_OPTIONS.flatMap(t => [t.light, t.dark]).filter((v, i, a) => a.indexOf(v) === i)

const DEFAULT_LANGS = ['json', 'sql', 'typescript', 'javascript', 'java', 'xml', 'go', 'yaml', 'toml']

const selectedTheme = useLocalStorage('code-editor-theme', 'vitesse')
const currentTheme = computed(() => THEME_OPTIONS.find(t => t.value === selectedTheme.value) || THEME_OPTIONS[0])
const editorHeight = computed(() => `calc(${props.rows} * (0.875rem * 1.6) + 3.75rem)`)
const codePaddingTop = '0.75rem'
const codeLineHeight = 'calc(0.875rem * 1.6)'
const codeLineHeight2 = 'calc((0.875rem * 1.6) * 2)'

const highlighter = shallowRef<Awaited<ReturnType<typeof createHighlighter>> | null>(null)
const highlightedHtml = shallowRef('')
const editorRef = shallowRef<HTMLTextAreaElement | null>(null)
const rootRef = shallowRef<HTMLElement | null>(null)
const scrollTop = shallowRef(0)
const scrollLeft = shallowRef(0)
const copied = shallowRef(false)

const stripeStyle = computed(() => ({
  backgroundImage: `repeating-linear-gradient(to bottom,
    color-mix(in srgb, var(--c-surface) 98%, var(--c-text) 2%) 0,
    color-mix(in srgb, var(--c-surface) 98%, var(--c-text) 2%) ${codeLineHeight},
    color-mix(in srgb, var(--c-surface) 93%, var(--c-text) 7%) ${codeLineHeight},
    color-mix(in srgb, var(--c-surface) 93%, var(--c-text) 7%) ${codeLineHeight2}
  )`,
  backgroundSize: `100% ${codeLineHeight2}`,
  backgroundPosition: `0 calc(${codePaddingTop} - ${scrollTop.value}px - 1px)`,
}))

const lineCount = computed(() => {
  const textLines = (props.modelValue || '').split('\n').length
  return Math.max(textLines, props.rows)
})

const langsToLoad = computed(() => {
  if (props.langs && props.langs.length > 0)
    return [...new Set([...DEFAULT_LANGS, ...props.langs])]
  return DEFAULT_LANGS
})

onMounted(async () => {
  highlighter.value = await createHighlighter({
    themes: ALL_SHIKI_THEMES,
    langs: langsToLoad.value,
  })
  updateHighlight()
})

function updateHighlight() {
  if (!highlighter.value) {
    highlightedHtml.value = ''
    return
  }
  const code = props.modelValue || ' '
  const lang = props.language || 'json'
  const theme = isDark.value ? currentTheme.value.dark : currentTheme.value.light
  try {
    highlightedHtml.value = highlighter.value.codeToHtml(code, { lang, theme })
  }
  catch {
    highlightedHtml.value = `<pre><code>${code.replace(/</g, '&lt;')}</code></pre>`
  }
}

watch(() => [props.modelValue, props.language, isDark.value, highlighter.value, selectedTheme.value], updateHighlight)

function syncScroll() {
  if (editorRef.value) {
    scrollTop.value = editorRef.value.scrollTop
    scrollLeft.value = editorRef.value.scrollLeft
  }
}

function syncScrollReadonly(e: Event) {
  const el = e.target as HTMLElement
  scrollTop.value = el.scrollTop
  scrollLeft.value = el.scrollLeft
}

function handleInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}

function handleTab(e: KeyboardEvent) {
  if (e.key === 'Tab') {
    e.preventDefault()
    const textarea = e.target as HTMLTextAreaElement
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = props.modelValue
    emit('update:modelValue', `${value.substring(0, start)}  ${value.substring(end)}`)
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 2
    })
  }
}

async function copyCode() {
  await navigator.clipboard.writeText(props.modelValue)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

defineExpose({ rootRef })
</script>

<template>
  <div
    ref="rootRef" border="~ c-border focus-within:c-border-strong"
    flex="~ col" bg="[var(--c-surface)]" transition-colors relative overflow-hidden
    :style="{ height: editorHeight }"
  >
    <!-- Sticky header -->
    <div flex="~ gap-1.5 items-center justify-end" border="b b-[var(--c-border)]" bg="[var(--c-surface)]" p-1.5 top-0 sticky z-10>
      <SelectInput
        v-model="selectedTheme" :options="THEME_OPTIONS"
        select-class="!px-2 !py-1 !rounded-md !bg-inherit" !text-xs
      />

      <button
        flex="~ items-center justify-center"
        hover="op-100 bg-[var(--c-border)]"
        rounded border-none bg-transparent op-50 h-6 w-6 cursor-pointer transition-colors transition-opacity duration-200
        :title="copied ? '已复制' : '复制'"
        @click="copyCode"
      >
        <div :class="copied ? 'i-carbon-checkmark' : 'i-carbon-copy'" text-sm />
      </button>
    </div>

    <!-- Scrollable code body -->
    <div flex flex-1 relative overflow-hidden>
      <div
        pointer-events-none bottom-0 left-12 right-0 top-0 absolute z-0
        :style="stripeStyle"
      />

      <!-- Line numbers -->
      <div
        py-3 text-right w-12 pointer-events-none select-none left-0 top-0 absolute z-2
        bg="[var(--c-surface)]"
        border-r="1 [var(--c-border)]"
        aria-hidden="true"
        :style="{ transform: `translateY(${-scrollTop}px)` }"
      >
        <div
          v-for="n in lineCount"
          :key="n"
          text-sm font-mono pr-2 op-35
          class="leading-[1.6]"
        >
          {{ n }}
        </div>
      </div>

      <!-- Readonly mode: scrollable highlight -->
      <div
        v-if="readonly"
        pl-12 h-full w-full relative z-1 overflow-auto
        class="[&_pre]:(text-sm leading-[1.6] font-inherit font-mono m-0 p-3 whitespace-pre) ![&_pre]:bg-transparent"
        @scroll="syncScrollReadonly"
        v-html="highlightedHtml"
      />

      <!-- Editable mode: highlight layer + textarea -->
      <template v-else>
        <div
          pointer-events-none left-12 right-0 top-0 absolute z-0
          class="[&_pre]:(text-sm leading-[1.6] font-inherit font-mono m-0 p-3 whitespace-pre) ![&_pre]:bg-transparent"
          aria-hidden="true"
          :style="{ transform: `translate(${-scrollLeft}px, ${-scrollTop}px)` }"
          v-html="highlightedHtml"
        />
        <textarea
          ref="editorRef"
          :value="modelValue"
          :placeholder="placeholder"
          caret="[var(--c-text,currentColor)]"
          text-sm text-transparent font-mono p-3 pl-15 outline-none border-none bg-transparent h-full w-full resize-none whitespace-pre relative z-1 overflow-auto
          class="leading-[1.6] placeholder:text-[var(--c-text-muted)]"
          spellcheck="false"
          @input="handleInput"
          @scroll="syncScroll"
          @keydown="handleTab"
        />
      </template>
    </div>
  </div>
</template>
