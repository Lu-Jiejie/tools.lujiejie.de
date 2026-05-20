<script lang="ts">
import LabelField from '~/components/container/LabelField.vue'
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'cron-expression',
  name: 'Cron Expression',
  nameZh: 'Cron 表达式',
  description: 'Parse, generate, and preview cron expressions with next execution times.',
  descriptionZh: '解析、生成 Cron 表达式，预览接下来的执行时间。',
  category: 'dev',
  keywords: ['cron', 'schedule', 'timer', 'job', 'expression'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import cronstrue from 'cronstrue/i18n'
import { computed, reactive, watch } from 'vue'
import AlertTip from '~/components/AlertTip.vue'
import BaseButton from '~/components/BaseButton.vue'
import Panel from '~/components/container/Panel.vue'
import NumberInput from '~/components/NumberInput.vue'
import SelectInput from '~/components/SelectInput.vue'
import TextInput from '~/components/TextInput.vue'
import { useI18n } from '~/composables/useI18n'
import { useLocale } from '~/composables/useLocale'

const { locale } = useLocale()

const { t } = useI18n({
  expression: ['Expression', '表达式'],
  generator: ['Generator', '生成器'],
  next_runs: ['Next 10 Runs', '接下来 10 次执行'],
  placeholder: ['e.g. */5 * * * *', '例如 */5 * * * *'],
  minute: ['Minute', '分钟'],
  hour: ['Hour', '小时'],
  day: ['Day of Month', '日期'],
  month: ['Month', '月份'],
  weekday: ['Day of Week', '星期'],
  every: ['Every', '每'],
  specific: ['Specific', '指定'],
  range: ['Range', '范围'],
  step: ['Step', '间隔'],
  from: ['From', '从'],
  to: ['To', '到'],
  preset: ['Preset', '预设'],
  copy: ['Copy', '复制'],
})

const PRESET_PLACEHOLDER = '__none__'
const CRON_ALLOWED_CHARS = /[0-9*/,\-\s]/

const PRESETS = [
  { label: '--', value: PRESET_PLACEHOLDER },
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 2 hours', value: '0 */2 * * *' },
  { label: 'Every day at midnight', value: '0 0 * * *' },
  { label: 'Every day at noon', value: '0 12 * * *' },
  { label: 'Every Monday at 9:00', value: '0 9 * * 1' },
  { label: 'Weekdays at 9:00', value: '0 9 * * 1-5' },
  { label: 'Every month (1st)', value: '0 0 1 * *' },
  { label: 'Every year (Jan 1)', value: '0 0 1 1 *' },
]

const presetValue = computed(() => {
  return PRESETS.find(p => p.value === expression.value)?.value || PRESET_PLACEHOLDER
})

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type FieldMode = 'every' | 'specific' | 'range' | 'step'

interface FieldConfig {
  mode: FieldMode
  specific: number[]
  rangeFrom: number
  rangeTo: number
  stepValue: number
  stepFrom: number
}

function createFieldConfig(min: number, max: number): FieldConfig {
  return {
    mode: 'every',
    specific: [],
    rangeFrom: min,
    rangeTo: max,
    stepValue: 1,
    stepFrom: min,
  }
}

const fieldConfigs = reactive({
  minute: createFieldConfig(0, 59),
  hour: createFieldConfig(0, 23),
  day: createFieldConfig(1, 31),
  month: createFieldConfig(1, 12),
  weekday: createFieldConfig(0, 6),
})

const FIELD_RANGES: Record<string, { min: number, max: number }> = {
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  day: { min: 1, max: 31 },
  month: { min: 1, max: 12 },
  weekday: { min: 0, max: 6 },
}

const MODE_OPTIONS: { key: string, value: FieldMode }[] = [
  { key: 'every', value: 'every' },
  { key: 'specific', value: 'specific' },
  { key: 'range', value: 'range' },
  { key: 'step', value: 'step' },
]

function fieldToExpr(field: FieldConfig): string {
  switch (field.mode) {
    case 'every':
      return '*'
    case 'specific':
      return field.specific.length > 0 ? [...field.specific].sort((a, b) => a - b).join(',') : '*'
    case 'range':
      return `${field.rangeFrom}-${field.rangeTo}`
    case 'step':
      return field.stepFrom === 0 || field.stepFrom === 1
        ? `*/${field.stepValue}`
        : `${field.stepFrom}/${field.stepValue}`
  }
}

function exprToField(expr: string, min: number, max: number): FieldConfig {
  const config = createFieldConfig(min, max)
  if (expr === '*') {
    config.mode = 'every'
  }
  else if (expr.includes('/')) {
    config.mode = 'step'
    const [base, step] = expr.split('/')
    config.stepValue = Number.parseInt(step) || 1
    config.stepFrom = base === '*' ? min : (Number.parseInt(base) || min)
  }
  else if (expr.includes('-') && !expr.includes(',')) {
    config.mode = 'range'
    const [from, to] = expr.split('-').map(Number)
    config.rangeFrom = from
    config.rangeTo = to
  }
  else if (expr.includes(',') || /^\d+$/.test(expr)) {
    config.mode = 'specific'
    config.specific = expr.split(',').map(Number).filter(n => !Number.isNaN(n))
  }
  return config
}

const expression = computed(() => {
  return [
    fieldToExpr(fieldConfigs.minute),
    fieldToExpr(fieldConfigs.hour),
    fieldToExpr(fieldConfigs.day),
    fieldToExpr(fieldConfigs.month),
    fieldToExpr(fieldConfigs.weekday),
  ].join(' ')
})

const manualInput = reactive({ value: '', editing: false })

const previewExpression = computed(() => manualInput.editing ? manualInput.value.trim() : expression.value)

function onManualInput(value: string) {
  manualInput.value = value
  const expr = value.trim()
  if (parseCron(expr))
    applyExpression(expr)
}

function applyManualInput() {
  manualInput.editing = false
  if (!parseCron(manualInput.value.trim()))
    manualInput.value = expression.value
}

function applyExpression(expr: string) {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5)
    return
  const fields = ['minute', 'hour', 'day', 'month', 'weekday'] as const
  fields.forEach((field, i) => {
    const { min, max } = FIELD_RANGES[field]
    Object.assign(fieldConfigs[field], exprToField(parts[i], min, max))
  })
}

