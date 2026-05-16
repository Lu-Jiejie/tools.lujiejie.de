<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'unified-password',
  name: 'Unified Password',
  nameZh: '统一密码生成',
  description: 'Generate deterministic passwords from a master password and platform alias using Argon2.',
  descriptionZh: '通过主密码和平台别名，使用 Argon2 算法生成确定性密码。',
  category: 'encode',
  keywords: ['password', 'argon2', 'hash', 'generate', 'unified'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
// @ts-expect-error no type definitions available
import argon2 from 'argon2-browser/dist/argon2-bundled.min.js'
import { shallowRef, watch } from 'vue'
import BaseButton from '~/components/BaseButton.vue'
import NumberInput from '~/components/NumberInput.vue'
import Panel from '~/components/Panel.vue'
import TextInput from '~/components/TextInput.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  input_label: ['Input', '输入'],
  output_label: ['Output', '输出'],
  settings_label: ['Settings', '设置'],
  password: ['Master Password', '主密码'],
  password_placeholder: ['Enter your master password', '输入你的主密码'],
  alias: ['Platform Alias', '平台别名'],
  alias_placeholder: ['e.g. github, google', '如 github、google'],
  hint: ['Enter password and alias to generate', '输入密码和别名以生成'],
  length: ['Length', '长度'],
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

const pwd = shallowRef('')
const alias = shallowRef('')
const hash = shallowRef('')
const length = shallowRef(16)
const useLower = shallowRef(true)
const useUpper = shallowRef(true)
const useDigits = shallowRef(true)
const useSymbols = shallowRef(false)

function buildCharset(): string {
  let charset = ''
  if (useLower.value)
    charset += CHARS_LOWER
  if (useUpper.value)
    charset += CHARS_UPPER
  if (useDigits.value)
    charset += CHARS_DIGITS
  if (useSymbols.value)
    charset += CHARS_SYMBOLS
  return charset || CHARS_LOWER + CHARS_DIGITS
}

function bytesToPassword(bytes: Uint8Array, charset: string, len: number): string {
  let result = ''
  for (let i = 0; i < len; i++) {
    const idx = ((bytes[i * 2] << 8) | bytes[i * 2 + 1]) % charset.length
    result += charset[idx]
  }
  return result
}

async function generate() {
  if (!pwd.value || !alias.value) {
    hash.value = ''
    return
  }
  try {
    const hashLen = length.value * 2
    const { hash: rawHash } = await argon2.hash({
      pass: pwd.value,
      salt: `${alias.value}_${SALT}`,
      hashLen,
      type: argon2.ArgonType.Argon2id,
    })
    const charset = buildCharset()
    hash.value = bytesToPassword(rawHash, charset, length.value)
  }
  catch (e) {
    console.error(e)
    hash.value = ''
  }
}

watch([pwd, alias, length, useLower, useUpper, useDigits, useSymbols], generate)
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('input_label')">
      <div p-5 flex="~ col gap-4">
        <TextInput
          v-model="pwd"
          :label="t('password')"
          :placeholder="t('password_placeholder')"
          secret
          :copyable="false"
        />
        <TextInput
          v-model="alias"
          :label="t('alias')"
          :placeholder="t('alias_placeholder')"
          :copyable="false"
          :monospace="false"
        />
      </div>
    </Panel>

    <Panel :title="t('settings_label')">
      <div p-5 flex="~ gap-3 wrap" items-center>
        <div flex="~ gap-2" items-center>
          <span text-xs tracking-wide font-medium op-60 select-none uppercase>{{ t('length') }}</span>
          <NumberInput v-model="length" :min="8" :max="64" />
        </div>
        <BaseButton :active="useLower" @click="useLower = !useLower">
          {{ t('lowercase') }}
        </BaseButton>
        <BaseButton :active="useUpper" @click="useUpper = !useUpper">
          {{ t('uppercase') }}
        </BaseButton>
        <BaseButton :active="useDigits" @click="useDigits = !useDigits">
          {{ t('digits') }}
        </BaseButton>
        <BaseButton :active="useSymbols" @click="useSymbols = !useSymbols">
          {{ t('symbols') }}
        </BaseButton>
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
