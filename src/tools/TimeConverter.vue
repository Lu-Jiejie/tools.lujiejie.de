<script lang="ts">
import LabelField from '~/components/container/LabelField.vue'
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'time-converter',
  name: 'Time Converter',
  nameZh: '时间转换',
  description: 'Convert time between Unix timestamp, ISO 8601, UTC, local, and relative formats.',
  descriptionZh: '在 Unix 时间戳、ISO 8601、UTC、本地时间等多种格式之间互相转换。',
  category: 'convert',
  keywords: ['timestamp', 'unix', 'date', 'time', 'epoch', 'iso', 'utc', 'convert'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { computed, onUnmounted, shallowRef, watch } from 'vue'
import AlertTip from '~/components/AlertTip.vue'
import BaseButton from '~/components/BaseButton.vue'
import Panel from '~/components/container/Panel.vue'
import CustomSelect from '~/components/CustomSelect.vue'
import TextInput from '~/components/TextInput.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  unix_s: ['Unix (seconds)', 'Unix 秒'],
  unix_s_short: ['Unix (s)', 'Unix (s)'],
  unix_ms: ['Unix (milliseconds)', 'Unix 毫秒'],
  unix_ms_short: ['Unix (ms)', 'Unix (ms)'],
  iso: ['ISO 8601', 'ISO 8601'],
  local: ['Local time', '本地时间'],
  local_short: ['Local', '本地时间'],
  utc: ['UTC string', 'UTC 字符串'],
  locale: ['Locale time', '本地化时间'],
  locale_short: ['Locale', '本地化时间'],
  relative: ['Relative', '相对时间'],
  now: ['Now', '当前时间'],
  live: ['Live', '实时更新'],
  invalid: ['Invalid date', '无效时间'],
  input_label: ['Input', '输入'],
  output_label: ['Output', '输出'],
})

type FormatKey = 'unix_s' | 'unix_ms' | 'iso' | 'local' | 'utc' | 'locale'

const FORMAT_OPTIONS = computed<{ label: string, value: FormatKey }[]>(() => [
  { value: 'unix_s', label: t('unix_s_short') },
  { value: 'unix_ms', label: t('unix_ms_short') },
  { value: 'iso', label: 'ISO 8601' },
  { value: 'local', label: t('local_short') },
  { value: 'utc', label: 'UTC' },
  { value: 'locale', label: t('locale_short') },
])

// ── 核心状态 ──
const ms = shallowRef(Date.now())
const inputFormat = shallowRef<FormatKey>('unix_s')
const inputValue = shallowRef(String(Math.floor(Date.now() / 1000)))
const error = shallowRef(false)

// ── 实时更新 ──
const live = shallowRef(false)
let timer: ReturnType<typeof setInterval> | null = null

