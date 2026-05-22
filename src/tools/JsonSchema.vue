<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'json-schema',
  name: 'JSON Schema',
  nameZh: 'JSON Schema',
  description: 'Edit, generate, and validate JSON Schema.',
  descriptionZh: '编辑、生成并验证 JSON Schema。',
  category: 'dev',
  keywords: ['json', 'schema', 'validate', 'validator', 'generate', 'tester'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import type { JsonSchemaNode } from '~/utils/jsonSchema'
import { computed, shallowRef } from 'vue'
import AlertTip from '~/components/AlertTip.vue'
import BaseButton from '~/components/BaseButton.vue'
import CodeEditor from '~/components/CodeEditor.vue'
import CollapsibleExplainer from '~/components/container/CollapsibleExplainer.vue'
import LabelField from '~/components/container/LabelField.vue'
import Panel from '~/components/container/Panel.vue'
import DevToolbar from '~/components/DevToolbar.vue'
import TextInput from '~/components/TextInput.vue'
import ToggleButton from '~/components/ToggleButton.vue'
import { useI18n } from '~/composables/useI18n'
import {
  generateJsonSchema,
  parseJsonDocument,
  validateJsonAgainstSchema,
} from '~/utils/jsonSchema'

const { t } = useI18n({
  schema_title: ['Schema', 'Schema'],
  generator_title: ['Schema Generator', 'Schema 生成器'],
  test_title: ['Schema Validation Test', 'Schema 验证测试'],
  schema_title_field: ['Schema Title', 'Schema 标题'],
  title_placeholder: ['Optional schema title', '可选 Schema 标题'],
  schema_tip: [
    'Edit or paste the JSON Schema here.',
    '在这里编辑或粘贴要测试的 JSON Schema。',
  ],
  generator_tip: [
    'Paste sample JSON here, and click "Generate Schema" to create a JSON Schema based on the sample. This will replace the Schema above.',
    '在这里粘贴样例 JSON，可以根据样例生成 Schema，点击生成后会替换上面的 Schema。',
  ],
  test_tip: [
    'Paste JSON data here to validate it against the current Schema automatically.',
    '在这里粘贴 JSON 数据，会自动使用当前 Schema 进行验证。',
  ],
  schema_placeholder: ['Paste or write JSON Schema here...', '在这里粘贴或编写 JSON Schema...'],
  sample_placeholder: ['Paste JSON data to infer a schema...', '粘贴 JSON 数据来推断 Schema...'],
  test_placeholder: ['Paste JSON data to validate against the schema...', '粘贴需要用 Schema 验证的 JSON 数据...'],
  generate: ['Generate Schema', '生成 Schema'],
  fill_demo: ['Fill Demo', '填充示例'],
  preview_production: ['Preview Production', '预览上线模式'],
  exit_preview: ['Exit Production Preview', '退出上线预览'],
  include_examples: ['Examples', '示例值'],
  strict_object: ['Strict Objects', '严格对象'],
  invalid: ['Invalid', '验证失败'],
  waiting: ['Enter a schema and test JSON to validate automatically.', '输入 Schema 和测试 JSON 后会自动验证。'],
  schema_waiting: ['Enter a schema first.', '请先输入 Schema。'],
  test_waiting: ['Enter test JSON to validate.', '请输入需要验证的 JSON。'],
  validation_success: ['Test JSON matches the schema.', '测试 JSON 符合 Schema。'],
  validation_blocked_schema: ['Schema is invalid', 'Schema 无效'],
  parse_error: ['JSON Parse Error', 'JSON 解析错误'],
  schema_error: ['Schema Parse Error', 'Schema 解析错误'],
  issue_count: [
    (count: string) => `${count} issue(s)`,
    (count: string) => `${count} 个问题`,
  ],
  how_it_works: ['How It Works', '工作原理'],
  how_1_title: ['Validate JSON', '验证 JSON'],
  how_1_desc: [
    'The schema in the first editor is used to check the JSON in the validation section.',
    '第一个编辑器里的 Schema，会用来检查验证区里的 JSON。',
  ],
  how_2_title: ['Generate schema', '生成 Schema'],
  how_2_desc: [
    'The generator looks at the sample JSON and writes a basic schema from its fields, types, arrays, and objects.',
    '生成器会读取样例 JSON，再按字段、类型、数组和对象写出一份基础 Schema。',
  ],
  how_3_title: ['Review schema', '检查 Schema'],
  how_3_desc: [
    'A sample cannot tell the tool every rule. Add limits, formats, enum values, or conditional rules yourself when you need them.',
    '单个样例不能说明所有规则。长度限制、格式、枚举值、条件规则这些，通常需要你自己补。',
  ],
  how_4_title: ['Strict objects', '严格对象'],
  how_4_desc: [
    'When Strict Objects is on, generated object schemas reject extra keys that were not in the sample.',
    '打开“严格对象”后，生成出来的对象 Schema 会拒绝样例里没有出现过的字段。',
  ],
})

const DEFAULT_SAMPLE = `{
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

const sampleJson = shallowRef('')
const testJson = shallowRef('')
const schemaText = shallowRef('')
const schemaTitle = shallowRef('')
const includeExamples = shallowRef(true)
const strictObjects = shallowRef(true)

const sampleState = computed(() => parseJsonDocument(sampleJson.value))
const testState = computed(() => parseJsonDocument(testJson.value))
const schemaState = computed(() => parseSchema(schemaText.value))
const validationState = computed(() => {
  if (!schemaText.value.trim() || !testJson.value.trim())
    return { ready: false, valid: false, issues: [] }
  if (schemaState.value.error || testState.value.error || !schemaState.value.schema || testState.value.data === undefined)
    return { ready: false, valid: false, issues: [] }
  return { ready: true, ...validateJsonAgainstSchema(schemaState.value.schema, testState.value.data) }
})

const issueText = computed(() => t('issue_count', String(validationState.value.issues.length)))
const explainItems = computed(() => [
  { title: t('how_1_title'), description: t('how_1_desc') },
  { title: t('how_2_title'), description: t('how_2_desc') },
  { title: t('how_3_title'), description: t('how_3_desc') },
  { title: t('how_4_title'), description: t('how_4_desc') },
])
const validationTip = computed<{ type: 'info' | 'success' | 'error', message: string }>(() => {
  if (schemaState.value.error)
    return { type: 'error', message: `${t('validation_blocked_schema')}: ${schemaState.value.error}` }
  if (testState.value.error)
    return { type: 'error', message: `${t('parse_error')}: ${testState.value.error}` }
  if (!schemaText.value.trim() && !testJson.value.trim())
    return { type: 'info', message: t('waiting') }
  if (!schemaText.value.trim())
    return { type: 'info', message: t('schema_waiting') }
  if (!testJson.value.trim())
    return { type: 'info', message: t('test_waiting') }
  if (validationState.value.valid)
    return { type: 'success', message: t('validation_success') }
  return { type: 'error', message: `${t('invalid')} · ${issueText.value}` }
})

function parseSchema(text: string): { schema?: JsonSchemaNode, error: string } {
  const parsed = parseJsonDocument(text)
  if (parsed.error)
    return { error: parsed.error }
  if (parsed.data === undefined)
    return { error: '' }
  if (!parsed.data || typeof parsed.data !== 'object' || Array.isArray(parsed.data))
    return { error: 'Schema must be a JSON object.' }
  return { schema: parsed.data as JsonSchemaNode, error: '' }
}

function createSchema() {
  if (sampleState.value.data === undefined)
    return

  const schema = generateJsonSchema(sampleState.value.data, {
    title: schemaTitle.value.trim() || undefined,
    includeExamples: includeExamples.value,
    additionalProperties: !strictObjects.value,
  })
  schemaText.value = JSON.stringify(schema, null, 2)
}

function fillDemo() {
  schemaTitle.value = 'User'
  sampleJson.value = DEFAULT_SAMPLE
  testJson.value = DEFAULT_SAMPLE
  createSchema()
}
</script>

<template>
  <div flex="~ col gap-4">
    <DevToolbar
      :preview-label="t('preview_production')"
      :exit-label="t('exit_preview')"
    >
      <BaseButton icon="i-carbon-test-tool" @click="fillDemo">
        {{ t('fill_demo') }}
      </BaseButton>
    </DevToolbar>

    <Panel :title="t('schema_title')">
      <div p-5 flex="~ col gap-4">
        <AlertTip type="neutral">
          <span text-sm>{{ t('schema_tip') }}</span>
        </AlertTip>

        <CodeEditor
          v-model="schemaText"
          language="json"
          :placeholder="t('schema_placeholder')"

          :rows="16"
          :langs="['json']"
        />

        <AlertTip v-if="schemaState.error" type="error">
          <span text-sm>{{ t('schema_error') }}: {{ schemaState.error }}</span>
        </AlertTip>
      </div>
    </Panel>

    <Panel :title="t('generator_title')">
      <div p-5 flex="~ col gap-4">
        <AlertTip type="neutral">
          <span text-sm>{{ t('generator_tip') }}</span>
        </AlertTip>

        <div flex="~ gap-3 wrap" items-end>
          <LabelField :label="t('schema_title_field')">
            <TextInput v-model="schemaTitle" :placeholder="t('title_placeholder')" />
          </LabelField>
          <ToggleButton v-model="includeExamples" icon="i-carbon-list-boxes" active-icon="i-carbon-list-boxes">
            {{ t('include_examples') }}
          </ToggleButton>
          <ToggleButton v-model="strictObjects" icon="i-carbon-locked" active-icon="i-carbon-locked">
            {{ t('strict_object') }}
          </ToggleButton>
          <BaseButton icon="i-carbon-data-structured" :disabled="!!sampleState.error || sampleState.data === undefined" @click="createSchema">
            {{ t('generate') }}
          </BaseButton>
        </div>

        <CodeEditor
          v-model="sampleJson"
          language="json"
          :placeholder="t('sample_placeholder')"
          :rows="14"
          :langs="['json']"
        />

        <AlertTip v-if="sampleState.error" type="error">
          <span text-sm>{{ t('parse_error') }}: {{ sampleState.error }}</span>
        </AlertTip>
      </div>
    </Panel>

    <Panel :title="t('test_title')">
      <div p-5 flex="~ col gap-4">
        <AlertTip type="neutral">
          <span text-sm>{{ t('test_tip') }}</span>
        </AlertTip>

        <CodeEditor
          v-model="testJson"
          language="json"
          :placeholder="t('test_placeholder')"
          :rows="14"
          :langs="['json']"
        />

        <AlertTip :type="validationTip.type">
          <span text-sm>{{ validationTip.message }}</span>
        </AlertTip>

        <div v-if="validationState.ready && !validationState.valid" flex="~ col gap-2">
          <div
            v-for="issue in validationState.issues"
            :key="`${issue.path}:${issue.message}`"
            border="~ c-border" text-sm p-3 rounded-lg bg-c-raised
          >
            <span text-red-500 font-mono>{{ issue.path }}</span>
            <span op-70> {{ issue.message }}</span>
          </div>
        </div>
      </div>
    </Panel>

    <CollapsibleExplainer
      :title="t('how_it_works')"
      :items="explainItems"
    />
  </div>
</template>
