<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { createHighlighter } from 'shiki'
import { computed, nextTick, onMounted, shallowRef, watch } from 'vue'
import { isDark } from '~/composables/dark'

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
const editorHeight = computed(() => `calc(${props.rows} * (0.875rem * 1.6) + 1.5rem)`)

const highlighter = shallowRef<Awaited<ReturnType<typeof createHighlighter>> | null>(null)
const highlightedHtml = shallowRef('')
const editorRef = shallowRef<HTMLTextAreaElement | null>(null)
const rootRef = shallowRef<HTMLElement | null>(null)
const scrollTop = shallowRef(0)
const scrollLeft = shallowRef(0)
const copied = shallowRef(false)

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
    ref="rootRef"
    class="code-editor"
    border="~ c-border focus-within:c-border-strong" rounded-xl transition-colors relative overflow-hidden
    :style="{ height: editorHeight }"
  >
    <!-- Sticky header -->
    <div class="code-header">
      <div flex="~ gap-1.5" items-center>
        <select v-model="selectedTheme" class="theme-select">
          <option v-for="t in THEME_OPTIONS" :key="t.value" :value="t.value">
            {{ t.label }}
          </option>
        </select>
        <button class="code-header-btn" :title="copied ? '已复制' : '复制'" @click="copyCode">
          <div :class="copied ? 'i-carbon-checkmark' : 'i-carbon-copy'" text-sm />
        </button>
      </div>
    </div>

    <!-- Scrollable code body -->
    <div class="code-body">
      <!-- Line numbers -->
      <div
        class="code-line-numbers"
        aria-hidden="true"
        :style="{ transform: `translateY(${-scrollTop}px)` }"
      >
        <div v-for="n in lineCount" :key="n" class="code-line-number">
          {{ n }}
        </div>
      </div>

      <!-- Readonly mode: scrollable highlight -->
      <div
        v-if="readonly"
        class="code-readonly"
        @scroll="syncScrollReadonly"
        v-html="highlightedHtml"
      />

      <!-- Editable mode: highlight layer + textarea -->
      <template v-else>
        <div
          class="code-highlight"
          aria-hidden="true"
          :style="{ transform: `translate(${-scrollLeft}px, ${-scrollTop}px)` }"
          v-html="highlightedHtml"
        />
        <textarea
          ref="editorRef"
          :value="modelValue"
          :placeholder="placeholder"
          class="code-textarea"
          spellcheck="false"
          @input="handleInput"
          @scroll="syncScroll"
          @keydown="handleTab"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.code-editor {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--c-surface, #f8f8f8);
}

.code-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0.35rem 0.5rem;
  background: var(--c-surface, #f8f8f8);
  border-bottom: 1px solid var(--c-border, #e5e5e5);
}

.theme-select {
  appearance: none;
  font-size: 0.7rem;
  padding: 0.2rem 1.25rem 0.2rem 0.4rem;
  border: 1px solid var(--c-border, #e5e5e5);
  border-radius: 0.375rem;
  background: var(--c-surface, #f8f8f8);
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
  background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"%3E%3Cpath fill="%23aaa" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/%3E%3C/svg%3E');
  background-repeat: no-repeat;
  background-position: right 3px center;
  background-size: 12px;
}

.theme-select:hover {
  border-color: var(--c-border-strong, #ccc);
}

.code-header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.25rem;
  border: none;
  background: transparent;
  cursor: pointer;
  opacity: 0.5;
  transition:
    opacity 0.2s,
    background 0.2s;
}

.code-header-btn:hover {
  opacity: 1;
  background: var(--c-border, #e5e5e5);
}

.code-body {
  position: relative;
  flex: 1;
  overflow: hidden;
  display: flex;
}

.code-line-numbers {
  position: absolute;
  top: 0;
  left: 0;
  width: 3rem;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  text-align: right;
  user-select: none;
  pointer-events: none;
  z-index: 2;
  background: var(--c-surface, #f8f8f8);
  border-right: 1px solid var(--c-border, #e5e5e5);
}

.code-line-number {
  padding-right: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.6;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  opacity: 0.35;
}

.code-highlight {
  position: absolute;
  top: 0;
  left: 3rem;
  right: 0;
  pointer-events: none;
  z-index: 0;
}

.code-highlight :deep(pre) {
  margin: 0;
  padding: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.6;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  white-space: pre;
  background: transparent !important;
}

.code-highlight :deep(code) {
  font-family: inherit;
}

.code-readonly {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  padding-left: 3rem;
  overflow: auto;
}

.code-readonly :deep(pre) {
  margin: 0;
  padding: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.6;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  white-space: pre;
  background: transparent !important;
}

.code-readonly :deep(code) {
  font-family: inherit;
}

.code-textarea {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  padding: 0.75rem;
  padding-left: 3.75rem;
  font-size: 0.875rem;
  line-height: 1.6;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  white-space: pre;
  overflow: auto;
  resize: none;
  background: transparent;
  color: transparent;
  caret-color: var(--c-text, currentColor);
  outline: none;
  border: none;
}

.code-textarea::placeholder {
  color: var(--c-text-muted, #999);
}
</style>
