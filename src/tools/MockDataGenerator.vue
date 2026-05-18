<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'mock-data-generator',
  name: 'Mock Data Generator',
  nameZh: 'Mock 数据生成',
  description: 'Parse data models (SQL, Java, JSON, TS, etc.) and generate mock data.',
  descriptionZh: '解析数据模型（SQL、Java、JSON、TS 等）生成 Mock 数据。',
  category: 'generate',
  keywords: ['mock', 'fake', 'data', 'generate', 'sql', 'json', 'java', 'typescript'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue'
import BaseButton from '~/components/BaseButton.vue'
import CodeEditor from '~/components/CodeEditor.vue'
import NumberInput from '~/components/NumberInput.vue'
import Panel from '~/components/Panel.vue'
import SelectInput from '~/components/SelectInput.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  model_title: ['Data Model', '数据模型'],
  field_title: ['Field Configuration', '字段配置'],
  output_title: ['Generated Data', '生成数据'],
  language: ['Language', '语言'],
  placeholder: ['Paste your data model here...', '在此粘贴数据模型代码...'],
  parse: ['Parse Fields', '解析字段'],
  generate: ['Generate', '生成'],
  copy: ['Copy', '复制'],
  copied: ['Copied', '已复制'],
  count: ['Count', '数量'],
  field_name: ['Field Name', '字段名'],
  mock_type: ['Mock Type', 'Mock 类型'],
  options: ['Options', '选项'],
  actions: ['Actions', '操作'],
  add_field: ['Add Field', '添加字段'],
  no_fields: ['No fields yet. Parse a model or add fields manually.', '暂无字段，请解析模型或手动添加。'],
  parse_error: ['Failed to parse model. Please check the syntax.', '解析失败，请检查语法。'],
  parse_success: [
    (n: string) => `Parsed ${n} fields successfully.`,
    (n: string) => `成功解析 ${n} 个字段。`,
  ],
})

