<script lang="ts">
import LabelField from '~/components/container/LabelField.vue'
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'unified-password',
  name: 'Unified Password',
  nameZh: '统一密码生成',
  description: 'Generate deterministic passwords from a master password and platform alias using Argon2.',
  descriptionZh: '通过主密码和平台别名，使用 Argon2 算法生成确定性密码。',
  category: 'generate',
  keywords: ['password', 'argon2', 'hash', 'generate', 'unified'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
// @ts-expect-error no type definitions available
import argon2 from 'argon2-browser/dist/argon2-bundled.min.js'
import { watch } from 'vue'
import Panel from '~/components/container/Panel.vue'
import NumberInput from '~/components/NumberInput.vue'
import TextInput from '~/components/TextInput.vue'
import ToggleButtonGroup from '~/components/ToggleButtonGroup.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  input_label: ['Input', '输入'],
  output_label: ['Output', '输出'],
  settings_label: ['Settings', '设置'],

  password: ['Master Password', '主密码'],
  password_placeholder: ['Enter your master password', '输入你的主密码'],

  alias: ['Platform Alias', '平台别名'],
  alias_placeholder: ['e.g. github, google', '如 github、google'],

  length: ['Length', '长度'],

  charset: ['Character Set', '字符集'],

  lowercase: ['a-z', '小写'],
  uppercase: ['A-Z', '大写'],
  digits: ['0-9', '数字'],
  symbols: ['!@#', '符号'],
})

const SALT = 'Unified_Password'

const CHARS_LOWER = 'abcdefghijklmnopqrstuvwxyz'
const CHARS_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const CHARS_DIGITS = '0123456789'
const CHARS_SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?'

const pwd = useLocalStorage(
  'unified-password:pwd',
  '',
)

const alias = useLocalStorage(
  'unified-password:alias',
  '',
)

const hash = useLocalStorage(
  'unified-password:hash',
  '',
)

const length = useLocalStorage(
  'unified-password:length',
  16,
)

const charsetTypes = useLocalStorage<string[]>(
  'unified-password:charset',
  [
    'lower',
    'upper',
    'digits',
  ],
)

const charsetOptions = [
  { label: t('lowercase'), value: 'lower' },
  { label: t('uppercase'), value: 'upper' },
  { label: t('digits'), value: 'digits' },
  { label: t('symbols'), value: 'symbols' },
]

function buildCharset(): string {
  let charset = ''

  if (charsetTypes.value.includes('lower'))
    charset += CHARS_LOWER

  if (charsetTypes.value.includes('upper'))
    charset += CHARS_UPPER

  if (charsetTypes.value.includes('digits'))
    charset += CHARS_DIGITS

  if (charsetTypes.value.includes('symbols'))
    charset += CHARS_SYMBOLS

  return charset
}

function pickChar(
  bytes: Uint8Array,
  index: number,
  chars: string,
): string {
  return chars[
    bytes[index % bytes.length] % chars.length
  ]
}

function bytesToPassword(
  bytes: Uint8Array,
  len: number,
): string {
  const result: string[] = []

  let offset = 0

  // 保证每种字符类型至少出现一次
  if (charsetTypes.value.includes('lower')) {
    result.push(
      pickChar(bytes, offset++, CHARS_LOWER),
    )
  }

  if (charsetTypes.value.includes('upper')) {
    result.push(
      pickChar(bytes, offset++, CHARS_UPPER),
    )
  }

  if (charsetTypes.value.includes('digits')) {
    result.push(
      pickChar(bytes, offset++, CHARS_DIGITS),
    )
  }

  if (charsetTypes.value.includes('symbols')) {
    result.push(
      pickChar(bytes, offset++, CHARS_SYMBOLS),
    )
  }

  const charset = buildCharset()

  // 填充剩余字符
  while (result.length < len) {
    result.push(
      pickChar(bytes, offset, charset),
    )

    offset++
  }

  // Deterministic Fisher-Yates Shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = (
      bytes[offset % bytes.length]
      % (i + 1)
    )

    ;[result[i], result[j]] = [result[j], result[i]]

    offset++
  }

  return result.join('')
}

async function generate() {
  if (!pwd.value || !alias.value) {
    hash.value = ''
    return
  }

  try {
    // 提供更多 entropy
    const hashLen = Math.max(
      length.value * 4,
      32,
    )

    const { hash: rawHash } = await argon2.hash({
      pass: pwd.value,
      salt: `${alias.value}_${SALT}`,
      hashLen,
      type: argon2.ArgonType.Argon2id,
    })

    hash.value = bytesToPassword(
      rawHash,
      length.value,
    )
  }
  catch (e) {
    console.error(e)
    hash.value = ''
  }
}

watch(
  [pwd, alias, length, charsetTypes],
  generate,
)
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('input_label')">
      <div p-5 flex="~ col gap-4">
        <LabelField :label="t('password')">
          <TextInput
            v-model="pwd"
            :placeholder="t('password_placeholder')"
            secret
            :copyable="false"
          />
        </LabelField>

        <LabelField :label="t('alias')">
          <TextInput
            v-model="alias"
            :placeholder="t('alias_placeholder')"
            :copyable="false"
            :monospace="false"
          />
        </LabelField>
      </div>
    </Panel>

    <Panel :title="t('settings_label')">
      <div
        p-5
        flex="~ col gap-4"
        items-start
      >
        <LabelField :label="t('length')">
          <NumberInput
            v-model="length"
            :min="8"
            :max="64"
          />
        </LabelField>

        <LabelField
          :label="t('charset')"
          w-full
        >
          <ToggleButtonGroup
            v-model="charsetTypes"
            required
            :options="charsetOptions"
          />
        </LabelField>
      </div>
    </Panel>

    <Panel :title="t('output_label')">
      <div p-5 flex="~ col gap-3">
        <TextInput
          :model-value="hash"
          secret
          readonly
        />
      </div>
    </Panel>
  </div>
</template>
