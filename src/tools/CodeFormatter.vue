<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'code-formatter',
  name: 'Code Formatter',
  nameZh: '代码格式化',
  description: 'Format and prettify code with syntax highlighting and screenshot export.',
  descriptionZh: '格式化美化代码，支持语法高亮和截图导出。',
  category: 'dev',
  keywords: ['code', 'format', 'prettify', 'beautify', 'indent'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { toPng } from 'html-to-image'
import babelPlugin from 'prettier/plugins/babel'
import estreePlugin from 'prettier/plugins/estree'
import graphqlPlugin from 'prettier/plugins/graphql'
import htmlPlugin from 'prettier/plugins/html'
import markdownPlugin from 'prettier/plugins/markdown'
import postcssPlugin from 'prettier/plugins/postcss'
import typescriptPlugin from 'prettier/plugins/typescript'
import yamlPlugin from 'prettier/plugins/yaml'
import * as prettier from 'prettier/standalone'
import { createHighlighter } from 'shiki'
import { computed, onMounted, shallowRef, watch } from 'vue'
import AlertTip from '~/components/AlertTip.vue'
import BaseButton from '~/components/BaseButton.vue'
import Panel from '~/components/Panel.vue'
import SelectInput from '~/components/SelectInput.vue'
import { isDark } from '~/composables/dark'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  input_label: ['Input', '输入'],
  output_label: ['Output', '输出'],
  language: ['Language', '语言'],
  theme: ['Theme', '主题'],
  indent: ['Indent', '缩进'],
  placeholder: ['Paste your code here...', '在此粘贴代码...'],
  copy: ['Copy', '复制'],
  copied: ['Copied', '已复制'],
  screenshot: ['Screenshot', '截图'],
  format: ['Format', '格式化'],
  no_formatter: ['No formatter for this language, highlight only', '该语言暂无格式化支持，仅提供高亮'],
})

interface LangOption {
  label: string
  value: string
  parser?: string
  shikiLang: string
}