function applyPreset(value: string | undefined) {
  if (value === PRESET_PLACEHOLDER)
    return
  applyExpression(value as string)
}

function toggleSpecific(field: keyof typeof fieldConfigs, value: number) {
  const arr = fieldConfigs[field].specific
  const idx = arr.indexOf(value)
  if (idx >= 0)
    arr.splice(idx, 1)
  else
    arr.push(value)
}

function getSpecificValues(fieldName: string): { value: number, label: string }[] {
  const { min, max } = FIELD_RANGES[fieldName]
  const values: { value: number, label: string }[] = []
  for (let i = min; i <= max; i++) {
    let label = String(i)
    if (fieldName === 'weekday')
      label = WEEKDAY_NAMES[i]
    else if (fieldName === 'month')
      label = MONTH_NAMES[i - 1]
    values.push({ value: i, label })
  }
  return values
}

// --- Cron parsing & next runs ---

function parseField(field: string, min: number, max: number): number[] | null {
  const values = new Set<number>()
  for (const part of field.split(',')) {
    const stepMatch = part.match(/^(.+)\/(\d+)$/)
    let range: string
    let step = 1
    if (stepMatch) {
      range = stepMatch[1]
      step = Number.parseInt(stepMatch[2])
      if (step <= 0)
        return null
    }
    else {
      range = part
    }

    let start: number
    let end: number
    if (range === '*') {
      start = min
      end = max
    }
    else if (range.includes('-')) {
      const [a, b] = range.split('-').map(Number)
      if (Number.isNaN(a) || Number.isNaN(b))
        return null
      if (a < min || b > max || a > b)
        return null
      start = a
      end = b
    }
    else {
      const n = Number.parseInt(range)
      if (Number.isNaN(n) || n < min || n > max)
        return null
      if (stepMatch) {
        start = n
        end = max
      }
      else {
        values.add(n)
        continue
      }
    }

    for (let i = start; i <= end; i += step) {
      values.add(i)
    }
  }
  return values.size > 0 ? [...values].sort((a, b) => a - b) : null
}

