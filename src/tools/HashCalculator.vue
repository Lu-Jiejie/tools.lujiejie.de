<script lang="ts">
import LabelField from '~/components/container/LabelField.vue'
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'hash-generator',
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

import BaseButton from '~/components/BaseButton.vue'
import CollapsibleExplainer from '~/components/container/CollapsibleExplainer.vue'
import Panel from '~/components/container/Panel.vue'
import TextInput from '~/components/TextInput.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  input: ['Input', '输入'],
  output: ['Hash Output', '哈希结果'],
  placeholder: ['Enter text to hash...', '输入要计算哈希的文本...'],
  algorithms: ['Algorithms', '算法'],
  empty: ['Enter text to calculate hashes', '输入文本以计算哈希'],
  how_it_works: ['How It Works', '工作原理'],
  how_1_title: ['Hash digest', '哈希摘要'],
  how_1_desc: [
    'A hash gives you a digest of the text. There is no decrypt button; the original text is not stored in the result.',
    '哈希只是给文本算一个摘要。它没有“解密”这一步，结果里也不保存原文。',
  ],
  how_2_title: ['Input changes', '输入变化'],
  how_2_desc: [
    'Change one character and the digest should change. Keep the input and algorithm the same, and the result stays the same.',
    '改一个字符，摘要通常就会变。输入和算法都不变，结果也会保持一致。',
  ],
  how_3_title: ['Legacy hashes', '旧哈希'],
  how_3_desc: [
    'MD5 and SHA-1 are fine for old checks and quick comparisons. Do not pick them for new security-sensitive work.',
    'MD5 和 SHA-1 可以用来兼容旧系统或做快速比对，但不要用于新的安全敏感场景。',
  ],
  how_4_title: ['CRC32 checksum', 'CRC32 校验和'],
  how_4_desc: [
    'CRC32 is mainly for catching accidental data errors. It will not protect data from deliberate tampering.',
    'CRC32 主要用来发现意外的数据错误，不适合拿来防篡改。',
  ],
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

const explainItems = computed(() => [
  { title: t('how_1_title'), description: t('how_1_desc') },
  { title: t('how_2_title'), description: t('how_2_desc') },
  { title: t('how_3_title'), description: t('how_3_desc') },
  { title: t('how_4_title'), description: t('how_4_desc') },
])

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
        <textarea
          v-model="input"
          :placeholder="t('placeholder')"
          rows="4" border="~ c-border focus:c-border-strong"
          text-sm font-mono p="x-3 y-2" outline-none rounded-xl bg-c-input w-full resize-y
          transition-colors
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

    <CollapsibleExplainer
      :title="t('how_it_works')"
      :items="explainItems"
    />
  </div>
</template>
