<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'json-like-format-converter',
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
import * as TOML from 'smol-toml'
import { shallowRef, watch } from 'vue'
import AlertTip from '~/components/AlertTip.vue'
import BaseButton from '~/components/BaseButton.vue'
import CodeEditor from '~/components/CodeEditor.vue'
import LabelField from '~/components/container/LabelField.vue'
import Panel from '~/components/container/Panel.vue'
import CustomSelect from '~/components/CustomSelect.vue'
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

const inputText = shallowRef('')
const fromFormat = shallowRef<Format>('json')
const toFormat = shallowRef<Format>('yaml')
const indent = shallowRef('2')
const error = shallowRef('')
const copied = shallowRef(false)
const outputText = shallowRef('')

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
          <LabelField :label="t('from')">
            <CustomSelect v-model="fromFormat" :options="FORMAT_OPTIONS" />
          </LabelField>
          <LabelField :label="t('to')">
            <CustomSelect v-model="toFormat" :options="FORMAT_OPTIONS" />
          </LabelField>
          <LabelField :label="t('indent')">
            <CustomSelect v-model="indent" :options="INDENT_OPTIONS" />
          </LabelField>
        </div>
        <CodeEditor
          v-model="inputText"
          :language="fromFormat"
          :placeholder="t('placeholder')"
          :rows="14"
          :langs="['json', 'yaml', 'toml', 'xml']"
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
        <CodeEditor
          :model-value="outputText"
          :language="toFormat"
          :rows="14"
          :langs="['json', 'yaml', 'toml', 'xml']"
          readonly
        />
      </div>
    </Panel>
  </div>
</template>