function parseCron(expr: string) {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5)
    return null
  const minutes = parseField(parts[0], 0, 59)
  const hours = parseField(parts[1], 0, 23)
  const days = parseField(parts[2], 1, 31)
  const months = parseField(parts[3], 1, 12)
  const weekdays = parseField(parts[4], 0, 6)
  if (!minutes || !hours || !days || !months || !weekdays)
    return null
  return { minutes, hours, days, months, weekdays }
}

function getNextRuns(expr: string, count: number): Date[] {
  const parsed = parseCron(expr)
  if (!parsed)
    return []
  const { minutes, hours, days, months, weekdays } = parsed
  const results: Date[] = []
  const now = new Date()
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0)

  const maxIterations = 525600
  for (let i = 0; i < maxIterations && results.length < count; i++) {
    const m = cursor.getMonth() + 1
    const d = cursor.getDate()
    const w = cursor.getDay()
    const h = cursor.getHours()
    const min = cursor.getMinutes()

    if (months.includes(m) && days.includes(d) && weekdays.includes(w) && hours.includes(h) && minutes.includes(min)) {
      results.push(new Date(cursor))
    }
    cursor.setMinutes(cursor.getMinutes() + 1)
  }
  return results
}

const error = computed(() => {
  if (!previewExpression.value)
    return ''
  if (!parseCron(previewExpression.value))
    return 'Invalid cron expression'
  return ''
})

const nextRuns = computed(() => {
  if (error.value)
    return []
  return getNextRuns(expression.value, 10)
})

const humanDescription = computed(() => {
  if (error.value || !previewExpression.value)
    return ''
  try {
    return cronstrue.toString(previewExpression.value, {
      locale: locale.value === 'zh' ? 'zh_CN' : 'en',
      use24HourTimeFormat: true,
    })
  }
  catch {
    return ''
  }
})

function copyExpression() {
  navigator.clipboard.writeText(expression.value)
}

watch(expression, (val) => {
  if (!manualInput.editing)
    manualInput.value = val
})

