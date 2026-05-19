<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'uuid-generator',
  name: 'UUID Generator',
  nameZh: 'UUID 生成',
  description: 'Generate UUIDs in multiple versions (NIL, v1, v3, v4, v5).',
  descriptionZh: '支持多版本（NIL、v1、v3、v4、v5）的 UUID 生成器。',
  category: 'generate',
  keywords: ['uuid', 'guid', 'random', 'id', 'unique'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import BaseButton from '~/components/BaseButton.vue'
import Panel from '~/components/container/Panel.vue'
import NumberInput from '~/components/NumberInput.vue'
import SelectInput from '~/components/SelectInput.vue'
import TextInput from '~/components/TextInput.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  settings_label: ['Settings', '设置'],
  output_label: ['Output', '输出'],
  generate: ['Generate', '生成'],
  count: ['Count', '数量'],
  uppercase: ['Uppercase', '大写'],
  no_hyphens: ['No Hyphens', '无连字符'],
  version: ['Version', '版本'],
  namespace: ['Namespace', '命名空间'],
  name_input: ['Name', '名称'],
  name_placeholder: ['Enter name for hashing', '输入用于哈希的名称'],
  custom_ns: ['Custom namespace UUID', '自定义命名空间 UUID'],
})

type UUIDVersion = 'nil' | 'v1' | 'v3' | 'v4' | 'v5'

const VERSION_OPTIONS = [
  { label: 'v4 (Random)', value: 'v4' },
  { label: 'v1 (Timestamp)', value: 'v1' },
  { label: 'v5 (SHA-1)', value: 'v5' },
  { label: 'v3 (MD5)', value: 'v3' },
  { label: 'NIL', value: 'nil' },
]

