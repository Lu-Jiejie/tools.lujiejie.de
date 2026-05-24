<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'chmod-tool',
  name: 'Chmod Calculator',
  nameZh: 'Chmod 权限计算',
  description: 'Parse and generate Unix file permissions in octal and symbolic notation.',
  descriptionZh: '解析和生成 Unix 文件权限，支持八进制和符号表示法。',
  category: 'dev',
  keywords: ['chmod', 'permission', 'unix', 'linux', 'file', 'octal'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import BaseButton from '~/components/BaseButton.vue'
import LabelField from '~/components/container/LabelField.vue'
import Panel from '~/components/container/Panel.vue'
import SelectInput from '~/components/SelectInput.vue'
import TextInput from '~/components/TextInput.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  permission: ['Permission', '权限'],
  generator: ['Generator', '生成器'],
  placeholder: ['e.g. 755 or rwxr-xr-x', '例如 755 或 rwxr-xr-x'],
  owner: ['Owner', '所有者'],
  group: ['Group', '组'],
  others: ['Others', '其他'],
  read: ['Read', '读'],
  write: ['Write', '写'],
  execute: ['Execute', '执行'],
  octal: ['Octal', '八进制'],
  symbolic: ['Symbolic', '符号'],
  description: ['Description', '描述'],
  copy: ['Copy', '复制'],
  preset: ['Preset', '预设'],
  command: ['Command', '命令'],
})

const PRESET_PLACEHOLDER = '__none__'

const PRESETS = [
  { label: '--', value: PRESET_PLACEHOLDER },
  { label: '777 (rwxrwxrwx)', value: '777' },
  { label: '755 (rwxr-xr-x)', value: '755' },
  { label: '750 (rwxr-x---)', value: '750' },
  { label: '700 (rwx------)', value: '700' },
  { label: '666 (rw-rw-rw-)', value: '666' },
  { label: '644 (rw-r--r--)', value: '644' },
  { label: '640 (rw-r-----)', value: '640' },
  { label: '600 (rw-------)', value: '600' },
  { label: '555 (r-xr-xr-x)', value: '555' },
  { label: '444 (r--r--r--)', value: '444' },
  { label: '400 (r--------)', value: '400' },
]

const perms = reactive({
  owner: { read: true, write: true, execute: true },
  group: { read: true, write: false, execute: true },
  others: { read: true, write: false, execute: true },
})

const ROLES = ['owner', 'group', 'others'] as const
const PERM_BITS = ['read', 'write', 'execute'] as const

function roleToOctal(role: { read: boolean, write: boolean, execute: boolean }): number {
  return (role.read ? 4 : 0) + (role.write ? 2 : 0) + (role.execute ? 1 : 0)
}

function octalToRole(n: number): { read: boolean, write: boolean, execute: boolean } {
  return { read: !!(n & 4), write: !!(n & 2), execute: !!(n & 1) }
}

const octal = computed(() => {
  return `${roleToOctal(perms.owner)}${roleToOctal(perms.group)}${roleToOctal(perms.others)}`
})

const symbolic = computed(() => {
  function roleToSymbolic(role: { read: boolean, write: boolean, execute: boolean }) {
    return `${role.read ? 'r' : '-'}${role.write ? 'w' : '-'}${role.execute ? 'x' : '-'}`
  }
  return `${roleToSymbolic(perms.owner)}${roleToSymbolic(perms.group)}${roleToSymbolic(perms.others)}`
})

const humanDescription = computed(() => {
  function describeRole(role: { read: boolean, write: boolean, execute: boolean }, roleName: string): string {
    const parts: string[] = []
    if (role.read)
      parts.push(t('read'))
    if (role.write)
      parts.push(t('write'))
    if (role.execute)
      parts.push(t('execute'))
    if (parts.length === 0)
      return `${roleName}: -`
    return `${roleName}: ${parts.join(' + ')}`
  }
  return [
    describeRole(perms.owner, t('owner')),
    describeRole(perms.group, t('group')),
    describeRole(perms.others, t('others')),
  ].join('  |  ')
})

const command = computed(() => `chmod ${octal.value} <file>`)

const presetValue = computed(() => {
  return PRESETS.find(p => p.value === octal.value)?.value || PRESET_PLACEHOLDER
})

const manualInput = reactive({ value: '', editing: false })
const symbolicInput = reactive({ value: '', editing: false })

function applyOctal(str: string) {
  if (!/^[0-7]{3}$/.test(str))
    return
  const [o, g, ot] = str.split('').map(Number)
  Object.assign(perms.owner, octalToRole(o))
  Object.assign(perms.group, octalToRole(g))
  Object.assign(perms.others, octalToRole(ot))
}

