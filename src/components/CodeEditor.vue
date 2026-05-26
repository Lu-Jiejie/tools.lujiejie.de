<script lang="ts">
import { createHighlighter } from 'shiki'
</script>

<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { computed, nextTick, onMounted, shallowRef, watch } from 'vue'
import { isDark } from '~/composables/dark'

interface ThemeOption {
  label: string
  value: string
  light: string
  dark: string
}

const props = withDefaults(defineProps<{
  modelValue: string
  language?: string
  placeholder?: string
  rows?: number
  readonly?: boolean
  copyable?: boolean
  langs?: string[]
}>(), {
  language: 'json',
  placeholder: '',
  rows: 25,
  readonly: false,
  copyable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const CODE_EDITOR_THEME_OPTIONS: ThemeOption[] = [
  { label: 'Vitesse', value: 'vitesse', light: 'vitesse-light', dark: 'vitesse-dark' },
  { label: 'GitHub', value: 'github', light: 'github-light', dark: 'github-dark' },
  { label: 'Catppuccin', value: 'catppuccin', light: 'catppuccin-latte', dark: 'catppuccin-mocha' },
  { label: 'Dracula', value: 'dracula', light: 'dracula-soft', dark: 'dracula' },
  { label: 'Rose Pine', value: 'rose-pine', light: 'rose-pine-dawn', dark: 'rose-pine-moon' },
  { label: 'One Dark', value: 'one-dark', light: 'one-light', dark: 'one-dark-pro' },
  { label: 'Solarized', value: 'solarized', light: 'solarized-light', dark: 'solarized-dark' },
  { label: 'Material Theme', value: 'material-theme', light: 'material-theme-lighter', dark: 'material-theme-darker' },
]

const ALL_SHIKI_THEMES = CODE_EDITOR_THEME_OPTIONS.flatMap(t => [t.light, t.dark]).filter((v, i, a) => a.indexOf(v) === i)
const DEFAULT_LANGS = ['json', 'sql', 'typescript', 'javascript', 'java', 'xml', 'go', 'yaml', 'toml']

type CodeHighlighter = Awaited<ReturnType<typeof createHighlighter>>

let codeHighlighterPromise: Promise<CodeHighlighter> | null = null
const loadedShikiLangs = new Set<string>()

function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

function getCodeHighlighter(initialLangs: string[]) {
  if (!codeHighlighterPromise) {
    const langs = uniqueValues([...DEFAULT_LANGS, ...initialLangs])

    codeHighlighterPromise = createHighlighter({
      themes: ALL_SHIKI_THEMES,
      langs,
    }).then((highlighter) => {
      langs.forEach(lang => loadedShikiLangs.add(lang))
      return highlighter
    })
  }

  return codeHighlighterPromise
}

async function loadShikiLangs(highlighter: CodeHighlighter, langs: string[]) {
  const missing = uniqueValues(langs).filter(lang => !loadedShikiLangs.has(lang))
  if (missing.length === 0)
    return

  await highlighter.loadLanguage(...(missing as Parameters<typeof highlighter.loadLanguage>))
  missing.forEach(lang => loadedShikiLangs.add(lang))
}

const THEME_OPTIONS = CODE_EDITOR_THEME_OPTIONS
const selectedTheme = useLocalStorage('code-editor-theme', 'vitesse')
const currentTheme = computed(() => THEME_OPTIONS.find(t => t.value === selectedTheme.value) || THEME_OPTIONS[0])
const languageLabel = computed(() => (props.language || 'text').replace(/[-_]/g, ' '))
const editorHeight = computed(() => `calc(${props.rows} * (0.875rem * 1.6) + 4.5rem)`)
const codePaddingTop = '0.75rem'
const codeLineHeight = 'calc(0.875rem * 1.6)'
const codeLineHeight2 = 'calc((0.875rem * 1.6) * 2)'

const highlighter = shallowRef<CodeHighlighter | null>(null)
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
    color-mix(in srgb, var(--c-surface) 95%, var(--c-text) 5%) ${codeLineHeight},
    color-mix(in srgb, var(--c-surface) 95%, var(--c-text) 5%) ${codeLineHeight2}
  )`,
  backgroundSize: `100% ${codeLineHeight2}`,
  backgroundPosition: `0 calc(${codePaddingTop} - ${scrollTop.value}px - 1px)`,
}))

const lineCount = computed(() => {
  const textLines = (props.modelValue || '').split('\n').length
  return Math.max(textLines, props.rows)
})

const langsToLoad = computed(() => {
  return uniqueValues([
    ...DEFAULT_LANGS,
    props.language || 'json',
    ...(props.langs || []),
  ])
})

onMounted(async () => {
  highlighter.value = await getCodeHighlighter(langsToLoad.value)
  await loadShikiLangs(highlighter.value, langsToLoad.value)
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

watch(() => langsToLoad.value.join('|'), async () => {
  if (!highlighter.value)
    return

  await loadShikiLangs(highlighter.value, langsToLoad.value)
  updateHighlight()
})

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
    ref="rootRef" border="~ transparent" flex="~ col"
    rounded-2xl bg-c-input transition-colors relative overflow-hidden focus-within:border-c-border-strong not-focus-within:hover:border-c-border
    :style="{ height: editorHeight }"
  >
    <div
      flex="~ gap-3 items-center justify-between"
      border="b c-border"
      p="x-3 y-2" bg-c-surface top-0 sticky z-10
    >
      <div
        flex="~ items-center gap-2" min-w-0 select-none
      >
        <span rounded-full bg-c-accent op-75 shrink-0 h-3 w-0.75 />
        <span text="xs c-text-muted" leading-none font-mono truncate>
          {{ languageLabel }}
        </span>
      </div>

      <div flex="~ items-center gap-1" shrink-0>
        <label
          flex="~ items-center gap-1.5"
          border="~ transparent" p="l-2.5 r-2" transition="colors duration-200"
          rounded-lg bg-c-input min-h-8 focus-within:border-c-border-strong hover:border-c-border focus-within:bg-c-surface hover:bg-c-surface
        >
          <span

            text="[0.625rem] c-text-faint"
            leading-none font-mono hidden select-none sm:inline
          >
            theme
          </span>
          <select
            v-model="selectedTheme"

            text-xs text-c-text leading-none outline-none border-none bg-transparent cursor-pointer
            p="r-0"
          >
            <option
              v-for="theme in THEME_OPTIONS"
              :key="theme.value"
              :value="theme.value"
              bg-c-surface
            >
              {{ theme.label }}
            </option>
          </select>
        </label>

        <button
          v-if="copyable"
          flex="~ items-center justify-center"
          text-c-text-muted rounded-lg border-none bg-c-input size-8 cursor-pointer transition-colors duration-200 hover:text-c-text hover:bg-c-surface
          :title="copied ? '已复制' : '复制'"
          @click="copyCode"
        >
          <div i-carbon-copy text-sm />
        </button>
      </div>
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
          text-sm text-c-text-muted font-mono pr-2 op-55
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