const LANG_OPTIONS = [
  { label: 'JSON', value: 'json' },
  { label: 'SQL', value: 'sql' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Java', value: 'java' },
  { label: 'XML', value: 'xml' },
  { label: 'Go', value: 'go' },
]

type MockType
  = | 'string' | 'number' | 'boolean' | 'date'
    | 'name' | 'email' | 'phone' | 'url' | 'uuid'
    | 'address' | 'ip' | 'integer' | 'float'
    | 'enum' | 'paragraph' | 'image'

const MOCK_TYPE_OPTIONS: { label: string, value: MockType }[] = [
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Integer', value: 'integer' },
  { label: 'Float', value: 'float' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Date', value: 'date' },
  { label: 'Name', value: 'name' },
  { label: 'Email', value: 'email' },
  { label: 'Phone', value: 'phone' },
  { label: 'URL', value: 'url' },
  { label: 'UUID', value: 'uuid' },
  { label: 'IP', value: 'ip' },
  { label: 'Address', value: 'address' },
  { label: 'Paragraph', value: 'paragraph' },
  { label: 'Image URL', value: 'image' },
  { label: 'Enum', value: 'enum' },
]

interface FieldConfig {
  id: number
  name: string
  mockType: MockType
  options: string
}

const DEFAULT_EXAMPLES: Record<string, string> = {
  json: `{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "13800138000",
  "age": 28,
  "avatar": "https://example.com/avatar.png",
  "address": "123 Main St",
  "createdAt": "2024-01-01",
  "isActive": true,
  "score": 95.5
}`,
  sql: `CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  age INT,
  avatar VARCHAR(500),
  address TEXT,
  created_at TIMESTAMP,
  is_active BOOLEAN,
  score DECIMAL(5,2)
);`,
  typescript: `interface User {
  id: number
  name: string
  email: string
  phone: string
  age: number
  avatar: string
  address: string
  createdAt: string
  isActive: boolean
  score: number
}`,
  javascript: `const user = {
  id: Number,
  name: String,
  email: String,
  phone: String,
  age: Number,
  avatar: String,
  address: String,
  createdAt: String,
  isActive: Boolean,
  score: Number
}`,
  java: `public class User {
  private Long id;
  private String name;
  private String email;
  private String phone;
  private Integer age;
  private String avatar;
  private String address;
  private Date createdAt;
  private Boolean isActive;
  private Double score;
}`,
  xml: `<user>
  <id>1</id>
  <name>John Doe</name>
  <email>john@example.com</email>
  <phone>13800138000</phone>
  <age>28</age>
  <avatar>https://example.com/avatar.png</avatar>
  <address>123 Main St</address>
  <createdAt>2024-01-01</createdAt>
  <isActive>true</isActive>
  <score>95.5</score>
</user>`,
  go: `type User struct {
  ID        int
  Name      string
  Email     string
  Phone     string
  Age       int
  Avatar    string
  Address   string
  CreatedAt string
  IsActive  bool
  Score     float64
}`,
}

const language = shallowRef('json')
const inputCode = shallowRef(DEFAULT_EXAMPLES.json)
const fields = ref<FieldConfig[]>([])
const generateCount = shallowRef(10)
const outputJson = shallowRef('')
const copied = shallowRef(false)
const parseMessage = shallowRef('')
const parseMessageType = shallowRef<'success' | 'error'>('success')

// --- Drag state ---
const dragState = ref<'idle' | 'pressing' | 'dragging'>('idle')
const dragFromIndex = ref(-1)
const dragOverIndex = ref(-1)
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let pointerStartY = 0
let pointerStartX = 0

const LONG_PRESS_MS = 300

function clearLongPressTimer() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function bindDocumentListeners() {
  document.addEventListener('pointermove', onDocumentPointerMove)
  document.addEventListener('pointerup', onDocumentPointerUp)
  document.addEventListener('pointercancel', onDocumentPointerCancel)
}

function unbindDocumentListeners() {
  document.removeEventListener('pointermove', onDocumentPointerMove)
  document.removeEventListener('pointerup', onDocumentPointerUp)
  document.removeEventListener('pointercancel', onDocumentPointerCancel)
}

function resetDragState() {
  clearLongPressTimer()
  unbindDocumentListeners()
  dragState.value = 'idle'
  dragFromIndex.value = -1
  dragOverIndex.value = -1
}

function onDragHandleDown(e: PointerEvent, index: number) {
  if (dragState.value !== 'idle')
    return
  pointerStartX = e.clientX
  pointerStartY = e.clientY
  dragFromIndex.value = index
  dragOverIndex.value = index
  dragState.value = 'pressing'

  longPressTimer = setTimeout(() => {
    dragState.value = 'dragging'
    bindDocumentListeners()
  }, LONG_PRESS_MS)
}

function onDragHandleMove(e: PointerEvent) {
  // Cancel long press if moved too much before drag activates
  if (dragState.value === 'pressing') {
    if (Math.abs(e.clientX - pointerStartX) > 8 || Math.abs(e.clientY - pointerStartY) > 8) {
      resetDragState()
    }
  }
}

function onDragHandleUp() {
  if (dragState.value === 'pressing') {
    resetDragState()
  }
}

function onDocumentPointerMove(e: PointerEvent) {
  if (dragState.value !== 'dragging')
    return

  const rowElements = Array.from(document.querySelectorAll('[data-field-index]'))
  let targetIndex = -1

  if (rowElements.length > 0) {
    const firstRect = rowElements[0].getBoundingClientRect()
    if (e.clientY < firstRect.top) {
      targetIndex = 0
    }
    else {
      const lastRect = rowElements[rowElements.length - 1].getBoundingClientRect()
      if (e.clientY > lastRect.bottom) {
        targetIndex = rowElements.length
      }
      else {
        for (const row of rowElements) {
          const rect = row.getBoundingClientRect()
          if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
            const idx = Number((row as HTMLElement).dataset.fieldIndex)
            const midY = rect.top + rect.height / 2
            targetIndex = e.clientY < midY ? idx : idx + 1
            break
          }
        }
      }
    }
  }

  if (targetIndex === -1)
    return

  if (targetIndex !== dragOverIndex.value) {
    const from = dragFromIndex.value
    // Adjust target: when moving down, the array hasn't shifted yet, so subtract 1
    const to = targetIndex > from ? targetIndex - 1 : targetIndex
    moveField(from, to)
    dragFromIndex.value = to
    dragOverIndex.value = targetIndex
  }
}

function onDocumentPointerUp() {
  resetDragState()
}

function onDocumentPointerCancel() {
  resetDragState()
}

let fieldIdCounter = 0

watch(language, (lang) => {
  inputCode.value = DEFAULT_EXAMPLES[lang] || ''
  fields.value = []
  parseMessage.value = ''
  outputJson.value = ''
})

function inferMockType(name: string, typeHint?: string): MockType {
  const n = name.toLowerCase()
  const th = (typeHint || '').toLowerCase()

  if (n.includes('email') || n.includes('mail'))
    return 'email'
  if (n.includes('phone') || n.includes('mobile') || n.includes('tel'))
    return 'phone'
  if (n.includes('url') || n.includes('link') || n.includes('href') || n.includes('website'))
    return 'url'
  if (n.includes('avatar') || n.includes('image') || n.includes('img') || n.includes('photo') || n.includes('pic'))
    return 'image'
  if (n.includes('name') || n.includes('username') || n.includes('nickname'))
    return 'name'
  if (n.includes('address') || n.includes('addr') || n.includes('street') || n.includes('city'))
    return 'address'
  if (n.includes('ip'))
    return 'ip'
  if (n.includes('id') || n.includes('uuid') || n.includes('guid'))
    return 'uuid'
  if (n.includes('date') || n.includes('time') || n.includes('created') || n.includes('updated'))
    return 'date'
  if (n.includes('age') || n.includes('count') || n.includes('num') || n.includes('amount') || n.includes('price') || n.includes('total'))
    return 'number'
  if (n.includes('desc') || n.includes('content') || n.includes('bio') || n.includes('summary') || n.includes('text') || n.includes('remark'))
    return 'paragraph'

  if (th.includes('bool'))
    return 'boolean'
  if (th.includes('int') || th.includes('long') || th.includes('short'))
    return 'integer'
  if (th.includes('float') || th.includes('double') || th.includes('decimal') || th.includes('number'))
    return 'float'
  if (th.includes('date') || th.includes('time') || th.includes('timestamp'))
    return 'date'

  return 'string'
}

function parseJSON(code: string): FieldConfig[] {
  const obj = JSON.parse(code)
  const target = Array.isArray(obj) ? obj[0] : obj
  if (!target || typeof target !== 'object')
    return []
  return Object.entries(target).map(([key, val]) => {
    let mockType: MockType = 'string'
    if (typeof val === 'number')
      mockType = Number.isInteger(val) ? 'integer' : 'float'
    else if (typeof val === 'boolean')
      mockType = 'boolean'
    else
      mockType = inferMockType(key)
    return { id: ++fieldIdCounter, name: key, mockType, options: '' }
  })
}

function parseSQL(code: string): FieldConfig[] {
  const results: FieldConfig[] = []
  const createMatch = code.match(/CREATE\s+TABLE[^(]*\(([\s\S]*)\)/i)
  if (!createMatch)
    return []
  const body = createMatch[1]
  const lines = body.split(',').map(l => l.trim()).filter(l => l && !l.match(/^\s*(PRIMARY|KEY|INDEX|UNIQUE|CONSTRAINT|FOREIGN)/i))
  for (const line of lines) {
    const m = line.match(/^[`"']?(\w+)[`"']?\s+([\w()]+)/)
    if (m) {
      const name = m[1]
      const type = m[2]
      results.push({ id: ++fieldIdCounter, name, mockType: inferMockType(name, type), options: '' })
    }
  }
  return results
}

function parseTypeScript(code: string): FieldConfig[] {
  const results: FieldConfig[] = []
  const propRegex = /(\w+)\s*(?:\?\s*)?:\s*([^;\n,}]+)/g
  let m: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((m = propRegex.exec(code)) !== null) {
    const name = m[1]
    const type = m[2].trim()
    results.push({ id: ++fieldIdCounter, name, mockType: inferMockType(name, type), options: '' })
  }
  return results
}

function parseJava(code: string): FieldConfig[] {
  const results: FieldConfig[] = []
  const fieldRegex = /(?:private|public|protected)\s+(\w+(?:<[^>]+>)?)\s+(\w+)\s*[;=]/g
  let m: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((m = fieldRegex.exec(code)) !== null) {
    const type = m[1]
    const name = m[2]
    results.push({ id: ++fieldIdCounter, name, mockType: inferMockType(name, type), options: '' })
  }
  return results
}

function parseXML(code: string): FieldConfig[] {
  const results: FieldConfig[] = []
  const seen = new Set<string>()
  // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/optimal-quantifier-concatenation, regexp/no-unused-capturing-group
  const tagRegex = /<(\w+)[^/]*>([^<]*)<\/\1>/g
  let m: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((m = tagRegex.exec(code)) !== null) {
    const name = m[1]
    if (!seen.has(name)) {
      seen.add(name)
      results.push({ id: ++fieldIdCounter, name, mockType: inferMockType(name), options: '' })
    }
  }
  return results
}

function parseGo(code: string): FieldConfig[] {
  const results: FieldConfig[] = []
  const fieldRegex = /^\s*(\w+)\s+([\w.*[\]]+)/gm
  const structMatch = code.match(/struct\s*\{([\s\S]*?)\}/i)
  if (!structMatch)
    return []
  const body = structMatch[1]
  let m: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((m = fieldRegex.exec(body)) !== null) {
    const name = m[1]
    const type = m[2]
    results.push({ id: ++fieldIdCounter, name, mockType: inferMockType(name, type), options: '' })
  }
  return results
}

function parseModel() {
  const code = inputCode.value.trim()
  if (!code) {
    parseMessage.value = ''
    return
  }
  try {
    let parsed: FieldConfig[] = []
    switch (language.value) {
      case 'json':
        parsed = parseJSON(code)
        break
      case 'sql':
        parsed = parseSQL(code)
        break
      case 'typescript':
      case 'javascript':
        parsed = parseTypeScript(code)
        break
      case 'java':
        parsed = parseJava(code)
        break
      case 'xml':
        parsed = parseXML(code)
        break
      case 'go':
        parsed = parseGo(code)
        break
    }
    if (parsed.length === 0)
      throw new Error('no fields')
    fields.value = parsed
    parseMessage.value = t('parse_success', String(parsed.length))
    parseMessageType.value = 'success'
  }
  catch {
    parseMessage.value = t('parse_error')
    parseMessageType.value = 'error'
  }
}

function addField() {
  fields.value.push({ id: ++fieldIdCounter, name: '', mockType: 'string', options: '' })
}

function removeField(index: number) {
  fields.value.splice(index, 1)
}

function moveField(from: number, to: number) {
  if (to < 0 || to >= fields.value.length)
    return
  const item = fields.value.splice(from, 1)[0]
  fields.value.splice(to, 0, item)
}

// --- Mock data generators ---
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randFloat(min: number, max: number, decimals = 2) {
  return Number.parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function randPick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)]
}

function randString(len = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: len }, () => chars[randInt(0, chars.length - 1)]).join('')
}

const FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', '张伟', '王芳', '李娜', '刘洋', '陈静', '杨磊', '赵敏', '黄勇', '周杰', '吴秀英']
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', '张', '王', '李', '刘', '陈', '杨', '赵', '黄', '周', '吴']
const DOMAINS = ['gmail.com', 'outlook.com', 'yahoo.com', 'example.com', 'test.org', 'company.io']
const STREETS = ['Main St', 'Oak Ave', 'Pine Rd', 'Maple Dr', 'Cedar Ln', 'Elm Blvd', '中山路', '人民路', '解放大道', '建设路']
const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', '北京', '上海', '广州', '深圳', '杭州', '成都']
const LOREM_WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua']

function generateValue(mockType: MockType, options: string): unknown {
  switch (mockType) {
    case 'string':
      return randString(randInt(5, 12))
    case 'number':
    case 'integer':
      return randInt(1, 10000)
    case 'float':
      return randFloat(0, 1000)
    case 'boolean':
      return Math.random() > 0.5
    case 'date':
      return new Date(Date.now() - randInt(0, 365 * 24 * 60 * 60 * 1000 * 3)).toISOString().slice(0, 10)
    case 'name':
      return `${randPick(FIRST_NAMES)} ${randPick(LAST_NAMES)}`
    case 'email':
      return `${randString(6)}@${randPick(DOMAINS)}`
    case 'phone':
      return `1${randInt(30, 99)}${String(randInt(10000000, 99999999))}`
    case 'url':
      return `https://${randString(6)}.${randPick(['com', 'org', 'io', 'net'])}/${randString(4)}`
    case 'uuid':
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = randInt(0, 15)
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    case 'ip':
      return `${randInt(1, 255)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`
    case 'address':
      return `${randInt(1, 9999)} ${randPick(STREETS)}, ${randPick(CITIES)}`
    case 'paragraph':
      return Array.from({ length: randInt(8, 20) }, () => randPick(LOREM_WORDS)).join(' ')
    case 'image':
      return `https://picsum.photos/seed/${randString(6)}/200/200`
    case 'enum': {
      const items = options.split(',').map(s => s.trim()).filter(Boolean)
      return items.length > 0 ? randPick(items) : randString(4)
    }
    default:
      return randString(8)
  }
}

