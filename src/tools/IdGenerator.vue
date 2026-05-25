<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'id-generator',
  name: 'ID Generator',
  nameZh: 'ID 生成器',
  description: 'Generate UUID, ULID, NanoID, ObjectId, and Snowflake IDs in batches.',
  descriptionZh: '批量生成 UUID、ULID、NanoID、ObjectId 和 Snowflake ID。',
  category: 'generate',
  keywords: ['uuid', 'ulid', 'nanoid', 'objectid', 'snowflake', 'guid', 'random', 'id', 'unique'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import BaseButton from '~/components/BaseButton.vue'
import CollapsibleExplainer from '~/components/container/CollapsibleExplainer.vue'
import LabelField from '~/components/container/LabelField.vue'
import Panel from '~/components/container/Panel.vue'
import CustomSelect from '~/components/CustomSelect.vue'
import NumberInput from '~/components/NumberInput.vue'
import TextInput from '~/components/TextInput.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  settings_label: ['Settings', '设置'],
  output_label: ['Output', '输出'],
  generate: ['Generate', '生成'],
  copy_all: ['Copy All', '复制全部'],
  copied: ['Copied', '已复制'],
  count: ['Count', '数量'],
  type: ['Type', '类型'],
  uppercase: ['Uppercase', '大写'],
  no_hyphens: ['No Hyphens', '无连字符'],
  version: ['UUID Version', 'UUID 版本'],
  namespace: ['Namespace', '命名空间'],
  name_input: ['Name', '名称'],
  name_placeholder: ['Enter name for hashing', '输入用于哈希的名称'],
  nano_length: ['NanoID Length', 'NanoID 长度'],
  worker_id: ['Worker ID', 'Worker ID'],
  datacenter_id: ['Datacenter ID', 'Datacenter ID'],
  how_it_works: ['How It Works', '工作原理'],
  how_1_title: ['ID types', 'ID 类型'],
  how_1_desc: [
    'UUID v4 and NanoID are mostly random. UUID v3/v5 always return the same ID for the same namespace and name.',
    'UUID v4 和 NanoID 主要靠随机数。UUID v3/v5 则相反，同一组命名空间和名称会得到同一个 ID。',
  ],
  how_2_title: ['Time data', '时间数据'],
  how_2_desc: [
    'ULID, ObjectId, Snowflake, and UUID v1 put time into the ID, so newer values usually sort after older ones.',
    'ULID、ObjectId、Snowflake 和 UUID v1 会把时间放进 ID 里，所以新生成的值通常会排在旧值后面。',
  ],
  how_3_title: ['Hide time', '隐藏时间'],
  how_3_desc: [
    'If the creation time should stay hidden, avoid time-based IDs and use UUID v4 or NanoID instead.',
    '如果不想让别人从 ID 里看出创建时间，就用 UUID v4 或 NanoID。',
  ],
  how_4_title: ['Snowflake bits', 'Snowflake 位段'],
  how_4_desc: [
    'Snowflake uses time, datacenter ID, worker ID, and a sequence number. Do not reuse the same worker settings on two generators.',
    'Snowflake 用时间、Datacenter ID、Worker ID 和序列号拼出 ID。两台生成器不要用同一组 Worker 配置。',
  ],
})

type IdType = 'uuid' | 'ulid' | 'nanoid' | 'objectid' | 'snowflake'
type UUIDVersion = 'nil' | 'v1' | 'v3' | 'v4' | 'v5'

const TYPE_OPTIONS: { label: string, value: IdType }[] = [
  { label: 'UUID', value: 'uuid' },
  { label: 'ULID', value: 'ulid' },
  { label: 'NanoID', value: 'nanoid' },
  { label: 'ObjectId', value: 'objectid' },
  { label: 'Snowflake', value: 'snowflake' },
]

