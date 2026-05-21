<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'jsonpath-tester',
  name: 'JSONPath Tester',
  nameZh: 'JSONPath 测试',
  description: 'Query JSON with JSONPath and inspect matched paths and values.',
  descriptionZh: '使用 JSONPath 查询 JSON，并查看匹配路径和值。',
  category: 'dev',
  keywords: ['jsonpath', 'json', 'query', 'filter', 'debug', 'tester'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { JSONPath } from 'jsonpath-plus'
import { computed, shallowRef } from 'vue'
import AlertTip from '~/components/AlertTip.vue'
import BaseButton from '~/components/BaseButton.vue'
import CodeEditor from '~/components/CodeEditor.vue'
import LabelField from '~/components/container/LabelField.vue'
import Panel from '~/components/container/Panel.vue'
import TextInput from '~/components/TextInput.vue'
import { isDev } from '~/composables/useDevMode'
import { useI18n } from '~/composables/useI18n'

interface PresetExpression {
  label: string
  expression: string
  json?: string
}

interface JsonPathMatch {
  path: string
  pointer: string
  parentProperty: string
  value: unknown
}

interface JsonPathPayload {
  path?: string
  pointer?: string
  parentProperty?: string | number
  value: unknown
}

const { t } = useI18n({
  input_label: ['Input', '输入'],
  result_label: ['Result', '结果'],
  output_label: ['Matched Values JSON', '匹配值 JSON'],
  json: ['JSON', 'JSON'],
  expression: ['JSONPath', 'JSONPath'],
  expression_placeholder: ['e.g. $.store.book[?(@.price < 10)].title', '例如 $.store.book[?(@.price < 10)].title'],
  presets: ['Presets', '预设'],
  copy_values: ['Copy Values', '复制值'],
  copy_paths: ['Copy Paths', '复制路径'],
  copy_pointers: ['Copy Pointers', '复制指针'],
  copied: ['Copied', '已复制'],
  path: ['Path', '路径'],
  pointer: ['Pointer', '指针'],
  value: ['Value', '值'],
  no_match: ['No matches', '无匹配结果'],
  parse_error: ['JSON Parse Error', 'JSON 解析错误'],
  query_error: ['JSONPath Error', 'JSONPath 错误'],
  match_count: [
    (count: string) => `${count} matches`,
    (count: string) => `${count} 个匹配`,
  ],
})

const DEFAULT_JSON = `{
  "store": {
    "book": [
      {
        "category": "reference",
        "author": "Nigel Rees",
        "title": "Sayings of the Century",
        "price": 8.95
      },
      {
        "category": "fiction",
        "author": "Evelyn Waugh",
        "title": "Sword of Honour",
        "price": 12.99
      },
      {
        "category": "fiction",
        "author": "Herman Melville",
        "title": "Moby Dick",
        "isbn": "0-553-21311-3",
        "price": 8.99
      },
      {
        "category": "fiction",
        "author": "J. R. R. Tolkien",
        "title": "The Lord of the Rings",
        "isbn": "0-395-19395-8",
        "price": 22.99
      }
    ],
    "bicycle": {
      "color": "red",
      "price": 19.95
    }
  },
  "expensive": 10
}`

const PRESETS: PresetExpression[] = [
  { label: 'All authors', expression: '$.store.book[*].author', json: DEFAULT_JSON },
  { label: 'Cheap books', expression: '$.store.book[?(@.price < 10)].title', json: DEFAULT_JSON },
  { label: 'All prices', expression: '$..price', json: DEFAULT_JSON },
  { label: 'First two books', expression: '$.store.book[0:2]', json: DEFAULT_JSON },
  { label: 'Books with ISBN', expression: '$.store.book[?(@.isbn)]', json: DEFAULT_JSON },
  { label: 'Book title + price', expression: '$.store.book[*][\'title\',\'price\']', json: DEFAULT_JSON },
]

const inputJson = shallowRef('')
const expression = shallowRef('')
const copiedTarget = shallowRef<'values' | 'paths' | 'pointers' | ''>('')

const parsedJson = computed(() => {
  if (!inputJson.value.trim())
    return { data: undefined, error: '' }

  try {
    return { data: JSON.parse(inputJson.value), error: '' }
  }
  catch (error) {
    return {
      data: undefined,
      error: error instanceof Error ? error.message : String(error),
    }
  }
})

const queryState = computed<{ matches: JsonPathMatch[], error: string }>(() => {
  if (parsedJson.value.error || parsedJson.value.data === undefined || !expression.value.trim())
    return { matches: [], error: '' }

  try {
    return {
      matches: evaluateJsonPath(parsedJson.value.data, expression.value),
      error: '',
    }
  }
  catch (error) {
    return {
      matches: [],
      error: error instanceof Error ? error.message : String(error),
    }
  }
})

const matches = computed(() => queryState.value.matches)
const outputJson = computed(() => matches.value.length > 0 ? formatJsonPathResult(matches.value) : '')
const pathOutput = computed(() => matches.value.map(match => match.path).join('\n'))
const pointerOutput = computed(() => matches.value.map(match => match.pointer).filter(Boolean).join('\n'))
const statusText = computed(() => t('match_count', String(matches.value.length)))

function evaluateJsonPath(source: unknown, path: string): JsonPathMatch[] {
  const payloads = JSONPath<JsonPathPayload[] | JsonPathPayload | undefined>({
    path,
    json: source as JSONPathJson,
    resultType: 'all',
    wrap: true,
    flatten: false,
    eval: 'safe',
    ignoreEvalErrors: false,
  })

  const normalizedPayloads = Array.isArray(payloads)
    ? payloads
    : payloads === undefined
      ? []
      : [payloads]

  return normalizedPayloads.map((payload, index) => ({
    path: payload.path || `$[${index}]`,
    pointer: payload.pointer || '',
    parentProperty: payload.parentProperty === undefined ? '' : String(payload.parentProperty),
    value: payload.value,
  }))
}

function formatJsonPathResult(matches: JsonPathMatch[]): string {
  const values = matches.map(match => match.value)
  return JSON.stringify(values.length === 1 ? values[0] : values, null, 2)
}

function applyPreset(preset: PresetExpression) {
  expression.value = preset.expression
  if (preset.json)
    inputJson.value = preset.json
}

async function copyText(text: string, target: 'values' | 'paths' | 'pointers') {
  if (!text)
    return

  await navigator.clipboard.writeText(text)
  copiedTarget.value = target
  setTimeout(() => {
    if (copiedTarget.value === target)
      copiedTarget.value = ''
  }, 1500)
}

type JSONPathJson = null | boolean | number | string | object | unknown[]
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('input_label')">
      <div p-5 flex="~ col gap-4">
        <LabelField v-if="isDev" :label="t('presets')">
          <div flex="~ gap-2 wrap">
            <BaseButton
              v-for="preset in PRESETS"
              :key="preset.expression"
              :active="expression === preset.expression"
              @click="applyPreset(preset)"
            >
              {{ preset.label }}
            </BaseButton>
          </div>
        </LabelField>

        <LabelField :label="t('expression')">
          <TextInput
            v-model="expression"
            :placeholder="t('expression_placeholder')"
            :error="!!queryState.error"
            :copyable="true"
          />
        </LabelField>

        <LabelField :label="t('json')">
          <CodeEditor
            v-model="inputJson"
            language="json"
            :rows="18"
            :langs="['json']"
          />
        </LabelField>

        <AlertTip v-if="parsedJson.error" type="error">
          <span text-sm>{{ t('parse_error') }}: {{ parsedJson.error }}</span>
        </AlertTip>
        <AlertTip v-else-if="queryState.error" type="error">
          <span text-sm>{{ t('query_error') }}: {{ queryState.error }}</span>
        </AlertTip>
      </div>
    </Panel>

    <Panel :title="t('result_label')">
      <div p-5 flex="~ col gap-4">
        <div flex="~ gap-3 wrap" items-center justify-between>
          <div text-sm op-60>
            {{ statusText }}
          </div>

          <div flex="~ gap-2 wrap">
            <BaseButton icon="i-carbon-copy" :disabled="!outputJson" @click="copyText(outputJson, 'values')">
              {{ copiedTarget === 'values' ? t('copied') : t('copy_values') }}
            </BaseButton>
            <BaseButton icon="i-carbon-list" :disabled="!pathOutput" @click="copyText(pathOutput, 'paths')">
              {{ copiedTarget === 'paths' ? t('copied') : t('copy_paths') }}
            </BaseButton>
            <BaseButton icon="i-carbon-code" :disabled="!pointerOutput" @click="copyText(pointerOutput, 'pointers')">
              {{ copiedTarget === 'pointers' ? t('copied') : t('copy_pointers') }}
            </BaseButton>
          </div>
        </div>

        <LabelField :label="t('output_label')">
          <CodeEditor
            :model-value="outputJson"
            language="json"
            :rows="10"
            :langs="['json']"
            readonly
          />
        </LabelField>
      </div>
    </Panel>
  </div>
</template>
