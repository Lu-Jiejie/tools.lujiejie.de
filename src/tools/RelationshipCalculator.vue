<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'relationship-calculator',
  name: 'Relationship Calculator',
  nameZh: '亲戚关系计算器',
  description: 'Calculate Chinese kinship titles, reverse lookups, and relationships between two people.',
  descriptionZh: '计算中国亲戚称谓、逆向查找关系链，以及两人之间的称呼与合称。',
  category: 'utility',
  keywords: ['relationship', 'kinship', 'family', 'chinese', '亲戚', '称谓', '关系', '家庭'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import relationship from 'relationship.js'
import { computed, shallowRef } from 'vue'
import LabelField from '~/components/container/LabelField.vue'
import Panel from '~/components/container/Panel.vue'
import BaseButton from '~/components/input/BaseButton.vue'
import TextInput from '~/components/input/TextInput.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  tab_title_to_name: ['Relation → Title', '关系找称呼'],
  tab_name_to_chain: ['Title → Relation', '称呼找关系'],
  tab_between_title: ['Title Between Two', '两者间称呼'],
  tab_between_pair: ['Pair Between Two', '两者间合称'],

  result_label: ['Result', '结果'],
  result_i_call: ['I call them', '我称呼对方'],
  result_they_call: ['They call me', '对方称呼我'],
  result_a_call_b: ['A calls B', '甲称呼乙'],
  result_b_call_a: ['B calls A', '乙称呼甲'],

  title_input: ['Kinship Title', '称呼'],
  title_placeholder: ['e.g. 舅公', '例如 舅公'],

  person_a: ['Person A', '甲方'],
  person_b: ['Person B', '乙方'],
  person_a_placeholder: ['e.g. 外婆', '例如 外婆'],
  person_b_placeholder: ['e.g. 舅妈', '例如 舅妈'],

  optimal_path: ['Shortest path', '最短路径'],

  clear: ['Clear', '清空'],
  backspace: ['←', '←'],
  path_empty: ['Click buttons below to build a relation chain', '点击下方按钮构建关系链'],
})

type TabKey = 'title' | 'chain' | 'between_title' | 'between_pair'

const TAB_OPTIONS = computed(() => [
  { label: t('tab_title_to_name'), value: 'title' as TabKey },
  { label: t('tab_name_to_chain'), value: 'chain' as TabKey },
  { label: t('tab_between_title'), value: 'between_title' as TabKey },
  { label: t('tab_between_pair'), value: 'between_pair' as TabKey },
])

// Each relation carries a hue: shown on its gender mark (♂/♀) on the quick
// button, and reused as a tinted tag in the path chain.
const QUICK_BUTTONS = [
  { char: '父', word: '爸爸', sex: 'm', mark: 'text-red-500', tag: 'bg-red-500/12 text-red-600 border-red-500/30' },
  { char: '母', word: '妈妈', sex: 'f', mark: 'text-cyan-500', tag: 'bg-cyan-500/12 text-cyan-600 border-cyan-500/30' },
  { char: '夫', word: '老公', sex: 'm', mark: 'text-orange-500', tag: 'bg-orange-500/12 text-orange-600 border-orange-500/30' },
  { char: '妻', word: '老婆', sex: 'f', mark: 'text-blue-500', tag: 'bg-blue-500/12 text-blue-600 border-blue-500/30' },
  { char: '兄', word: '哥哥', sex: 'm', mark: 'text-amber-500', tag: 'bg-amber-500/12 text-amber-600 border-amber-500/30' },
  { char: '弟', word: '弟弟', sex: 'm', mark: 'text-violet-500', tag: 'bg-violet-500/12 text-violet-600 border-violet-500/30' },
  { char: '姐', word: '姐姐', sex: 'f', mark: 'text-lime-500', tag: 'bg-lime-500/12 text-lime-600 border-lime-500/30' },
  { char: '妹', word: '妹妹', sex: 'f', mark: 'text-fuchsia-500', tag: 'bg-fuchsia-500/12 text-fuchsia-600 border-fuchsia-500/30' },
  { char: '子', word: '儿子', sex: 'm', mark: 'text-emerald-500', tag: 'bg-emerald-500/12 text-emerald-600 border-emerald-500/30' },
  { char: '女', word: '女儿', sex: 'f', mark: 'text-pink-500', tag: 'bg-pink-500/12 text-pink-600 border-pink-500/30' },
]

const WORD_TAG: Record<string, string> = Object.fromEntries(
  QUICK_BUTTONS.map(b => [b.word, b.tag]),
)
const FALLBACK_TAG = 'bg-c-raised text-c-text border-c-border'
function tagColor(word: string) {
  return WORD_TAG[word] ?? FALLBACK_TAG
}

const activeTab = shallowRef<TabKey>('title')