function applySymbolic(str: string) {
  if (!/^(?:[r-][w-][x-]){3}$/.test(str))
    return

  const toRole = (chunk: string) => ({
    read: chunk[0] === 'r',
    write: chunk[1] === 'w',
    execute: chunk[2] === 'x',
  })

  Object.assign(perms.owner, toRole(str.slice(0, 3)))
  Object.assign(perms.group, toRole(str.slice(3, 6)))
  Object.assign(perms.others, toRole(str.slice(6, 9)))
}

function updateManualOctal(value: string) {
  manualInput.value = value
  if (manualInput.value.length === 3)
    applyOctal(manualInput.value)
}

function updateManualSymbolic(value: string) {
  symbolicInput.value = value
  if (symbolicInput.value.length === 9)
    applySymbolic(symbolicInput.value)
}

function stopManualEdit() {
  manualInput.editing = false
  manualInput.value = octal.value
}

function stopSymbolicEdit() {
  symbolicInput.editing = false
  symbolicInput.value = symbolic.value
}

function applyPreset(value: string | undefined) {
  if (!value || value === PRESET_PLACEHOLDER)
    return
  applyOctal(value)
}

function togglePerm(role: typeof ROLES[number], perm: typeof PERM_BITS[number]) {
  perms[role][perm] = !perms[role][perm]
}

function copyCommand() {
  navigator.clipboard.writeText(command.value)
}

watch(octal, (val) => {
  if (!manualInput.editing)
    manualInput.value = val
})

watch(symbolic, (val) => {
  if (!symbolicInput.editing)
    symbolicInput.value = val
})

manualInput.value = octal.value
symbolicInput.value = symbolic.value
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('permission')">
      <div p-5 flex="~ col gap-4">
        <div flex="~ gap-3 wrap" items-end>
          <LabelField :label="t('preset')">
            <SelectInput
              :model-value="presetValue"
              :options="PRESETS"
              @update:model-value="applyPreset"
            />
          </LabelField>
          <!-- <BaseButton icon="i-carbon-copy" @click="copyOctal">
            {{ t('copy') }}
          </BaseButton> -->
        </div>
        <div flex="~ gap-4 justify-center wrap">
          <div flex="[1_1_10rem]" min-w-0>
            <LabelField :label="t('octal')">
              <TextInput
                :model-value="manualInput.value"
                :allowed-chars="/[0-7]/"
                :maxlength="3"
                pattern="[0-7]{3}"
                :copyable="false"
                inputmode="numeric"
                autocomplete="off"
                size="lg"
                align="center"
                tracking="widest"
                tabular
                @focus="manualInput.editing = true"
                @blur="stopManualEdit"
                @update:model-value="updateManualOctal"
              />
            </LabelField>
          </div>
          <div flex="[2_1_16rem]" min-w-0>
            <LabelField :label="t('symbolic')">
              <TextInput
                :model-value="symbolicInput.value"
                :allowed-chars="/[rwx-]/"
                :maxlength="9"
                pattern="[rwx\-]{9}"
                :copyable="false"
                normalize="lowercase"
                autocomplete="off"
                size="lg"
                align="center"
                tracking="widest"
                @focus="symbolicInput.editing = true"
                @blur="stopSymbolicEdit"
                @update:model-value="updateManualSymbolic"
              />
            </LabelField>
          </div>
        </div>
        <div text-sm text-center op-60>
          {{ humanDescription }}
        </div>
        <div flex justify-center>
          <BaseButton icon="i-carbon-copy" @click="copyCommand">
            {{ command }}
          </BaseButton>
        </div>
      </div>
    </Panel>

    <Panel :title="t('generator')">
      <div p-5 flex="~ col gap-4" items-center>
        <div flex="~ col gap-3">
          <div flex="~ gap-3" items-center>
            <span shrink-0 w-16 />
            <div flex="~ gap-2">
              <span v-for="perm in PERM_BITS" :key="perm" text-xs tracking-wide font-medium text-center op-60 select-none uppercase>
                {{ t(perm) }}
              </span>
            </div>
          </div>
          <div
            v-for="role in ROLES" :key="role"
            flex="~ gap-2" items-center
          >
            <span text-xs tracking-wide font-medium text-right op-60 shrink-0 w-16 select-none uppercase>{{ t(role) }}</span>
            <div flex="~ gap-2">
              <BaseButton
                v-for="perm in PERM_BITS" :key="perm"
                :active="perms[role][perm]"
                class="font-mono size-9.5!"
                @click="togglePerm(role, perm)"
              >
                {{ perm === 'read' ? 'R' : perm === 'write' ? 'W' : 'X' }}
              </BaseButton>
            </div>
            <span text-sm font-mono ml-2 op-50>{{ roleToOctal(perms[role]) }}</span>
          </div>
        </div>
      </div>
    </Panel>
  </div>
</template>
