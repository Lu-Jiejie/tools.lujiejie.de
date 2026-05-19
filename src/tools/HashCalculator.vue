<script lang="ts">
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
import { blake2b, blake2s, blake3, crc32, md5, ripemd160, sha1, sha3, sha224, sha256, sha384, sha512, sm3, whirlpool } from 'hash-wasm'
import { ref, watch } from 'vue'
import BaseButton from '~/components/BaseButton.vue'
import Panel from '~/components/container/Panel.vue'
import TextInput from '~/components/TextInput.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  input: ['Input', '输入'],
  output: ['Hash Output', '哈希结果'],
  placeholder: ['Enter text to hash...', '输入要计算哈希的文本...'],
  algorithms: ['Algorithms', '算法'],
})

const ALGORITHMS = [
  { label: 'MD5', fn: (s: string) => md5(s) },
  { label: 'SHA-1', fn: (s: string) => sha1(s) },
  { label: 'SHA-224', fn: (s: string) => sha224(s) },
  { label: 'SHA-256', fn: (s: string) => sha256(s) },
  { label: 'SHA-384', fn: (s: string) => sha384(s) },
  { label: 'SHA-512', fn: (s: string) => sha512(s) },
  { label: 'SHA-3 (256)', fn: (s: string) => sha3(s, 256) },
  { label: 'SHA-3 (512)', fn: (s: string) => sha3(s, 512) },
  { label: 'RIPEMD-160', fn: (s: string) => ripemd160(s) },
  { label: 'BLAKE2b', fn: (s: string) => blake2b(s) },
  { label: 'BLAKE2s', fn: (s: string) => blake2s(s) },
  { label: 'BLAKE3', fn: (s: string) => blake3(s) },
  { label: 'SM3', fn: (s: string) => sm3(s) },
  { label: 'Whirlpool', fn: (s: string) => whirlpool(s) },
  { label: 'CRC32', fn: (s: string) => crc32(s) },
]

const DEFAULT_ENABLED = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512']
const STORAGE_KEY = 'hash-calculator-enabled'

function loadEnabled(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0)
        return parsed
    }
  }
  catch {}
  return DEFAULT_ENABLED
}

const enabled = ref<string[]>(loadEnabled())

function toggleAlgorithm(label: string) {
  const idx = enabled.value.indexOf(label)
  if (idx === -1)
    enabled.value = [...enabled.value, label]
  else if (enabled.value.length > 1)
    enabled.value = enabled.value.filter(l => l !== label)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled.value))
}

const input = ref('')
const results = ref<Record<string, string>>({})

async function computeHashes() {
  if (!input.value) {
    results.value = {}
    return
  }

  const active = ALGORITHMS.filter(a => enabled.value.includes(a.label))
  const hashes = await Promise.all(active.map(a => a.fn(input.value)))
  const newResults: Record<string, string> = {}
  for (let i = 0; i < active.length; i++)
    newResults[active[i].label] = hashes[i]

  results.value = newResults
}

watch([input, enabled], computeHashes, { immediate: true })
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('input')">
      <div p-5 flex="~ col gap-3">
        <textarea
          v-model="input"
          :placeholder="t('placeholder')"
          rows="4"
          border="~ c-border focus:c-border-strong" text-sm font-mono px-3 py-2 outline-none rounded-xl bg-c-input w-full resize-y transition-colors
        />
      </div>
    </Panel>

    <Panel :title="t('algorithms')">
      <div p-5 flex="~ gap-2 wrap">
        <BaseButton
          v-for="algo in ALGORITHMS" :key="algo.label"
          :active="enabled.includes(algo.label)"
          @click="toggleAlgorithm(algo.label)"
        >
          {{ algo.label }}
        </BaseButton>
      </div>
    </Panel>

    <Panel :title="t('output')">
      <div p-5 flex="~ col gap-3">
        <TextInput
          v-for="algo in ALGORITHMS.filter(a => enabled.includes(a.label))" :key="algo.label"
          :label="algo.label"
          :model-value="results[algo.label] ?? ''"
          readonly
          :copyable="true"
        />
      </div>
    </Panel>
  </div>
</template>