function stopLive() {
  live.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function startLive() {
  live.value = true
  timer = setInterval(() => {
    ms.value = Date.now()
    inputValue.value = formatAs(ms.value, inputFormat.value)
  }, 1000)
}

function onLiveToggle(val: boolean) {
  val ? startLive() : stopLive()
}

onUnmounted(stopLive)

// ── 格式化工具 ──
function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toLocalString(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function toRelative(d: Date) {
  const diff = Date.now() - d.getTime()
  const abs = Math.abs(diff)
  const suffix = diff >= 0 ? ' ago' : ' from now'
  if (abs < 60_000)
    return `${Math.round(abs / 1000)} seconds${suffix}`
  if (abs < 3_600_000)
    return `${Math.round(abs / 60_000)} minutes${suffix}`
  if (abs < 86_400_000)
    return `${Math.round(abs / 3_600_000)} hours${suffix}`
  return `${Math.round(abs / 86_400_000)} days${suffix}`
}

function formatAs(msVal: number, fmt: FormatKey): string {
  const d = new Date(msVal)
  if (fmt === 'unix_s')
    return String(Math.floor(msVal / 1000))
  if (fmt === 'unix_ms')
    return String(msVal)
  if (fmt === 'iso')
    return d.toISOString()
  if (fmt === 'local')
    return toLocalString(d)
  if (fmt === 'utc')
    return d.toUTCString()
  if (fmt === 'locale')
    return d.toString()
  return ''
}

function parseAs(val: string, fmt: FormatKey): number | null {
  if (fmt === 'unix_s') {
    const n = Number(val)
    return Number.isNaN(n) ? null : n * 1000
  }
  if (fmt === 'unix_ms') {
    const n = Number(val)
    return Number.isNaN(n) ? null : n
  }
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? null : d.getTime()
}

// 输入变化时解析并更新 ms，用户手动输入时退出实时模式
function onInput(val: string) {
  if (live.value)
    stopLive()
  inputValue.value = val
  const parsed = parseAs(val, inputFormat.value)
  if (parsed === null) {
    error.value = true
    return
  }
  error.value = false
  ms.value = parsed
}

// 切换输入格式时，把当前 ms 转成新格式填入输入框
watch(inputFormat, (fmt) => {
  inputValue.value = formatAs(ms.value, fmt)
  error.value = false
})

function setNow() {
  ms.value = Date.now()
  inputValue.value = formatAs(ms.value, inputFormat.value)
  error.value = false
}

// ── 只读输出 computed ──
const outUnixS = computed(() => String(Math.floor(ms.value / 1000)))
const outUnixMs = computed(() => String(ms.value))
const outIso = computed(() => new Date(ms.value).toISOString())
const outLocal = computed(() => toLocalString(new Date(ms.value)))
const outUtc = computed(() => new Date(ms.value).toUTCString())
const outLocale = computed(() => new Date(ms.value).toString())
const outRelative = computed(() => toRelative(new Date(ms.value)))

const outputs = computed(() => [
  { key: 'unix_s', label: t('unix_s'), value: outUnixS.value },
  { key: 'unix_ms', label: t('unix_ms'), value: outUnixMs.value },
  { key: 'iso', label: t('iso'), value: outIso.value },
  { key: 'local', label: t('local'), value: outLocal.value },
  { key: 'utc', label: t('utc'), value: outUtc.value },
  { key: 'locale', label: t('locale'), value: outLocale.value },
  { key: 'relative', label: t('relative'), value: outRelative.value },
])
</script>

<template>
  <div flex="~ col gap-4">
    <!-- 输入 Panel -->
    <Panel :title="t('input_label')">
      <div p-5 flex="~ col gap-4">
        <!-- 操作栏 -->
        <div flex="~ gap-2" items-center>
          <BaseButton icon="i-carbon-time" @click="setNow">
            {{ t('now') }}
          </BaseButton>
          <BaseButton
            icon="i-material-symbols-play-arrow"
            :active="live"
            @click="onLiveToggle(!live)"
          >
            {{ t('live') }}
          </BaseButton>
        </div>

        <!-- 输入框 + 格式下拉 -->
        <TextInput
          :model-value="inputValue"
          :error="error"
          :copyable="false"
          @update:model-value="onInput"
        >
          <template #append>
            <CustomSelect
              v-model="inputFormat"
              :options="FORMAT_OPTIONS"
            />
          </template>
        </TextInput>
        <Transition name="warn">
          <AlertTip v-if="error" type="error">
            {{ t('invalid') }}
          </AlertTip>
        </Transition>
      </div>
    </Panel>

    <!-- 输出 Panel -->
    <Panel :title="t('output_label')">
      <!-- <div p-5 flex="~ col gap-3">
        <TextInput
          v-for="out in outputs"
          :key="out.key" :model-value="out.value" :label="out.label"
          readonly
        />
      </div> -->
      <div p-5 flex="~ col gap-3">
        <LabelField v-for="out in outputs" :key="out.key" :label="out.label">
          <TextInput :model-value="out.value" readonly />
        </LabelField>
      </div>
    </Panel>
  </div>
</template>