// Tab 1: relation → title (path stored as array of words)
const t1Path = shallowRef<string[]>([])

// Tab 2: title → chain
const t2Text = shallowRef('舅公')

// Tab 3 & 4: between two
const t3A = shallowRef('外婆')
const t3B = shallowRef('舅妈')
const optimal = shallowRef(false)

const t1TextStr = computed(() => t1Path.value.join('的'))

const WORD_SEX: Record<string, 'm' | 'f'> = Object.fromEntries(
  QUICK_BUTTONS.map(b => [b.word, b.sex as 'm' | 'f']),
)

// Gender of the person at the end of the current chain (null when empty).
const lastSex = computed<'m' | 'f' | null>(() =>
  t1Path.value.length ? WORD_SEX[t1Path.value[t1Path.value.length - 1]] ?? null : null,
)

// Spouse relations carry a gender precondition: a husband attaches only to a
// female, a wife only to a male. A same-gender spouse is impossible
// (e.g. 妻子的妻子). All other relations are valid for anyone.
function isLocked(word: string): boolean {
  if (!lastSex.value)
    return false
  if (word === '老公')
    return lastSex.value === 'm'
  if (word === '老婆')
    return lastSex.value === 'f'
  return false
}

function appendWord(word: string) {
  if (isLocked(word))
    return
  t1Path.value = [...t1Path.value, word]
}

function backspacePath() {
  if (t1Path.value.length > 0)
    t1Path.value = t1Path.value.slice(0, -1)
}

function clearPath() {
  t1Path.value = []
}

function callRelationship(opts: object): string[] {
  try {
    return relationship(opts) as string[]
  }
  catch {
    return []
  }
}

const result1ICall = computed<string[]>(() =>
  t1TextStr.value ? callRelationship({ text: t1TextStr.value, sex: -1, reverse: false }) : [],
)
const result1TheyCalled = computed<string[]>(() =>
  t1TextStr.value ? callRelationship({ text: t1TextStr.value, sex: -1, reverse: true }) : [],
)

const result2 = computed<string[]>(() =>
  t2Text.value.trim() ? callRelationship({ text: t2Text.value, type: 'chain' }) : [],
)

const betweenReady = computed(() => !!(t3A.value.trim() && t3B.value.trim()))

// relationship({ text, target }) returns how `target` addresses `text`.
// 甲称呼乙: 甲 is the caller → target=甲, text=乙.
const result3AB = computed<string[]>(() =>
  betweenReady.value
    ? callRelationship({ text: t3B.value, target: t3A.value, optimal: optimal.value })
    : [],
)
// 乙称呼甲: 乙 is the caller → target=乙, text=甲.
const result3BA = computed<string[]>(() =>
  betweenReady.value
    ? callRelationship({ text: t3A.value, target: t3B.value, optimal: optimal.value })
    : [],
)

const result4 = computed<string[]>(() =>
  betweenReady.value
    ? callRelationship({ text: t3A.value, target: t3B.value, type: 'pair', optimal: optimal.value })
    : [],
)

// Unified result groups so one elegant layout serves every tab.
const resultGroups = computed<{ label: string, items: string[] }[]>(() => {
  if (activeTab.value === 'title') {
    const groups: { label: string, items: string[] }[] = []
    if (result1ICall.value.length)
      groups.push({ label: t('result_i_call'), items: result1ICall.value })
    if (result1TheyCalled.value.length)
      groups.push({ label: t('result_they_call'), items: result1TheyCalled.value })
    return groups
  }
  if (activeTab.value === 'chain')
    return result2.value.length ? [{ label: '', items: result2.value }] : []
  if (activeTab.value === 'between_title') {
    const groups: { label: string, items: string[] }[] = []
    if (result3AB.value.length)
      groups.push({ label: t('result_a_call_b'), items: result3AB.value })
    if (result3BA.value.length)
      groups.push({ label: t('result_b_call_a'), items: result3BA.value })
    return groups
  }
  return result4.value.length ? [{ label: '', items: result4.value }] : []
})
</script>

