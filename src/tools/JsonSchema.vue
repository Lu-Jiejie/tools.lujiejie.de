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
import LabelField from '~/components/container/LabelField.vue'
import Panel from '~/components/container/Panel.vue'
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
  sample_placeholder: ['Paste JSON data to infer a schema...', '粘贴 JSON 数据来推断 Schema...'],
  test_placeholder: ['Paste JSON data to validate against the schema...', '粘贴需要用 Schema 验证的 JSON 数据...'],
  generate: ['Generate Schema', '生成 Schema'],
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

const sampleJson = shallowRef(DEFAULT_SAMPLE)
const testJson = shallowRef(DEFAULT_SAMPLE)
const schemaText = shallowRef('')
const schemaTitle = shallowRef('User')
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

createSchema()

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
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('schema_title')">
      <div p-5 flex="~ col gap-4">
        <AlertTip type="neutral">
          <span text-sm>{{ t('schema_tip') }}</span>
        </AlertTip>

        <CodeEditor
          v-model="schemaText"
          language="json"
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
  </div>
</template>
