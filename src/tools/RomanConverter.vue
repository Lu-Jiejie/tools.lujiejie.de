<script lang="ts">
import LabelField from '~/components/container/LabelField.vue'
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'roman-converter',
  name: 'Roman Numeral Converter',
  nameZh: '罗马数字转换',
  description: 'Convert between Arabic numbers and Roman numerals.',
  descriptionZh: '在阿拉伯数字和罗马数字之间互相转换。',
  category: 'convert',
  keywords: ['roman', 'numeral', 'arabic', 'convert', '罗马数字', '转换'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import Panel from '~/components/container/Panel.vue'
import TextInput from '~/components/input/TextInput.vue'
import AlertTip from '~/components/ui/AlertTip.vue'
import BaseButton from '~/components/ui/BaseButton.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  arabic_to_roman: ['Arabic → Roman', '阿拉伯数字 → 罗马数字'],
  roman_to_arabic: ['Roman → Arabic', '罗马数字 → 阿拉伯数字'],
  arabic_label: ['Arabic Number', '阿拉伯数字'],
  roman_label: ['Roman Numeral', '罗马数字'],
  result_label: ['Result', '结果'],
  invalid_arabic: ['Please enter an integer between 1 and 3999.', '请输入 1 到 3999 之间的整数。'],
  invalid_roman: ['Invalid Roman numeral.', '无效的罗马数字。'],
  arabic_placeholder: ['e.g. 2025', '例如 2025'],
  roman_placeholder: ['e.g. MMXXV', '例如 MMXXV'],
})

const ROMAN_MAP: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
]

const ROMAN_VALS: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }

function toRoman(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 3999)
    return ''
  let result = ''
  let remaining = n
  for (const [val, sym] of ROMAN_MAP) {
    while (remaining >= val) {
      result += sym
      remaining -= val
    }
  }
  return result
}

function fromRoman(s: string): number | null {
  const str = s.trim().toUpperCase()
  if (!str)
    return null
  let result = 0
  for (let i = 0; i < str.length; i++) {
    const cur = ROMAN_VALS[str[i]]
    if (cur === undefined)
      return null
    const next = ROMAN_VALS[str[i + 1]]
    result += next && next > cur ? -cur : cur
  }
  // 验证：转回来必须一致，排除非标准写法
  return toRoman(result) === str ? result : null
}

// Arabic → Roman
const arabicInput = shallowRef('2025')
const arabicError = shallowRef(false)
const arabicToRoman = computed(() => toRoman(Number(arabicInput.value)))

function onArabicInput(val: string) {
  arabicInput.value = val
  if (!val.trim()) {
    arabicError.value = false
    return
  }
  const n = Number(val)
  arabicError.value = !Number.isInteger(n) || n < 1 || n > 3999
}

// Roman → Arabic
const romanInput = shallowRef('MMXXV')
const romanError = shallowRef(false)
const romanToArabic = computed(() => {
  const n = fromRoman(romanInput.value)
  return n !== null ? String(n) : ''
})

function onRomanInput(val: string) {
  romanInput.value = val
  if (!val.trim()) {
    romanError.value = false
    return
  }
  romanError.value = fromRoman(val) === null
}

const ROMAN_CHARS = ['I', 'V', 'X', 'L', 'C', 'D', 'M']

function appendRomanChar(char: string) {
  onRomanInput(romanInput.value + char)
}
</script>

<template>
  <div flex="~ col gap-4">
    <!-- Arabic to Roman -->
    <Panel :title="t('arabic_to_roman')">
      <div p-5 flex="~ col gap-4">
        <LabelField :label="t('arabic_label')">
          <TextInput
            :model-value="arabicInput"
            :error="arabicError"
            :copyable="false"
            :placeholder="t('arabic_placeholder')"
            @update:model-value="onArabicInput"
          />
        </LabelField>
        <Transition name="warn">
          <AlertTip v-if="arabicError" type="error">
            {{ t('invalid_arabic') }}
          </AlertTip>
        </Transition>
        <LabelField :label="t('result_label')">
          <TextInput :model-value="arabicToRoman" readonly />
        </LabelField>
      </div>
    </Panel>

    <!-- Roman to Arabic -->
    <Panel :title="t('roman_to_arabic')">
      <div p-5 flex="~ col gap-4">
        <LabelField :label="t('roman_label')">
          <TextInput
            :model-value="romanInput"
            :error="romanError"
            :copyable="false"
            :backspaceable="true"
            :placeholder="t('roman_placeholder')"
            @update:model-value="onRomanInput"
          />
        </LabelField>
        <div flex="~ gap-2 wrap">
          <BaseButton
            v-for="char in ROMAN_CHARS"
            :key="char"
            class="font-mono size-9.5!"
            @click="appendRomanChar(char)"
          >
            {{ char }}
          </BaseButton>
        </div>
        <Transition name="warn">
          <AlertTip v-if="romanError" type="error">
            {{ t('invalid_roman') }}
          </AlertTip>
        </Transition>
        <LabelField :label="t('result_label')">
          <TextInput :model-value="romanToArabic" readonly />
        </LabelField>
      </div>
    </Panel>
  </div>
</template>