<template>
  <div flex="~ col gap-4">
    <!-- Tab switcher: segmented control. Narrow screens wrap to 2×2. -->
    <div
      border="~ c-border"
      grid="~ cols-2 sm:cols-4 gap-1" p-1 rounded-xl bg-c-input
    >
      <button
        v-for="tab in TAB_OPTIONS"
        :key="tab.value"
        type="button"
        :aria-pressed="activeTab === tab.value"
        border="~ transparent"

        text-base leading-snug font-semibold px-3 py-2.5 text-center outline-none rounded-lg min-h-11 select-none
        transition="colors duration-200"
        :class="
          activeTab === tab.value
            ? 'bg-c-surface border-c-border-strong text-c-accent'
            : 'text-c-text-muted hover:text-c-text hover:bg-c-surface hover:border-c-border'
        "
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab 1: 关系找称呼 -->
    <Panel v-if="activeTab === 'title'" :title="t('tab_title_to_name')">
      <div p-5 flex="~ col gap-4">
        <!-- Path display -->
        <div
          border="~ c-border"
          px-3 py-2 rounded-xl bg-c-input min-h-11
          flex="~ items-center gap-1.5 wrap"
        >
          <template v-if="t1Path.length > 0">
            <template v-for="(word, i) in t1Path" :key="i">
              <span
                border="~"
                text-sm font-medium px-3 py-1 rounded-lg
                :class="tagColor(word)"
              >{{ word }}</span>
              <span v-if="i < t1Path.length - 1" text-xs text-c-text-faint select-none>的</span>
            </template>
          </template>
          <span
            v-else
            border="~ transparent"
            text-sm text-c-text-faint py-1 select-none
          >{{ t('path_empty') }}</span>
        </div>

        <!-- Quick buttons: aligned 5-column grid, actions on their own row -->
        <div flex="~ col gap-2">
          <div grid="~ cols-5 gap-2">
            <button
              v-for="btn in QUICK_BUTTONS"
              :key="btn.char"
              type="button"
              :disabled="isLocked(btn.word)"
              border="~ transparent"
              flex="~ items-center justify-center gap-1.5"
              text-sm text-c-text font-medium outline-none rounded-xl bg-c-input h-10 w-full select-none
              transition="colors duration-200"
              :class="isLocked(btn.word)
                ? 'op-40 cursor-not-allowed'
                : 'hover:border-c-border hover:bg-c-surface'"
              @click="appendWord(btn.word)"
            >
              <span
                text-sm
                :class="[btn.sex === 'm' ? 'i-carbon-gender-male' : 'i-carbon-gender-female', btn.mark]"
              />
              <span>{{ btn.char }}</span>
            </button>
          </div>
          <div flex="~ gap-2 justify-end">
            <BaseButton
              :label="t('backspace')"
              icon="i-carbon-delete"
              :disabled="t1Path.length === 0"
              @click="backspacePath"
            />
            <BaseButton
              :label="t('clear')"
              icon="i-carbon-trash-can"
              :disabled="t1Path.length === 0"
              @click="clearPath"
            />
          </div>
        </div>
      </div>
    </Panel>

    <!-- Tab 2: 称呼找关系 -->
    <Panel v-else-if="activeTab === 'chain'" :title="t('tab_name_to_chain')">
      <div p-5 flex="~ col gap-4">
        <LabelField :label="t('title_input')">
          <TextInput
            :model-value="t2Text"
            :placeholder="t('title_placeholder')"
            :copyable="false"
            :monospace="false"
            @update:model-value="t2Text = $event"
          />
        </LabelField>
      </div>
    </Panel>

    <!-- Tab 3 & 4: 两者间称呼 / 两者间合称 -->
    <Panel v-else :title="activeTab === 'between_title' ? t('tab_between_title') : t('tab_between_pair')">
      <div p-5 flex="~ col gap-4">
        <div flex="~ items-center">
          <BaseButton :active="optimal" @click="optimal = !optimal">
            {{ t('optimal_path') }}
          </BaseButton>
        </div>
        <div grid="~ cols-2 gap-4">
          <LabelField :label="t('person_a')">
            <TextInput
              :model-value="t3A"
              :placeholder="t('person_a_placeholder')"
              :copyable="false"
              :monospace="false"
              @update:model-value="t3A = $event"
            />
          </LabelField>
          <LabelField :label="t('person_b')">
            <TextInput
              :model-value="t3B"
              :placeholder="t('person_b_placeholder')"
              :copyable="false"
              :monospace="false"
              @update:model-value="t3B = $event"
            />
          </LabelField>
        </div>
      </div>
    </Panel>

    <!-- Result: only shown when there is something to show -->
    <Panel v-if="resultGroups.length > 0" :title="t('result_label')">
      <div p-5>
        <div flex="~ col gap-6">
          <div v-for="(group, gi) in resultGroups" :key="gi">
            <!-- Group header: LabelField-toned label -->
            <div v-if="group.label" mb-3 select-none>
              <span text="[0.8125rem] c-text-muted" leading-snug font-medium>
                {{ group.label }}
              </span>
            </div>
            <!-- Kinship titles: quiet serif terms, slash between variants -->
            <div flex="~ wrap items-baseline gap-x-2.5 gap-y-2">
              <template v-for="(item, i) in group.items" :key="i">
                <span text="xl c-text" font="serif normal" leading-snug>{{ item }}</span>
                <span
                  v-if="i < group.items.length - 1"
                  text="lg c-text-muted" font="serif normal" select-none translate-y--0.25
                >/</span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  </div>
</template>