const LANG_OPTIONS: LangOption[] = [
  { label: 'Angular', value: 'angular', parser: 'angular', shikiLang: 'angular-html' },
  { label: 'Astro', value: 'astro', shikiLang: 'astro' },
  { label: 'Bash', value: 'bash', shikiLang: 'bash' },
  { label: 'C', value: 'c', shikiLang: 'c' },
  { label: 'C#', value: 'csharp', shikiLang: 'csharp' },
  { label: 'C++', value: 'cpp', shikiLang: 'cpp' },
  { label: 'CSS', value: 'css', parser: 'css', shikiLang: 'css' },
  { label: 'Dart', value: 'dart', shikiLang: 'dart' },
  { label: 'Diff', value: 'diff', shikiLang: 'diff' },
  { label: 'Dockerfile', value: 'docker', shikiLang: 'dockerfile' },
  { label: 'Elixir', value: 'elixir', shikiLang: 'elixir' },
  { label: 'Erlang', value: 'erlang', shikiLang: 'erlang' },
  { label: 'Go', value: 'go', shikiLang: 'go' },
  { label: 'GraphQL', value: 'graphql', parser: 'graphql', shikiLang: 'graphql' },
  { label: 'Haskell', value: 'haskell', shikiLang: 'haskell' },
  { label: 'HTML', value: 'html', parser: 'html', shikiLang: 'html' },
  { label: 'INI', value: 'ini', shikiLang: 'ini' },
  { label: 'Java', value: 'java', shikiLang: 'java' },
  { label: 'JavaScript', value: 'javascript', parser: 'babel', shikiLang: 'javascript' },
  { label: 'JSON', value: 'json', parser: 'json', shikiLang: 'json' },
  { label: 'JSX', value: 'jsx', parser: 'babel', shikiLang: 'jsx' },
  { label: 'Kotlin', value: 'kotlin', shikiLang: 'kotlin' },
  { label: 'LaTeX', value: 'latex', shikiLang: 'latex' },
  { label: 'Less', value: 'less', parser: 'less', shikiLang: 'less' },
  { label: 'Lua', value: 'lua', shikiLang: 'lua' },
  { label: 'Markdown', value: 'markdown', parser: 'markdown', shikiLang: 'markdown' },
  { label: 'MDX', value: 'mdx', parser: 'markdown', shikiLang: 'mdx' },
  { label: 'Nginx', value: 'nginx', shikiLang: 'nginx' },
  { label: 'Objective-C', value: 'objc', shikiLang: 'objective-c' },
  { label: 'Perl', value: 'perl', shikiLang: 'perl' },
  { label: 'PHP', value: 'php', shikiLang: 'php' },
  { label: 'PowerShell', value: 'powershell', shikiLang: 'powershell' },
  { label: 'Prisma', value: 'prisma', shikiLang: 'prisma' },
  { label: 'Python', value: 'python', shikiLang: 'python' },
  { label: 'R', value: 'r', shikiLang: 'r' },
  { label: 'Ruby', value: 'ruby', shikiLang: 'ruby' },
  { label: 'Rust', value: 'rust', shikiLang: 'rust' },
  { label: 'Scala', value: 'scala', shikiLang: 'scala' },
  { label: 'SCSS', value: 'scss', parser: 'scss', shikiLang: 'scss' },
  { label: 'Shell', value: 'shell', shikiLang: 'shellscript' },
  { label: 'SQL', value: 'sql', shikiLang: 'sql' },
  { label: 'Svelte', value: 'svelte', shikiLang: 'svelte' },
  { label: 'Swift', value: 'swift', shikiLang: 'swift' },
  { label: 'TOML', value: 'toml', shikiLang: 'toml' },
  { label: 'TSX', value: 'tsx', parser: 'typescript', shikiLang: 'tsx' },
  { label: 'TypeScript', value: 'typescript', parser: 'typescript', shikiLang: 'typescript' },
  { label: 'Vue', value: 'vue', parser: 'html', shikiLang: 'vue' },
  { label: 'XML', value: 'xml', shikiLang: 'xml' },
  { label: 'YAML', value: 'yaml', parser: 'yaml', shikiLang: 'yaml' },
  { label: 'Zig', value: 'zig', shikiLang: 'zig' },
]

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
  { label: 'Nord', value: 'nord', light: 'nord', dark: 'nord' },
  { label: 'One Dark', value: 'one-dark', light: 'one-light', dark: 'one-dark-pro' },
  { label: 'Tokyo Night', value: 'tokyo-night', light: 'tokyo-night', dark: 'tokyo-night' },
  { label: 'Solarized', value: 'solarized', light: 'solarized-light', dark: 'solarized-dark' },
]

const ALL_THEMES = THEME_OPTIONS.flatMap(t => [t.light, t.dark]).filter((v, i, a) => a.indexOf(v) === i)

const INDENT_OPTIONS = [
  { label: '2', value: '2' },
  { label: '4', value: '4' },
  { label: 'Tab', value: 'tab' },
]

const inputText = shallowRef('')
const language = shallowRef('javascript')
const theme = shallowRef('vitesse')
const indent = shallowRef('2')
const error = shallowRef('')
const outputText = shallowRef('')
const highlightedHtml = shallowRef('')
const copied = shallowRef(false)
const outputRef = shallowRef<HTMLElement | null>(null)

const currentLang = computed(() => LANG_OPTIONS.find(l => l.value === language.value)!)
const currentTheme = computed(() => THEME_OPTIONS.find(t => t.value === theme.value)!)
const canFormat = computed(() => !!currentLang.value.parser)

const highlighter = shallowRef<Awaited<ReturnType<typeof createHighlighter>> | null>(null)

onMounted(async () => {
  highlighter.value = await createHighlighter({
    themes: ALL_THEMES,
    langs: LANG_OPTIONS.map(l => l.shikiLang),
  })
})