const UUID_VERSION_OPTIONS: { label: string, value: UUIDVersion }[] = [
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

const CROCKFORD32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const NANOID_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-'
const SNOWFLAKE_EPOCH = 1577836800000n

const idType = shallowRef<IdType>('uuid')
const uuidVersion = shallowRef<UUIDVersion>('v4')
const count = shallowRef(10)
const uppercase = shallowRef(false)
const noHyphens = shallowRef(false)
const namespace = shallowRef(NS_OPTIONS[0].value)
const hashName = shallowRef('')
const nanoLength = shallowRef(21)
const workerId = shallowRef(1)
const datacenterId = shallowRef(1)
const results = shallowRef<string[]>([])
const copiedAll = shallowRef(false)

let objectIdCounter = randomInt(0x1000000)
let snowflakeSequence = 0n
let lastSnowflakeTimestamp = 0n

const needsNameInput = computed(() => idType.value === 'uuid' && (uuidVersion.value === 'v3' || uuidVersion.value === 'v5'))
const outputText = computed(() => results.value.join('\n'))
const explainItems = computed(() => [
  { title: t('how_1_title'), description: t('how_1_desc') },
  { title: t('how_2_title'), description: t('how_2_desc') },
  { title: t('how_3_title'), description: t('how_3_desc') },
  { title: t('how_4_title'), description: t('how_4_desc') },
])

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length))
}

