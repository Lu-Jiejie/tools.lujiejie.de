<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'keycode',
  name: 'KeyCode Viewer',
  nameZh: '键值查看器',
  description: 'Press any key to view its keyCode, key, code, and other keyboard event properties.',
  descriptionZh: '按下任意键查看对应的键值、key、code 等键盘事件属性。',
  category: 'dev',
  keywords: ['keycode', 'keyboard', 'key', 'event', 'code'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef } from 'vue'
import Panel from '~/components/container/Panel.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  hint: ['Press any key...', '按下任意键...'],
  key: ['Key', '键值'],
  code: ['Code', '代码'],
  keyCode: ['KeyCode', '键码'],
  which: ['Which', 'Which'],
  location: ['Location', '位置'],
  repeat: ['Repeat', '重复'],
  location_standard: ['Standard', '标准'],
  location_left: ['Left', '左侧'],
  location_right: ['Right', '右侧'],
  location_numpad: ['Numpad', '数字键盘'],
})

interface KeyInfo {
  key: string
  code: string
  keyCode: number
  which: number
  location: number
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  metaKey: boolean
  repeat: boolean
}

const keyInfo = shallowRef<KeyInfo | null>(null)
const history = shallowRef<KeyInfo[]>([])

function getLocationLabel(location: number): string {
  switch (location) {
    case 0: return t('location_standard')
    case 1: return t('location_left')
    case 2: return t('location_right')
    case 3: return t('location_numpad')
    default: return String(location)
  }
}

function getKeyLabel(key: string): string {
  const map: Record<string, string> = {
    ' ': 'Space',
    'Control': 'Ctrl',
    'Meta': 'Win',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Escape': 'Esc',
    'Backspace': '⌫',
    'Delete': 'Del',
    'Enter': 'Enter',
    'Tab': 'Tab',
    'CapsLock': 'Caps',
  }
  return map[key] ?? key
}

const comboDisplay = computed(() => {
  if (!keyInfo.value)
    return []
  const parts: string[] = []
  const info = keyInfo.value
  if (info.ctrlKey && info.key !== 'Control')
    parts.push('Ctrl')
  if (info.shiftKey && info.key !== 'Shift')
    parts.push('Shift')
  if (info.altKey && info.key !== 'Alt')
    parts.push('Alt')
  if (info.metaKey && info.key !== 'Meta')
    parts.push('Win')
  parts.push(getKeyLabel(info.key))
  return parts
})

function handleKeyDown(e: KeyboardEvent) {
  e.preventDefault()
  const info: KeyInfo = {
    key: e.key,
    code: e.code,
    keyCode: e.keyCode,
    which: e.which,
    location: e.location,
    ctrlKey: e.ctrlKey,
    shiftKey: e.shiftKey,
    altKey: e.altKey,
    metaKey: e.metaKey,
    repeat: e.repeat,
  }
  keyInfo.value = info
  if (!e.repeat) {
    history.value = [info, ...history.value.slice(0, 4)]
  }
}

function getComboLabel(info: KeyInfo): string {
  const parts: string[] = []
  if (info.ctrlKey && info.key !== 'Control')
    parts.push('Ctrl')
  if (info.shiftKey && info.key !== 'Shift')
    parts.push('Shift')
  if (info.altKey && info.key !== 'Alt')
    parts.push('Alt')
  if (info.metaKey && info.key !== 'Meta')
    parts.push('Win')
  parts.push(getKeyLabel(info.key))
  return parts.join(' + ')
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div flex="~ col gap-4">
    <Panel>
      <div flex="~ col" p-8 min-h-52 items-center justify-center>
        <template v-if="keyInfo">
          <div flex="~ gap-2" mb-6 items-center>
            <template v-for="(part, i) in comboDisplay" :key="i">
              <span v-if="i > 0" text-2xl font-light op-40 select-none>+</span>
              <span border="~ c-border" text-xl font-mono font-semibold px-4 py-2 border-b-3 rounded-lg inline-flex min-w-12 select-none items-center justify-center :style="{ background: 'linear-gradient(to bottom, var(--c-raised), var(--c-surface))', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }">{{ part }}</span>
            </template>
          </div>
          <div grid="~ cols-2 sm:cols-4 gap-3" max-w-2xl w-full>
            <div flex="~ col" border="~ c-border" p-3 rounded-xl bg-c-raised items-center>
              <span text-xs tracking-wide mb-1 op-50 uppercase>{{ t('key') }}</span>
              <span text-sm font-medium font-mono>{{ keyInfo.key === ' ' ? '" "' : keyInfo.key }}</span>
            </div>
            <div flex="~ col" border="~ c-border" p-3 rounded-xl bg-c-raised items-center>
              <span text-xs tracking-wide mb-1 op-50 uppercase>{{ t('code') }}</span>
              <span text-sm font-medium font-mono>{{ keyInfo.code }}</span>
            </div>
            <div flex="~ col" border="~ c-border" p-3 rounded-xl bg-c-raised items-center>
              <span text-xs tracking-wide mb-1 op-50 uppercase>{{ t('keyCode') }}</span>
              <span text-sm font-medium font-mono>{{ keyInfo.keyCode }}</span>
            </div>
            <div flex="~ col" border="~ c-border" p-3 rounded-xl bg-c-raised items-center>
              <span text-xs tracking-wide mb-1 op-50 uppercase>{{ t('which') }}</span>
              <span text-sm font-medium font-mono>{{ keyInfo.which }}</span>
            </div>
            <div flex="~ col" border="~ c-border" p-3 rounded-xl bg-c-raised items-center>
              <span text-xs tracking-wide mb-1 op-50 uppercase>{{ t('location') }}</span>
              <span text-sm font-medium font-mono>{{ getLocationLabel(keyInfo.location) }}</span>
            </div>
            <div flex="~ col" border="~ c-border" p-3 rounded-xl bg-c-raised items-center>
              <span text-xs tracking-wide mb-1 op-50 uppercase>{{ t('repeat') }}</span>
              <span text-sm font-medium font-mono>{{ keyInfo.repeat ? 'Yes' : 'No' }}</span>
            </div>
          </div>
        </template>
        <div v-else text-lg op-40 select-none>
          {{ t('hint') }}
        </div>
      </div>
    </Panel>

    <Panel v-if="history.length > 0" title="History">
      <div p-4 overflow-x-auto>
        <table text-sm font-mono w-full>
          <thead>
            <tr border="b c-border" text-xs tracking-wide op-50 uppercase>
              <th p-2 text-left>
                {{ t('key') }}
              </th>
              <th p-2 text-left>
                {{ t('code') }}
              </th>
              <th p-2 text-left>
                {{ t('keyCode') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in history" :key="i" border="b c-border last:b-0">
              <td p-2>
                {{ getComboLabel(item) }}
              </td>
              <td p-2>
                {{ item.code }}
              </td>
              <td p-2>
                {{ item.keyCode }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
  </div>
</template>
