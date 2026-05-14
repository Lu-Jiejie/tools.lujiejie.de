<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'number-base-converter',
  name: 'Number Base Converter',
  nameZh: '进制转换',
  description: 'Convert numbers between binary, octal, decimal, hexadecimal, and custom bases.',
  descriptionZh: '在二进制、八进制、十进制、十六进制及自定义进制之间互相转换。',
  category: 'convert',
  keywords: ['binary', 'octal', 'decimal', 'hex', 'hexadecimal', 'base', 'convert', '进制', '二进制', '十六进制'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import BaseButton from '~/components/BaseButton.vue'
import NumberInput from '~/components/NumberInput.vue'
import Panel from '~/components/Panel.vue'
import TextInput from '~/components/TextInput.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  input_label: ['Input', '输入'],
  output_label: ['Output', '输出'],
  invalid: ['Invalid number', '无效数字'],
  bin: ['Binary', '二进制'],
  oct: ['Octal', '八进制'],
  dec: ['Decimal', '十进制'],
  hex: ['Hexadecimal', '十六进制'],
  base32: ['Base 32', '三十二进制'],
  base36: ['Base 36', '三十六进制'],
  custom: ['Custom', '自定义'],
  base: ['Base', '进制'],
  value: ['Value', '数值'],
  input_placeholder: ['Enter a number...', '输入数字...'],
})

type BaseKey = 'bin' | 'oct' | 'dec' | 'hex' | 'base32' | 'base36'

const BASE_MAP: Record<BaseKey, number> = {
  bin: 2,
  oct: 8,
  dec: 10,
  hex: 16,
  base32: 32,
  base36: 36,
}

const PRESET_BASES: BaseKey[] = ['bin', 'oct', 'dec', 'hex', 'base32', 'base36']

const inputBase = shallowRef(10)
const inputValue = shallowRef('255')
const error = shallowRef(false)
const bigIntValue = shallowRef<bigint | null>(255n)
const customOutputBase = shallowRef(12)

function setBase(n: number) {
  const clamped = Math.max(2, Math.min(36, n))
  if (clamped === inputBase.value)
    return
  inputBase.value = clamped
  // 重新解析当前输入，不修改输入框内容
  const parsed = parse(inputValue.value, clamped)
  error.value = inputValue.value.trim() !== '' && parsed === null
  bigIntValue.value = parsed
}

function parse(val: string, base: number): bigint | null {
  const s = val.trim().toLowerCase()
  if (!s)
    return null
  let clean = s
  if (base === 16 && (clean.startsWith('0x') || clean.startsWith('#')))
    clean = clean.replace(/^0x|^#/, '')
  else if (base === 2 && clean.startsWith('0b'))
    clean = clean.slice(2)
  else if (base === 8 && clean.startsWith('0o'))
    clean = clean.slice(2)

  if (!clean)
    return null

  try {
    let result = 0n
    const bigBase = BigInt(base)
    for (const c of clean) {
      const d = Number.parseInt(c, base)
      if (Number.isNaN(d) || d >= base)
        return null
      result = result * bigBase + BigInt(d)
    }
    return result
  }
  catch {
    return null
  }
}

function format(val: bigint, base: number): string {
  return val.toString(base).toUpperCase()
}

function onInput(val: string) {
  inputValue.value = val
  const parsed = parse(val, inputBase.value)
  if (parsed === null) {
    error.value = val.trim() !== ''
    bigIntValue.value = null
    return
  }
  error.value = false
  bigIntValue.value = parsed
}

watch(inputBase, (base) => {
  const parsed = parse(inputValue.value, base)
  error.value = inputValue.value.trim() !== '' && parsed === null
  bigIntValue.value = parsed
})

const outputs = computed(() => {
  return PRESET_BASES.map(key => ({
    key,
    label: `${t(key)} (${BASE_MAP[key]})`,
    value: bigIntValue.value !== null ? format(bigIntValue.value, BASE_MAP[key]) : '',
  }))
})

const customOutput = computed(() =>
  bigIntValue.value !== null ? format(bigIntValue.value, customOutputBase.value) : '',
)
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('input_label')">
      <div p-5 flex="~ col gap-4">
        <!-- 进制选择按钮 -->
        <div flex="~ gap-2" flex-wrap items-center>
          <BaseButton
            v-for="key in PRESET_BASES"
            :key="key"
            :active="inputBase === BASE_MAP[key]"
            @click="setBase(BASE_MAP[key])"
          >
            <span>{{ t(key) }}</span>
            <span ml-1 op-50>{{ BASE_MAP[key] }}</span>
          </BaseButton>
        </div>

        <div flex="~ gap-2" items-end>
          <div flex="~ col gap-1.5">
            <label text-xs tracking-wide font-medium op-50 select-none uppercase>{{ t('base') }}</label>
            <NumberInput
              :model-value="inputBase"
              :min="2"
              :max="36"
              @update:model-value="setBase"
            />
          </div>
          <TextInput
            :model-value="inputValue"
            :label="t('value')"
            :error="error"
            :copyable="false"
            :placeholder="t('input_placeholder')"
            class="flex-1"
            @update:model-value="onInput"
          />
        </div>
        <span v-if="error" text-xs text-red-400>{{ t('invalid') }}</span>
      </div>
    </Panel>

    <Panel :title="t('output_label')">
      <div p-5 flex="~ col gap-3">
        <TextInput
          v-for="out in outputs"
          :key="out.key"
          :model-value="out.value"
          :label="out.label"
          readonly
        />
        <!-- 自定义进制输出 -->
        <div flex="~ gap-2" items-end>
          <div flex="~ col gap-1.5">
            <label text-xs tracking-wide font-medium op-50 select-none uppercase>{{ t('custom') }} ({{ customOutputBase }})</label>
            <NumberInput
              :model-value="customOutputBase"
              :min="2"
              :max="36"
              @update:model-value="customOutputBase = $event"
            />
          </div>
          <TextInput
            :model-value="customOutput"
            class="flex-1"
            readonly
          />
        </div>
      </div>
    </Panel>
  </div>
</template>

<style scoped>
.no-spinner::-webkit-inner-spin-button,
.no-spinner::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.no-spinner {
  -moz-appearance: textfield;
}
</style>
