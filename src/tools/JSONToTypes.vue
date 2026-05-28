<script lang="ts">
import { useLocalStorage } from '@vueuse/core'
import LabelField from '~/components/container/LabelField.vue'
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'json-to-types',
  name: 'JSON to Types',
  nameZh: 'JSON 转类型',
  description: 'Convert JSON into TypeScript, Rust, Python and more.',
  descriptionZh: '将 JSON 转换为 TypeScript、Rust、Python 等类型定义。',
  category: 'dev',
  keywords: [
    'json',
    'typescript',
    'rust',
    'python',
    'go',
    'schema',
    'interface',
    'quicktype',
    'type',
  ],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import {
  getTargetLanguage,
  InputData,
  jsonInputForTargetLanguage,
  quicktype,
} from 'quicktype-core'

import {
  computed,
  shallowRef,
  watch,
} from 'vue'

import Panel from '~/components/container/Panel.vue'
import BaseButton from '~/components/input/BaseButton.vue'
import CodeEditor from '~/components/input/CodeEditor.vue'
import SelectInput from '~/components/input/SelectInput.vue'
import AlertTip from '~/components/ui/AlertTip.vue'
import DevToolbar from '~/components/ui/DevToolbar.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  input_title: ['Input', '输入'],
  output_title: ['Generated Types', '生成结果'],
  target_language: ['Target Language', '目标语言'],

  invalid_json: ['Invalid JSON', 'JSON 无效'],
  waiting: ['Paste JSON to generate types.', '粘贴 JSON 后自动生成类型。'],

  fill_demo: ['Fill Demo', '填充示例'],

  option_prefer_types: ['Use types instead of interfaces', '使用 type 而非 interface'],

  preview_production: ['Preview Production', '预览上线模式'],
  exit_preview: ['Exit Production Preview', '退出上线预览'],

  copy: ['Copy', '复制'],
  copied: ['Copied', '已复制'],
})

interface ToolOption {
  key: string
  labelKey: string

  type: 'boolean'

  default?: boolean

  rendererOption?: {
    key: string
    value: string
  }
}

interface TargetOption {
  label: string
  value: string

  lang: string
  shikiLang: string

  options?: ToolOption[]
  /** Options always passed to quicktype, not user-toggleable. */
  defaultOptions?: Record<string, string>
}

const TARGETS: TargetOption[] = [
  {
    label: 'TypeScript',
    value: 'typescript',
    lang: 'typescript',
    shikiLang: 'typescript',
    options: [
      {
        key: 'preferTypes',
        labelKey: 'option_prefer_types',
        type: 'boolean',
        rendererOption: {
          key: 'prefer-types',
          value: 'true',
        },
      },
    ],
  },
  {
    label: 'JSON Schema',
    value: 'schema',
    lang: 'schema',
    shikiLang: 'json',
  },
  {
    label: 'Rust',
    value: 'rust',
    lang: 'rust',
    shikiLang: 'rust',
    defaultOptions: {
      'density': 'dense',
      'leading-comments': 'false',
      'visibility': 'public',
    },
  },
  {
    label: 'Python',
    value: 'python',
    lang: 'python',
    shikiLang: 'python',
  },
  {
    label: 'Go',
    value: 'go',
    lang: 'go',
    shikiLang: 'go',
  },
  {
    label: 'Kotlin',
    value: 'kotlin',
    lang: 'kotlin',
    shikiLang: 'kotlin',
    defaultOptions: {
      framework: 'just-types',
      package: 'example',
    },
  },
  {
    label: 'Java',
    value: 'java',
    lang: 'java',
    shikiLang: 'java',
  },
  {
    label: 'C#',
    value: 'csharp',
    lang: 'csharp',
    shikiLang: 'csharp',
  },
  {
    label: 'Swift',
    value: 'swift',
    lang: 'swift',
    shikiLang: 'swift',
  },
  {
    label: 'Dart',
    value: 'dart',
    lang: 'dart',
    shikiLang: 'dart',
  },
  {
    label: 'Ruby',
    value: 'ruby',
    lang: 'ruby',
    shikiLang: 'ruby',
  },
  {
    label: 'PHP',
    value: 'php',
    lang: 'php',
    shikiLang: 'php',
  },
]

const DEFAULT_JSON = `{
  "id": 1001,
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "active": true,
  "roles": ["admin", "editor"],
  "profile": {
    "age": 32,
    "city": "London"
  }
}`

const inputJson = shallowRef('')
const output = shallowRef('')
const error = shallowRef('')
const target = useLocalStorage('json-to-types-target', 'typescript')