function randomInt(maxExclusive: number): number
function randomInt(min: number, maxExclusive: number): number
function randomInt(a: number, b?: number): number {
  const min = b === undefined ? 0 : a
  const maxExclusive = b === undefined ? a : b
  const range = maxExclusive - min
  const max = Math.floor(0x100000000 / range) * range
  const bytes = new Uint32Array(1)

  do {
    crypto.getRandomValues(bytes)
  } while (bytes[0] >= max)

  return min + (bytes[0] % range)
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

function formatUUID(uuid: string): string {
  if (noHyphens.value)
    uuid = uuid.replaceAll('-', '')
  if (uppercase.value)
    uuid = uuid.toUpperCase()
  return uuid
}

function formatHexId(id: string): string {
  return uppercase.value ? id.toUpperCase() : id
}

function generateV1(): string {
  const gregorianOffset = 122192928000000000n
  const timestamp = BigInt(Date.now()) * 10000n + gregorianOffset
  const timeLow = Number(timestamp & 0xFFFFFFFFn)
  const timeMid = Number((timestamp >> 32n) & 0xFFFFn)
  const timeHi = Number((timestamp >> 48n) & 0x0FFFn) | 0x1000
  const clockSeq = randomInt(0x4000) | 0x8000
  const node = randomBytes(6)
  node[0] |= 0x01

  const hex = (n: number, len: number) => n.toString(16).padStart(len, '0')
  return `${hex(timeLow, 8)}-${hex(timeMid, 4)}-${hex(timeHi, 4)}-${hex(clockSeq, 4)}-${bytesToHex(node)}`
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
  const hash = await crypto.subtle.digest('SHA-1', input as BufferSource)
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
  const hex = bytesToHex(bytes)
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

function encodeBase32(value: bigint, length: number): string {
  let output = ''
  for (let i = length - 1; i >= 0; i--) {
    const index = Number((value >> BigInt(i * 5)) & 31n)
    output += CROCKFORD32[index]
  }
  return output
}

function generateULID(): string {
  const timestamp = encodeBase32(BigInt(Date.now()), 10)
  const random = randomBytes(10)
  let randomValue = 0n
  for (const byte of random)
    randomValue = (randomValue << 8n) | BigInt(byte)
  return `${timestamp}${encodeBase32(randomValue, 16)}`
}

function generateNanoID(length: number): string {
  return Array.from({ length }, () => NANOID_ALPHABET[randomInt(NANOID_ALPHABET.length)]).join('')
}

function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0')
  const random = bytesToHex(randomBytes(5))
  objectIdCounter = (objectIdCounter + 1) % 0x1000000
  const counter = objectIdCounter.toString(16).padStart(6, '0')
  return formatHexId(`${timestamp}${random}${counter}`)
}

function generateSnowflake(): string {
  const now = BigInt(Date.now())
  if (now === lastSnowflakeTimestamp) {
    snowflakeSequence = (snowflakeSequence + 1n) & 0xFFFn
  }
  else {
    snowflakeSequence = 0n
    lastSnowflakeTimestamp = now
  }

  const id = ((now - SNOWFLAKE_EPOCH) << 22n)
    | ((BigInt(datacenterId.value) & 0x1Fn) << 17n)
    | ((BigInt(workerId.value) & 0x1Fn) << 12n)
    | snowflakeSequence
  return id.toString()
}

async function generateOne(index: number): Promise<string> {
  switch (idType.value) {
    case 'uuid':
      return generateUUID(index)
    case 'ulid':
      return generateULID()
    case 'nanoid':
      return generateNanoID(nanoLength.value)
    case 'objectid':
      return generateObjectId()
    case 'snowflake':
      return generateSnowflake()
  }
}

async function generateUUID(index: number): Promise<string> {
  if (uuidVersion.value === 'nil')
    return formatUUID('00000000-0000-0000-0000-000000000000')

  switch (uuidVersion.value) {
    case 'v1':
      return formatUUID(generateV1())
    case 'v3':
      return formatUUID(generateV3(namespace.value, hashName.value || String(index)))
    case 'v4':
      return formatUUID(crypto.randomUUID())
    case 'v5':
      return formatUUID(await generateV5(namespace.value, hashName.value || String(index)))
    default:
      return formatUUID(crypto.randomUUID())
  }
}

async function generate() {
  const size = idType.value === 'uuid' && uuidVersion.value === 'nil'
    ? 1
    : Math.max(1, Math.min(count.value, 100))

  const ids: string[] = []
  for (let i = 0; i < size; i++)
    ids.push(await generateOne(i))
  results.value = ids
}

async function copyAll() {
  if (!outputText.value)
    return

  await navigator.clipboard.writeText(outputText.value)
  copiedAll.value = true
  setTimeout(() => (copiedAll.value = false), 1500)
}

watch([
  idType,
  uuidVersion,
  count,
  uppercase,
  noHyphens,
  namespace,
  hashName,
  nanoLength,
  workerId,
  datacenterId,
], () => {
  void generate()
})

void generate()
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('settings_label')">
      <div p-5 flex="~ col gap-4">
        <div flex="~ gap-3 wrap" items-end>
          <LabelField :label="t('type')">
            <CustomSelect v-model="idType" :options="TYPE_OPTIONS" />
          </LabelField>

          <LabelField v-if="idType === 'uuid'" :label="t('version')">
            <CustomSelect v-model="uuidVersion" :options="UUID_VERSION_OPTIONS" />
          </LabelField>

          <LabelField :label="t('count')">
            <NumberInput v-model="count" :min="1" :max="100" />
          </LabelField>

          <LabelField v-if="idType === 'nanoid'" :label="t('nano_length')">
            <NumberInput v-model="nanoLength" :min="4" :max="64" />
          </LabelField>

          <LabelField v-if="idType === 'snowflake'" :label="t('datacenter_id')">
            <NumberInput v-model="datacenterId" :min="0" :max="31" />
          </LabelField>

          <LabelField v-if="idType === 'snowflake'" :label="t('worker_id')">
            <NumberInput v-model="workerId" :min="0" :max="31" />
          </LabelField>

          <BaseButton
            v-if="idType === 'uuid' || idType === 'objectid'"
            :active="uppercase"
            @click="uppercase = !uppercase"
          >
            {{ t('uppercase') }}
          </BaseButton>

          <BaseButton
            v-if="idType === 'uuid'"
            :active="noHyphens"
            @click="noHyphens = !noHyphens"
          >
            {{ t('no_hyphens') }}
          </BaseButton>

          <BaseButton icon="i-material-symbols-refresh" @click="generate">
            {{ t('generate') }}
          </BaseButton>
        </div>

        <template v-if="needsNameInput">
          <LabelField :label="t('namespace')">
            <CustomSelect v-model="namespace" :options="NS_OPTIONS" />
          </LabelField>

          <LabelField :label="t('name_input')">
            <TextInput
              v-model="hashName"
              :placeholder="t('name_placeholder')"
              :copyable="false"
            />
          </LabelField>
        </template>
      </div>
    </Panel>

    <Panel :title="t('output_label')">
      <div p-5 flex="~ col gap-3">
        <div flex="~ gap-2 wrap" items-center justify-end>
          <!-- <div text-sm op-60>
            {{ results.length }} {{ t('count') }}
          </div> -->

          <BaseButton icon="i-carbon-copy" :disabled="!outputText" @click="copyAll">
            {{ copiedAll ? t('copied') : t('copy_all') }}
          </BaseButton>
        </div>

        <TextInput
          v-for="(id, i) in results"
          :key="`${id}-${i}`"
          :model-value="id"
          readonly
        />
      </div>
    </Panel>

    <CollapsibleExplainer
      :title="t('how_it_works')"
      :items="explainItems"
    />
  </div>
</template>