manualInput.value = expression.value
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('expression')">
      <div p-5 flex="~ col gap-4">
        <div flex="~ gap-3 wrap" items-end>
          <LabelField :label="t('preset')">
            <SelectInput
              :model-value="presetValue"
              :options="PRESETS"
              @update:model-value="applyPreset"
            />
          </LabelField>
          <BaseButton icon="i-carbon-copy" @click="copyExpression">
            {{ t('copy') }}
          </BaseButton>
        </div>
        <div flex="~ gap-2" items-center>
          <TextInput
            :model-value="manualInput.value"
            :placeholder="t('placeholder')"
            :allowed-chars="CRON_ALLOWED_CHARS"
            :copyable="false"
            autocomplete="off"
            size="lg"
            align="center"
            tracking="widest"
            class="flex-1"
            @focus="manualInput.editing = true"
            @blur="applyManualInput"
            @enter="applyManualInput"
            @update:model-value="onManualInput"
          />
        </div>
        <div v-if="humanDescription && !error" text-sm text-center op-60>
          {{ humanDescription }}
        </div>
        <AlertTip v-if="error" type="error">
          <span text-sm>{{ error }}</span>
        </AlertTip>
      </div>
    </Panel>

    <Panel :title="t('generator')">
      <div p-5 flex="~ col gap-5">
        <div
          v-for="fieldName in (['minute', 'hour', 'day', 'month', 'weekday'] as const)" :key="fieldName"
          flex="~ col gap-2"
        >
          <div flex="~ gap-3" items-center>
            <span text-sm font-medium shrink-0 w-18>{{ t(fieldName) }}</span>
            <div flex="~ gap-1.5 wrap">
              <button
                v-for="mode in MODE_OPTIONS" :key="mode.value"
                type="button"
                btn-chip
                :class="fieldConfigs[fieldName].mode === mode.value ? 'btn-chip-active' : 'hover:border-c-border-strong'"
                @click="fieldConfigs[fieldName].mode = mode.value"
              >
                {{ t(mode.key) }}
              </button>
            </div>
          </div>

          <div v-if="fieldConfigs[fieldName].mode === 'specific'" flex="~ gap-1.5 wrap" pl-21>
            <button
              v-for="item in getSpecificValues(fieldName)" :key="item.value"
              type="button"
              btn-chip font-mono px-1.5 text-center min-w-8
              :class="fieldConfigs[fieldName].specific.includes(item.value) ? 'btn-chip-active' : 'hover:border-c-border-strong'"
              @click="toggleSpecific(fieldName, item.value)"
            >
              {{ item.label }}
            </button>
          </div>

          <div v-if="fieldConfigs[fieldName].mode === 'range'" flex="~ gap-2" pl-21 items-center>
            <span text-xs op-50>{{ t('from') }}</span>
            <NumberInput
              :model-value="fieldConfigs[fieldName].rangeFrom"
              :min="FIELD_RANGES[fieldName].min"
              :max="FIELD_RANGES[fieldName].max"
              size="sm"
              @update:model-value="fieldConfigs[fieldName].rangeFrom = $event"
            />
            <span text-xs op-50>{{ t('to') }}</span>
            <NumberInput
              :model-value="fieldConfigs[fieldName].rangeTo"
              :min="FIELD_RANGES[fieldName].min"
              :max="FIELD_RANGES[fieldName].max"
              size="sm"
              @update:model-value="fieldConfigs[fieldName].rangeTo = $event"
            />
          </div>

          <div v-if="fieldConfigs[fieldName].mode === 'step'" flex="~ gap-2" pl-21 items-center>
            <template v-if="locale === 'zh'">
              <span text-xs op-50>从</span>
              <NumberInput
                :model-value="fieldConfigs[fieldName].stepFrom"
                :min="FIELD_RANGES[fieldName].min"
                :max="FIELD_RANGES[fieldName].max"
                size="sm"
                @update:model-value="fieldConfigs[fieldName].stepFrom = $event"
              />
              <span text-xs op-50>开始，每</span>
              <NumberInput
                :model-value="fieldConfigs[fieldName].stepValue"
                :min="1"
                :max="FIELD_RANGES[fieldName].max"
                size="sm"
                @update:model-value="fieldConfigs[fieldName].stepValue = $event"
              />
            </template>
            <template v-else>
              <span text-xs op-50>{{ t('every') }}</span>
              <NumberInput
                :model-value="fieldConfigs[fieldName].stepValue"
                :min="1"
                :max="FIELD_RANGES[fieldName].max"
                size="sm"
                @update:model-value="fieldConfigs[fieldName].stepValue = $event"
              />
              <span text-xs op-50>{{ t('from') }}</span>
              <NumberInput
                :model-value="fieldConfigs[fieldName].stepFrom"
                :min="FIELD_RANGES[fieldName].min"
                :max="FIELD_RANGES[fieldName].max"
                size="sm"
                @update:model-value="fieldConfigs[fieldName].stepFrom = $event"
              />
            </template>
          </div>
        </div>
      </div>
    </Panel>

    <Panel v-if="nextRuns.length > 0" :title="t('next_runs')">
      <div p-5>
        <ul flex="~ col gap-2" m-0 p-0 list-none>
          <li
            v-for="(run, i) in nextRuns" :key="i"
            flex="~ gap-3" items-center
          >
            <span
              bg="c-accent/15"
              text-xs text-c-accent font-medium rounded-full flex shrink-0 h-6 w-6 items-center justify-center
            >
              {{ i + 1 }}
            </span>
            <span text-sm font-mono>{{ run.toLocaleString() }}</span>
          </li>
        </ul>
      </div>
    </Panel>
  </div>
</template>