async function formatCode() {
  if (!inputText.value.trim()) {
    error.value = ''
    outputText.value = ''
    return
  }
  if (!currentLang.value.parser) {
    outputText.value = inputText.value
    error.value = ''
    return
  }
  try {
    const indentVal = indent.value === 'tab' ? undefined : Number(indent.value)
    const result = await prettier.format(inputText.value, {
      parser: currentLang.value.parser,
      plugins: [babelPlugin, estreePlugin, postcssPlugin, htmlPlugin, markdownPlugin, typescriptPlugin, yamlPlugin, graphqlPlugin],
      tabWidth: indentVal ?? 2,
      useTabs: indent.value === 'tab',
      semi: true,
      singleQuote: true,
      trailingComma: 'all',
    })
    outputText.value = result
    error.value = ''
  }
  catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
    outputText.value = ''
  }
}

function highlight() {
  if (!highlighter.value || !outputText.value) {
    highlightedHtml.value = ''
    return
  }
  const themeId = isDark.value ? currentTheme.value.dark : currentTheme.value.light
  highlightedHtml.value = highlighter.value.codeToHtml(outputText.value, {
    lang: currentLang.value.shikiLang,
    theme: themeId,
  })
}

watch([outputText, language, isDark, highlighter, theme], highlight, { immediate: true })

watch([inputText, canFormat], () => {
  if (!canFormat.value)
    outputText.value = inputText.value
}, { immediate: true })

async function copyOutput() {
  if (!outputText.value)
    return
  await navigator.clipboard.writeText(outputText.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

async function takeScreenshot() {
  if (!outputRef.value)
    return
  const dataUrl = await toPng(outputRef.value, {
    pixelRatio: 2,
    backgroundColor: isDark.value ? '#1e1e1e' : '#ffffff',
  })
  const link = document.createElement('a')
  link.download = `code-${Date.now()}.png`
  link.href = dataUrl
  link.click()
}
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('input_label')">
      <div p-5 flex="~ col gap-4">
        <div flex="~ gap-3 wrap" items-center>
          <div flex="~ gap-2" items-center>
            <span text-xs tracking-wide font-medium op-60 select-none uppercase>{{ t('language') }}</span>
            <SelectInput v-model="language" :options="LANG_OPTIONS" />
          </div>
          <div flex="~ gap-2" items-center>
            <span text-xs tracking-wide font-medium op-60 select-none uppercase>{{ t('theme') }}</span>
            <SelectInput v-model="theme" :options="THEME_OPTIONS" />
          </div>
          <div flex="~ gap-2" items-center>
            <span text-xs tracking-wide font-medium op-60 select-none uppercase>{{ t('indent') }}</span>
            <SelectInput v-model="indent" :options="INDENT_OPTIONS" />
          </div>
          <BaseButton icon="i-carbon-clean" :disabled="!canFormat" @click="formatCode">
            {{ t('format') }}
          </BaseButton>
        </div>
        <AlertTip v-if="!canFormat" type="info">
          <span text-sm>{{ t('no_formatter') }}</span>
        </AlertTip>
        <textarea
          v-model="inputText"
          :placeholder="t('placeholder')"
          border="~ c-border focus:c-border-strong" text-sm font-mono px-3 py-2 outline-none rounded-xl bg-c-input w-full resize-none transition-colors
          rows="12"
          spellcheck="false"
        />
      </div>
    </Panel>

    <Panel :title="t('output_label')">
      <div p-5 flex="~ col gap-4">
        <AlertTip v-if="error" type="error">
          <span text-sm>{{ error }}</span>
        </AlertTip>
        <div flex="~ gap-2" items-center>
          <BaseButton icon="i-carbon-copy" :disabled="!outputText" @click="copyOutput">
            {{ copied ? t('copied') : t('copy') }}
          </BaseButton>
          <BaseButton icon="i-carbon-camera" :disabled="!outputText" @click="takeScreenshot">
            {{ t('screenshot') }}
          </BaseButton>
        </div>
        <div
          ref="outputRef"
          class="shiki-output"
          border="~ c-border" text-sm rounded-xl min-h-48 overflow-x-auto
          v-html="highlightedHtml"
        />
      </div>
    </Panel>
  </div>
</template>

<style scoped>
.shiki-output :deep(pre) {
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
  background: transparent !important;
}
.shiki-output :deep(code) {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
}
</style>