const optionValues = shallowRef<Record<string, boolean>>({})

const currentTarget = computed(() => {
  return TARGETS.find(t => t.value === target.value)
    || TARGETS[0]
})

const outputLanguage = computed(() => {
  return currentTarget.value.shikiLang
})

const outputLangs = computed(() => {
  return [
    ...new Set(TARGETS.map(t => t.shikiLang)),
    'json',
  ]
})

watch(currentTarget, (target) => {
  const values: Record<string, boolean> = {}

  for (const option of target.options || []) {
    values[option.key] = option.default ?? false
  }

  optionValues.value = values
}, {
  immediate: true,
})

function toggleOption(key: string) {
  optionValues.value = {
    ...optionValues.value,
    [key]: !optionValues.value[key],
  }
}

const rendererOptions = computed(() => {
  const result: Record<string, string> = {}

  for (const option of currentTarget.value.options || []) {
    if (!optionValues.value[option.key])
      continue

    if (option.rendererOption) {
      result[option.rendererOption.key]
        = option.rendererOption.value
    }
  }

  return result
})

const parsedJson = computed(() => {
  if (!inputJson.value.trim())
    return undefined

  try {
    return JSON.parse(inputJson.value)
  }
  catch {
    return undefined
  }
})

const parseError = computed(() => {
  if (!inputJson.value.trim())
    return ''

  try {
    JSON.parse(inputJson.value)
    return ''
  }
  catch (err) {
    return err instanceof Error
      ? err.message
      : String(err)
  }
})

let generationId = 0

async function generateTypes() {
  const data = parsedJson.value

  if (data === undefined) {
    output.value = ''
    return
  }

  const id = ++generationId

  try {
    const lang = getTargetLanguage(
      currentTarget.value.lang as any,
    )

    const jsonInput = jsonInputForTargetLanguage(lang)

    await jsonInput.addSource({
      name: 'Root',
      samples: [
        JSON.stringify(data),
      ],
    })

    const inputData = new InputData()

    inputData.addInput(jsonInput)

    const result = await quicktype({
      inputData,

      lang,

      rendererOptions: {
        'just-types': 'true',
        ...currentTarget.value.defaultOptions,
        ...rendererOptions.value,
      },
    })

    if (id !== generationId)
      return

    output.value = result.lines.join('\n')

    error.value = ''
  }
  catch (err) {
    if (id !== generationId)
      return

    error.value = err instanceof Error
      ? err.message
      : String(err)

    output.value = ''
  }
}

watch(parseError, (val) => {
  error.value = val
})

watch(
  [
    inputJson,
    target,
    optionValues,
  ],
  () => {
    if (!parsedJson.value) {
      output.value = ''
      return
    }

    generateTypes()
  },

  {
    immediate: true,
    deep: true,
  },
)

function fillDemo() {
  inputJson.value = DEFAULT_JSON
}
</script>

<template>
  <div flex="~ col gap-4">
    <DevToolbar
      :preview-label="t('preview_production')"
      :exit-label="t('exit_preview')"
    >
      <BaseButton
        icon="i-carbon-data-structured"
        @click="fillDemo"
      >
        {{ t('fill_demo') }}
      </BaseButton>
    </DevToolbar>

    <Panel :title="t('input_title')">
      <div flex="~ col gap-4" p-5>
        <CodeEditor
          v-model="inputJson"
          language="json"
          :langs="['json']"
          :rows="15"
          placeholder="Paste JSON here..."
        />

        <AlertTip v-if="error" type="error">
          <span text-sm>{{ t('invalid_json') }}: {{ error }}</span>
        </AlertTip>

        <AlertTip v-else-if="!output" type="neutral">
          <span text-sm>{{ t('waiting') }}</span>
        </AlertTip>
      </div>
    </Panel>

    <Panel :title="t('output_title')">
      <div flex="~ col gap-4" p-5>
        <LabelField :label="t('target_language')">
          <SelectInput
            v-model="target"
            :options="TARGETS"
          />
        </LabelField>

        <div
          v-if="currentTarget.options?.length"
          flex="~ wrap gap-2"
        >
          <BaseButton
            v-for="option in currentTarget.options"
            :key="option.key"
            :active="optionValues[option.key]"
            @click="toggleOption(option.key)"
          >
            {{ t(option.labelKey) }}
          </BaseButton>
        </div>

        <CodeEditor
          :model-value="output"
          :language="outputLanguage"
          :langs="outputLangs"
          :rows="20"
          readonly
        />
      </div>
    </Panel>
  </div>
</template>
