<script lang="ts">
import LabelField from '~/components/container/LabelField.vue'
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'hash-calculator',
  name: 'Hash Calculator',
  nameZh: '哈希计算',
  description: 'Calculate MD5, SHA-1/224/256/384/512, SHA-3, RIPEMD-160, BLAKE2/3, SM3, Whirlpool, CRC32 hashes from text.',
  descriptionZh: '计算文本的 MD5、SHA-1/224/256/384/512、SHA-3、RIPEMD-160、BLAKE2/3、SM3、Whirlpool、CRC32 哈希值。',
  category: 'dev',
  keywords: ['hash', 'md5', 'sha', 'sha256', 'sha512', 'sha3', 'blake', 'ripemd', 'sm3', 'crc32', 'digest', 'checksum', '哈希', '摘要'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import {
  useLocalStorage,
  watchDebounced,
} from '@vueuse/core'

import {
  blake2b,
  blake2s,
  blake3,
  crc32,
  md5,
  ripemd160,
  sha1,
  sha3,
  sha224,
  sha256,
  sha384,
  sha512,
  sm3,
  whirlpool,
} from 'hash-wasm'

import {
  computed,
  shallowRef,
} from 'vue'

import Markdown from '~/components/container/Markdown.vue'
import Panel from '~/components/container/Panel.vue'
import BaseButton from '~/components/input/BaseButton.vue'
import TextareaInput from '~/components/input/TextareaInput.vue'
import TextInput from '~/components/input/TextInput.vue'
import { useI18n } from '~/composables/useI18n'
import MD_EN from '~/contents/HashCalculator.en.md?raw'
import MD_ZH from '~/contents/HashCalculator.zh.md?raw'

const { t } = useI18n({
  input: ['Input', '输入'],
  output: ['Hash Output', '哈希结果'],
  placeholder: ['Enter text to hash...', '输入要计算哈希的文本...'],
  algorithms: ['Algorithms', '算法'],
  empty: ['Enter text to calculate hashes', '输入文本以计算哈希'],
})

const ALGORITHMS = [
  { label: 'MD5', fn: md5 },
  { label: 'SHA-1', fn: sha1 },
  { label: 'SHA-224', fn: sha224 },
  { label: 'SHA-256', fn: sha256 },
  { label: 'SHA-384', fn: sha384 },
  { label: 'SHA-512', fn: sha512 },
  { label: 'SHA-3 (256)', fn: (s: string) => sha3(s, 256) },
  { label: 'SHA-3 (512)', fn: (s: string) => sha3(s, 512) },
  { label: 'RIPEMD-160', fn: ripemd160 },
  { label: 'BLAKE2b', fn: blake2b },
  { label: 'BLAKE2s', fn: blake2s },
  { label: 'BLAKE3', fn: blake3 },
  { label: 'SM3', fn: sm3 },
  { label: 'Whirlpool', fn: whirlpool },
  { label: 'CRC32', fn: crc32 },
]

const input = shallowRef('')

const results = shallowRef<Record<string, string>>({})

const enabled = useLocalStorage<string[]>(
  'hash-calculator-enabled',
  ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'],
)

const activeAlgorithms = computed(() =>
  ALGORITHMS.filter(a =>
    enabled.value.includes(a.label),
  ),
)

function toggleAlgorithm(label: string) {
  const exists = enabled.value.includes(label)

  if (exists) {
    if (enabled.value.length <= 1)
      return

    enabled.value = enabled.value.filter(
      l => l !== label,
    )

    return
  }

  enabled.value = [
    ...enabled.value,
    label,
  ]
}

async function computeHashes() {
  if (!input.value) {
    results.value = {}
    return
  }

  const hashes = await Promise.all(
    activeAlgorithms.value.map(a =>
      a.fn(input.value),
    ),
  )

  results.value = Object.fromEntries(
    activeAlgorithms.value.map((a, i) => [
      a.label,
      hashes[i],
    ]),
  )
}

watchDebounced(
  [input, enabled],
  computeHashes,
  {
    debounce: 120,
    immediate: true,
  },
)
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('input')">
      <div p-5>
        <TextareaInput
          v-model="input"
          :placeholder="t('placeholder')"
          :rows="4"
        />
      </div>
    </Panel>

    <Panel :title="t('algorithms')">
      <div p-5 flex="~ gap-2 wrap">
        <BaseButton
          v-for="algo in ALGORITHMS"
          :key="algo.label"
          :active="enabled.includes(algo.label)"
          @click="toggleAlgorithm(algo.label)"
        >
          {{ algo.label }}
        </BaseButton>
      </div>
    </Panel>

    <Panel :title="t('output')">
      <div p-5 flex="~ col gap-3">
        <LabelField v-for="algo in activeAlgorithms" :key="algo.label" :label="algo.label">
          <TextInput
            :model-value="results[algo.label] ?? ''"
            readonly copyable
          />
        </LabelField>
      </div>
    </Panel>

    <Panel :title="t('title.how_it_works')">
      <Markdown
        :content="[MD_EN, MD_ZH]"
      />
    </Panel>
  </div>
</template>
