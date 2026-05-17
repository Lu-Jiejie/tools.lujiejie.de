<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'data-format-converter',
  name: 'JSON-like Format Converter',
  nameZh: '类JSON格式互转',
  description: 'Convert between JSON, YAML, TOML, and XML formats with syntax highlighting.',
  descriptionZh: '在 JSON、YAML、TOML、XML 格式之间互相转换，支持语法高亮。',
  category: 'convert',
  keywords: ['json', 'yaml', 'toml', 'xml', 'convert', 'format'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { XMLBuilder, XMLParser } from 'fast-xml-parser'
import * as yaml from 'js-yaml'
import { createHighlighter } from 'shiki'
import * as TOML from 'smol-toml'
import { onMounted, shallowRef, watch } from 'vue'
import AlertTip from '~/components/AlertTip.vue'
import BaseButton from '~/components/BaseButton.vue'
import Panel from '~/components/Panel.vue'
import SelectInput from '~/components/SelectInput.vue'
import { isDark } from '~/composables/dark'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  input_label: ['Input', '输入'],
  output_label: ['Output', '输出'],
  from: ['From', '源格式'],
  to: ['To', '目标格式'],
  placeholder: ['Paste your content here...', '在此粘贴内容...'],
  error: ['Conversion Error', '转换错误'],
  copy: ['Copy', '复制'],
  copied: ['Copied', '已复制'],
  indent: ['Indent', '缩进'],
})

type Format = 'json' | 'yaml' | 'toml' | 'xml'

const FORMAT_OPTIONS: { label: string, value: Format }[] = [
  { label: 'JSON', value: 'json' },
  { label: 'YAML', value: 'yaml' },
  { label: 'TOML', value: 'toml' },
  { label: 'XML', value: 'xml' },
]

const INDENT_OPTIONS = [
  { label: '2', value: '2' },
  { label: '4', value: '4' },
  { label: 'Tab', value: 'tab' },
]

const LANG_MAP: Record<Format, string> = {
  json: 'json',
  yaml: 'yaml',
  toml: 'toml',
  xml: 'xml',
}

const inputText = shallowRef('')
const fromFormat = shallowRef<Format>('json')
const toFormat = shallowRef<Format>('yaml')
const indent = shallowRef('2')
const error = shallowRef('')
const highlightedHtml = shallowRef('')
const copied = shallowRef(false)

const highlighter = shallowRef<Awaited<ReturnType<typeof createHighlighter>> | null>(null)

onMounted(async () => {
  highlighter.value = await createHighlighter({
    themes: ['vitesse-light', 'vitesse-dark'],
    langs: ['json', 'yaml', 'toml', 'xml'],
  })
})

function getIndent(): string | number {
  return indent.value === 'tab' ? '\t' : Number(indent.value)
}

function parse(text: string, format: Format): unknown {
  const trimmed = text.trim()
  if (!trimmed)
    return undefined
  switch (format) {
    case 'json':
      return JSON.parse(trimmed)
    case 'yaml':
      return yaml.load(trimmed)
    case 'toml':
      return TOML.parse(trimmed)
    case 'xml': {
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
      return parser.parse(trimmed)
    }
  }
}

function stringify(data: unknown, format: Format): string {
  if (data === undefined)
    return ''
  const indentVal = getIndent()
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, indentVal)
    case 'yaml':
      return yaml.dump(data, { indent: typeof indentVal === 'number' ? indentVal : 2 })
    case 'toml':
      return TOML.stringify(data as Record<string, unknown>)
    case 'xml': {
      const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        format: true,
        indentBy: typeof indentVal === 'number' ? ' '.repeat(indentVal) : '\t',
      })
      return builder.build(data)
    }
  }
}

const outputText = shallowRef('')

watch([inputText, fromFormat, toFormat, indent], () => {
  if (!inputText.value.trim()) {
    error.value = ''
    outputText.value = ''
    return
  }
  try {
    const data = parse(inputText.value, fromFormat.value)
    outputText.value = stringify(data, toFormat.value)
    error.value = ''
  }
  catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
    outputText.value = ''
  }
}, { immediate: true })

function highlight() {
  if (!highlighter.value || !outputText.value) {
    highlightedHtml.value = ''
    return
  }
  highlightedHtml.value = highlighter.value.codeToHtml(outputText.value, {
    lang: LANG_MAP[toFormat.value],
    theme: isDark.value ? 'vitesse-dark' : 'vitesse-light',
  })
}

watch([outputText, toFormat, isDark, highlighter], highlight, { immediate: true })

async function copyOutput() {
  if (!outputText.value)
    return
  await navigator.clipboard.writeText(outputText.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('input_label')">
      <div p-5 flex="~ col gap-4">
        <div flex="~ gap-3 wrap" items-center>
          <div flex="~ gap-2" items-center>
            <span text-xs tracking-wide font-medium op-60 select-none uppercase>{{ t('from') }}</span>
            <SelectInput v-model="fromFormat" :options="FORMAT_OPTIONS" />
          </div>
          <div flex="~ gap-2" items-center>
            <span text-xs tracking-wide font-medium op-60 select-none uppercase>{{ t('to') }}</span>
            <SelectInput v-model="toFormat" :options="FORMAT_OPTIONS" />
          </div>
          <div flex="~ gap-2" items-center>
            <span text-xs tracking-wide font-medium op-60 select-none uppercase>{{ t('indent') }}</span>
            <SelectInput v-model="indent" :options="INDENT_OPTIONS" />
          </div>
        </div>
        <textarea
          v-model="inputText"
          :placeholder="t('placeholder')"
          border="~ c-border focus:c-border-strong" text-sm font-mono px-3 py-2 outline-none rounded-xl bg-c-input w-full resize-none transition-colors
          rows="10"
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
        </div>
        <div
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