function generateData() {
  if (fields.value.length === 0)
    return
  const result = Array.from({ length: generateCount.value }, () => {
    const obj: Record<string, unknown> = {}
    for (const field of fields.value) {
      if (field.name.trim())
        obj[field.name.trim()] = generateValue(field.mockType, field.options)
    }
    return obj
  })
  outputJson.value = JSON.stringify(result, null, 2)
}

async function copyOutput() {
  if (!outputJson.value)
    return
  await navigator.clipboard.writeText(outputJson.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <div flex="~ col gap-4">
    <!-- Module 1: Data Model -->
    <Panel :title="t('model_title')">
      <div p-5 flex="~ col gap-4">
        <div flex="~ gap-3 wrap" items-center>
          <div flex="~ gap-2" items-center>
            <span text-xs tracking-wide font-medium op-60 select-none uppercase>{{ t('language') }}</span>
            <SelectInput v-model="language" :options="LANG_OPTIONS" />
          </div>
          <BaseButton icon="i-carbon-data-structured" @click="parseModel">
            {{ t('parse') }}
          </BaseButton>
        </div>
        <CodeEditor v-model="inputCode" :language="language" :placeholder="t('placeholder')" :rows="20" />
        <div v-if="parseMessage" flex="~ gap-1.5" px-3 py-2 border rounded-lg select-none items-center :class="parseMessageType === 'success' ? 'text-green-500 bg-green-400/10 border-green-400' : 'text-red-400 bg-red-400/10 border-red-400'">
          <div shrink-0 :class="parseMessageType === 'success' ? 'i-carbon-checkmark-filled' : 'i-carbon-close-filled'" />
          <span text-sm>{{ parseMessage }}</span>
        </div>
      </div>
    </Panel>

    <!-- Module 2: Field Configuration -->
    <Panel :title="t('field_title')">
      <div p-5 flex="~ col gap-3">
        <div v-if="fields.length === 0" text-sm py-6 text-center op-50>
          {{ t('no_fields') }}
        </div>
        <template v-else>
          <!-- Header -->
          <div grid="~ cols-[2fr_1fr_1.5fr_auto]" text-xs tracking-wide font-medium px-1 op-50 gap-2 select-none uppercase>
            <span>{{ t('field_name') }}</span>
            <span>{{ t('mock_type') }}</span>
            <span>{{ t('options') }}</span>
            <span text-center w-20>{{ t('actions') }}</span>
          </div>
          <!-- Rows -->
          <div
            v-for="(field, index) in fields"
            :key="field.id"
            grid="~ cols-[2fr_1fr_1.5fr_auto]"
            border="~ c-border"
            :data-field-index="index"
            px-2 py-1.5 rounded-lg bg-c-raised gap-2 transition-all duration-150 items-center
            :class="{
              'op-50 scale-98 z-10': dragState === 'dragging' && dragFromIndex === index,
            }"
          >
            <input
              v-model="field.name"
              type="text"
              border="~ c-border focus:c-border-strong" text-sm font-mono px-2 py-1 outline-none rounded-lg bg-c-input w-full transition-colors
            >
            <select
              v-model="field.mockType"

              border="~ c-border" text-sm px-2 py-1 select-base outline-none rounded-lg bg-c-input cursor-pointer transition-colors
              :style="{ backgroundImage: `url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22%3E%3Cpath fill=%22%23aaa%22 d=%22M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z%22/%3E%3C/svg%3E')`, backgroundPosition: 'right 6px center', backgroundSize: '16px', paddingRight: '1.5rem' }"
            >
              <option v-for="opt in MOCK_TYPE_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <input
              v-model="field.options"
              type="text"
              :placeholder="field.mockType === 'enum' ? 'a,b,c' : ''"
              :disabled="field.mockType !== 'enum'"
              border="~ c-border focus:c-border-strong" text-sm px-2 py-1 outline-none rounded-lg bg-c-input w-full transition-colors
              :class="{ 'op-30 cursor-not-allowed': field.mockType !== 'enum' }"
            >
            <div flex="~ gap-1" w-20 justify-center>
              <button
                p-1
                op-40 transition-opacity hover:op-100
                :class="{ 'op-100 text-brand cursor-grabbing': dragState === 'dragging' && dragFromIndex === index, 'cursor-grab': dragState !== 'dragging' || dragFromIndex !== index }"
                @pointerdown="onDragHandleDown($event, index)"
                @pointermove="onDragHandleMove"
                @pointerup="onDragHandleUp"
                @pointercancel="resetDragState"
                @lostpointercapture="resetDragState"
              >
                <div i-carbon-draggable text-sm />
              </button>
              <button
                text-red-400 p-1 op-40 transition-opacity hover:op-100
                @click="removeField(index)"
              >
                <div i-carbon-delete text-sm />
              </button>
            </div>
          </div>
        </template>
        <BaseButton icon="i-carbon-add" @click="addField">
          {{ t('add_field') }}
        </BaseButton>
      </div>
    </Panel>

    <!-- Module 3: Generate Data -->
    <Panel :title="t('output_title')">
      <div p-5 flex="~ col gap-4">
        <div flex="~ gap-3 wrap" items-center>
          <div flex="~ gap-2" items-center>
            <span text-xs tracking-wide font-medium op-60 select-none uppercase>{{ t('count') }}</span>
            <NumberInput v-model="generateCount" :min="1" :max="1000" />
          </div>
          <BaseButton icon="i-carbon-play" :disabled="fields.length === 0" @click="generateData">
            {{ t('generate') }}
          </BaseButton>
          <BaseButton icon="i-carbon-copy" :disabled="!outputJson" @click="copyOutput">
            {{ copied ? t('copied') : t('copy') }}
          </BaseButton>
        </div>
        <CodeEditor
          v-if="outputJson"
          :model-value="outputJson"
          language="json"
          :rows="20"
          readonly
        />
      </div>
    </Panel>
  </div>
</template>
