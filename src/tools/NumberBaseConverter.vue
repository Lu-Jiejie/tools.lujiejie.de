<script lang="ts">
import LabelField from '~/components/container/LabelField.vue'
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
import Panel from '~/components/container/Panel.vue'
import BaseButton from '~/components/input/BaseButton.vue'
import NumberInput from '~/components/input/NumberInput.vue'
import TextInput from '~/components/input/TextInput.vue'
import AlertTip from '~/components/ui/AlertTip.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  input_label: ['Input', '输入'],
  output_label: ['Output', '输出'],
  invalid_char: [
    (char: string, base: string) => `"${char}" is not valid in base ${base}.`,
    (char: string, base: string) => `"${char}" 在 ${base} 进制中不合法。`,
  ],
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
const errorChar = shallowRef<string | null>(null)
const bigIntValue = shallowRef<bigint | null>(255n)
const customOutputBase = shallowRef(12)

function setBase(n: number) {
  if (n === inputBase.value)
    return
  inputBase.value = n
  const result = parse(inputValue.value, n)
  errorChar.value = inputValue.value.trim() !== '' && result === null ? findInvalidChar(inputValue.value, n) : null
  bigIntValue.value = result
}

function findInvalidChar(val: string, base: number): string {
  const s = val.trim().toLowerCase()
  let clean = s
  if (base === 16 && (clean.startsWith('0x') || clean.startsWith('#')))
    clean = clean.replace(/^0x|^#/, '')
  else if (base === 2 && clean.startsWith('0b'))
    clean = clean.slice(2)
  else if (base === 8 && clean.startsWith('0o'))
    clean = clean.slice(2)
  for (const c of clean) {
    const d = Number.parseInt(c, base)
    if (Number.isNaN(d) || d >= base)
      return c
  }
  return clean[0] ?? ''
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
    errorChar.value = val.trim() !== '' ? findInvalidChar(val, inputBase.value) : null
    bigIntValue.value = null
    return
  }
  errorChar.value = null
  bigIntValue.value = parsed
}

watch(inputBase, (base) => {
  const parsed = parse(inputValue.value, base)
  errorChar.value = inputValue.value.trim() !== '' && parsed === null ? findInvalidChar(inputValue.value, base) : null
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
            :key="key" :active="inputBase === BASE_MAP[key]"
            @click="setBase(BASE_MAP[key])"
          >
            <span>{{ t(key) }}</span>
            <span ml-1 op-50>{{ BASE_MAP[key] }}</span>
          </BaseButton>
        </div>

        <div flex="~ gap-2" items-end>
          <LabelField :label="t('base')">
            <NumberInput
              :model-value="inputBase"
              :min="2"
              :max="36"
              @update:model-value="setBase($event)"
            />
          </LabelField>
          <LabelField :label="t('value')" flex-1>
            <TextInput
              :model-value="inputValue"
              :error="errorChar !== null"
              :copyable="false"
              :placeholder="t('input_placeholder')"
              @update:model-value="onInput"
            />
          </LabelField>
        </div>
        <Transition name="warn">
          <AlertTip v-if="errorChar !== null" type="error">
            {{ t('invalid_char', errorChar, String(inputBase)) }}
          </AlertTip>
        </Transition>
      </div>
    </Panel>

    <Panel :title="t('output_label')">
      <div p-5 flex="~ col gap-3">
        <!-- <TextInput
          v-for="out in outputs"
          :key="out.key"
          :model-value="out.value"
          :label="out.label"
          readonly
        /> -->
        <LabelField v-for="out in outputs" :key="out.key" :label="out.label">
          <TextInput
            :model-value="out.value"
            readonly
          />
        </LabelField>
        <!-- 自定义进制输出 -->
        <div flex="~ gap-2" items-end>
          <div flex="~ col gap-1.5">
            <label text-xs tracking-wide font-medium op-60 select-none uppercase>{{ t('custom') }} ({{ customOutputBase }})</label>
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
/* Hide number input spinners — UnoCSS cannot target these pseudo-elements */
.no-spinner::-webkit-inner-spin-button,
.no-spinner::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.no-spinner {
  -moz-appearance: textfield;
}
</style>