const NS_OPTIONS = [
  { label: 'DNS', value: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' },
  { label: 'URL', value: '6ba7b811-9dad-11d1-80b4-00c04fd430c8' },
  { label: 'OID', value: '6ba7b812-9dad-11d1-80b4-00c04fd430c8' },
  { label: 'X500', value: '6ba7b814-9dad-11d1-80b4-00c04fd430c8' },
]

const version = shallowRef<UUIDVersion>('v4')
const count = shallowRef(1)
const uppercase = shallowRef(false)
const noHyphens = shallowRef(false)
const namespace = shallowRef(NS_OPTIONS[0].value)
const hashName = shallowRef('')
const results = shallowRef<string[]>([])

const needsNameInput = computed(() => version.value === 'v3' || version.value === 'v5')

function formatUUID(uuid: string): string {
  if (noHyphens.value)
    uuid = uuid.replaceAll('-', '')
  if (uppercase.value)
    uuid = uuid.toUpperCase()
  return uuid
}

function generateV1(): string {
  const now = Date.now()
  const gregorianOffset = 122192928000000000n
  const timestamp = BigInt(now) * 10000n + gregorianOffset
  const timeLow = Number(timestamp & 0xFFFFFFFFn)
  const timeMid = Number((timestamp >> 32n) & 0xFFFFn)
  const timeHi = Number((timestamp >> 48n) & 0x0FFFn) | 0x1000
  const clockSeq = (crypto.getRandomValues(new Uint8Array(2))[0] << 8 | crypto.getRandomValues(new Uint8Array(2))[1]) & 0x3FFF | 0x8000
  const node = crypto.getRandomValues(new Uint8Array(6))
  node[0] |= 0x01

  const hex = (n: number, len: number) => n.toString(16).padStart(len, '0')
  const nodeHex = Array.from(node).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${hex(timeLow, 8)}-${hex(timeMid, 4)}-${hex(timeHi, 4)}-${hex(clockSeq, 4)}-${nodeHex}`
}

function md5(input: Uint8Array): Uint8Array {
  function leftRotate(x: number, c: number) {
    return (x << c) | (x >>> (32 - c))
  }
  const s = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21]
  const K = Array.from({ length: 64 }, (_, i) => Math.floor(2 ** 32 * Math.abs(Math.sin(i + 1))) >>> 0)

  const msgLen = input.length
  const bitLen = msgLen * 8
  const padLen = ((56 - (msgLen + 1) % 64) + 64) % 64
  const padded = new Uint8Array(msgLen + 1 + padLen + 8)
  padded.set(input)
  padded[msgLen] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(padded.length - 8, bitLen >>> 0, true)
  view.setUint32(padded.length - 4, Math.floor(bitLen / 2 ** 32) >>> 0, true)

  let a0 = 0x67452301
  let b0 = 0xEFCDAB89
  let c0 = 0x98BADCFE
  let d0 = 0x10325476

  for (let i = 0; i < padded.length; i += 64) {
    const M = Array.from({ length: 16 }, (_, j) => view.getUint32(i + j * 4, true))
    let A = a0
    let B = b0
    let C = c0
    let D = d0
    for (let j = 0; j < 64; j++) {
      let F: number, g: number
      if (j < 16) {
        F = (B & C) | (~B & D)
        g = j
      }
      else if (j < 32) {
        F = (D & B) | (~D & C)
        g = (5 * j + 1) % 16
      }
      else if (j < 48) {
        F = B ^ C ^ D
        g = (3 * j + 5) % 16
      }
      else {
        F = C ^ (B | ~D)
        g = (7 * j) % 16
      }
      F = (F + A + K[j] + M[g]) >>> 0
      A = D
      D = C
      C = B
      B = (B + leftRotate(F, s[j])) >>> 0
    }
    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }

  const result = new Uint8Array(16)
  const rv = new DataView(result.buffer)
  rv.setUint32(0, a0, true)
  rv.setUint32(4, b0, true)
  rv.setUint32(8, c0, true)
  rv.setUint32(12, d0, true)
  return result
}

async function sha1(input: Uint8Array): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest('SHA-1', input)
  return new Uint8Array(hash)
}

function parseUUIDToBytes(uuid: string): Uint8Array {
  const hex = uuid.replaceAll('-', '')
  const bytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++)
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

function bytesToUUID(bytes: Uint8Array): string {
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

function generateV3(ns: string, name: string): string {
  const nsBytes = parseUUIDToBytes(ns)
  const nameBytes = new TextEncoder().encode(name)
  const input = new Uint8Array(nsBytes.length + nameBytes.length)
  input.set(nsBytes)
  input.set(nameBytes, nsBytes.length)
  const hash = md5(input)
  hash[6] = (hash[6] & 0x0F) | 0x30
  hash[8] = (hash[8] & 0x3F) | 0x80
  return bytesToUUID(hash)
}

async function generateV5(ns: string, name: string): Promise<string> {
  const nsBytes = parseUUIDToBytes(ns)
  const nameBytes = new TextEncoder().encode(name)
  const input = new Uint8Array(nsBytes.length + nameBytes.length)
  input.set(nsBytes)
  input.set(nameBytes, nsBytes.length)
  const hash = await sha1(input)
  const bytes = hash.slice(0, 16)
  bytes[6] = (bytes[6] & 0x0F) | 0x50
  bytes[8] = (bytes[8] & 0x3F) | 0x80
  return bytesToUUID(bytes)
}

async function generate() {
  const n = Math.max(1, Math.min(count.value, 50))

  if (version.value === 'nil') {
    results.value = [formatUUID('00000000-0000-0000-0000-000000000000')]
    return
  }

  const uuids: string[] = []
  for (let i = 0; i < n; i++) {
    let uuid: string
    switch (version.value) {
      case 'v1':
        uuid = generateV1()
        break
      case 'v3':
        uuid = generateV3(namespace.value, hashName.value || String(i))
        break
      case 'v4':
        uuid = crypto.randomUUID()
        break
      case 'v5':
        uuid = await generateV5(namespace.value, hashName.value || String(i))
        break
      default:
        uuid = crypto.randomUUID()
    }
    uuids.push(formatUUID(uuid))
  }
  results.value = uuids
}

watch([version, uppercase, noHyphens], () => generate())
generate()
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('settings_label')">
      <div p-5 flex="~ col gap-4">
        <div flex="~ gap-3 wrap" items-end>
          <div flex="~ col gap-1">
            <label text-xs tracking-wide font-medium op-60 select-none uppercase>{{ t('version') }}</label>
            <SelectInput v-model="version" :options="VERSION_OPTIONS" />
          </div>
          <div v-if="version !== 'nil'" flex="~ col gap-1">
            <label text-xs tracking-wide font-medium op-60 select-none uppercase>{{ t('count') }}</label>
            <NumberInput v-model="count" :min="1" :max="50" />
          </div>
          <BaseButton :active="uppercase" @click="uppercase = !uppercase">
            {{ t('uppercase') }}
          </BaseButton>
          <BaseButton :active="noHyphens" @click="noHyphens = !noHyphens">
            {{ t('no_hyphens') }}
          </BaseButton>
          <BaseButton icon="i-material-symbols-refresh" @click="generate">
            {{ t('generate') }}
          </BaseButton>
        </div>

        <template v-if="needsNameInput">
          <div flex="~ col gap-1">
            <span text-xs tracking-wide font-medium op-60 select-none uppercase>{{ t('namespace') }}</span>
            <SelectInput v-model="namespace" :options="NS_OPTIONS" />
          </div>
          <TextInput
            v-model="hashName" :label="t('name_input')" :placeholder="t('name_placeholder')"
            :copyable="false"
          />
        </template>
      </div>
    </Panel>

    <Panel :title="t('output_label')">
      <div p-5 flex="~ col gap-3">
        <TextInput v-for="(uuid, i) in results" :key="i" :model-value="uuid" readonly />
      </div>
    </Panel>
  </div>
</template>
