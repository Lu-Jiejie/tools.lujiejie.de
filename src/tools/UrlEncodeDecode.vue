<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'url-encode-decode',
  name: 'URL Encode/Decode',
  nameZh: 'URL 编解码',
  description: 'Encode or decode URL strings with percent-encoding (encodeURIComponent).',
  descriptionZh: '对 URL 字符串进行百分号编码或解码。',
  category: 'dev',
  keywords: ['url', 'encode', 'decode', 'percent', 'uri', 'component', '编码', '解码'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import AlertTip from '~/components/AlertTip.vue'
import BaseButton from '~/components/BaseButton.vue'
import Panel from '~/components/Panel.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  input: ['Input', '输入'],
  output: ['Output', '输出'],
  encode: ['Encode', '编码'],
  decode: ['Decode', '解码'],
  swap: ['Swap', '交换'],
  copy: ['Copy', '复制'],
  copied: ['Copied', '已复制'],
  input_placeholder: ['Enter text to encode or decode...', '输入要编码或解码的文本...'],
  error: ['Error: Invalid input for decoding.', '错误：输入内容无法解码。'],
})

type Direction = 'encode' | 'decode'

const input = shallowRef('')
const direction = shallowRef<Direction>('encode')

const result = computed<{ output: string, error: boolean }>(() => {
  if (!input.value)
    return { output: '', error: false }

  try {
    const output = direction.value === 'encode'
      ? encodeURIComponent(input.value)
      : decodeURIComponent(input.value)
    return { output, error: false }
  }
  catch {
    return { output: '', error: true }
  }
})

function swap() {
  if (result.value.output && !result.value.error) {
    input.value = result.value.output
    direction.value = direction.value === 'encode' ? 'decode' : 'encode'
  }
  else {
    direction.value = direction.value === 'encode' ? 'decode' : 'encode'
  }
}

const copied = shallowRef(false)
async function copyOutput() {
  if (!result.value.output)
    return
  await navigator.clipboard.writeText(result.value.output)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('input')">
      <div p-5 flex="~ col gap-3">
        <div flex="~ gap-2 wrap" items-center>
          <BaseButton
            :active="direction === 'encode'"
            icon="i-carbon-arrow-right"
            @click="direction = 'encode'"
          >
            {{ t('encode') }}
          </BaseButton>
          <BaseButton
            :active="direction === 'decode'"
            icon="i-carbon-arrow-left"
            @click="direction = 'decode'"
          >
            {{ t('decode') }}
          </BaseButton>
          <BaseButton
            icon="i-carbon-arrows-vertical"
            @click="swap"
          >
            {{ t('swap') }}
          </BaseButton>
        </div>
        <textarea
          v-model="input"
          :placeholder="t('input_placeholder')"
          rows="6"
          border="~ c-border focus:c-border-strong" text-sm font-mono px-3 py-2 outline-none rounded-xl bg-c-input w-full resize-y transition-colors
        />
        <Transition name="warn">
          <AlertTip v-if="result.error" type="error">
            {{ t('error') }}
          </AlertTip>
        </Transition>
      </div>
    </Panel>

    <Panel :title="t('output')">
      <div p-5 flex="~ col gap-3">
        <div
          border="~ c-border" text-sm leading-relaxed font-mono px-3 py-2 rounded-xl bg-c-input-readonly op-70 min-h-24 select-all whitespace-pre-wrap break-all
        >
          {{ result.output || '\u00A0' }}
        </div>
        <div flex gap-2 justify-end>
          <BaseButton icon="i-carbon-copy" @click="copyOutput">
            {{ copied ? t('copied') : t('copy') }}
          </BaseButton>
        </div>
      </div>
    </Panel>
  </div>
</template>
