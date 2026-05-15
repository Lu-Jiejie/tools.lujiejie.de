<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'regex-tester',
  name: 'Regex Tester',
  nameZh: '正则测试',
  description: 'Test and debug regular expressions with live match highlighting.',
  descriptionZh: '测试和调试正则表达式，实时高亮匹配结果。',
  category: 'text',
  keywords: ['regex', 'regexp', 'pattern', 'match', '正则', '匹配'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import type { ShadowRootExpose } from 'vue-shadow-dom'
import { render } from '@regexper/render'
import { computed, onBeforeUnmount, onMounted, shallowRef, watchEffect } from 'vue'
import AlertTip from '~/components/AlertTip.vue'
import BaseButton from '~/components/BaseButton.vue'
import Panel from '~/components/Panel.vue'
import TextInput from '~/components/TextInput.vue'
import ToggleButton from '~/components/ToggleButton.vue'
import { isDark } from '~/composables/dark'
import { isDev } from '~/composables/useDevMode'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  pattern_label: ['Pattern', '正则表达式'],
  pattern_placeholder: ['Enter regex pattern...', '输入正则表达式...'],
  flag_g: ['Global', '全局'],
  flag_i: ['Ignore Case', '忽略大小写'],
  flag_m: ['Multiline', '多行'],
  flag_s: ['Dot All', '点匹配换行'],
  flag_u: ['Unicode', 'Unicode'],
  flag_v: ['Unicode Sets', 'Unicode 集合'],
  test_label: ['Test String', '测试文本'],
  test_placeholder: ['Enter text to test...', '输入要测试的文本...'],
  result_label: ['Result', '匹配结果'],
  match_count: [(n: string) => `${n} match(es)`, (n: string) => `共 ${n} 处匹配`],
  no_match: ['No matches', '无匹配'],
  invalid_regex: ['Invalid regular expression.', '无效的正则表达式。'],
  diagram_label: ['Diagram', '结构图'],
})

const pattern = shallowRef('(\\w+)')
const testText = shallowRef('Hello World 2026')
const flagG = shallowRef(true)
const flagI = shallowRef(false)
const flagM = shallowRef(false)
const flagS = shallowRef(false)
// u: 正确处理 emoji 和 4 字节 Unicode 字符
//   pattern: \p{Emoji}  text: Hello 😀 World 🎉  → 匹配 😀 🎉
//   pattern: \u{1F600}  text: 😀  → 需要 u 才能用 \u{} 语法
// v: u 的升级版，支持集合运算（需现代浏览器）
//   pattern: [\p{Letter}--\p{ASCII}]  text: Hello 你好  → 只匹配非 ASCII 字母（如中文）
//   pattern: [\p{Decimal_Number}&&\p{ASCII}]  text: 123 ４５６  → 只匹配 ASCII 数字
const flagU = shallowRef(false)
const flagV = shallowRef(false)

const flags = computed(() => {
  let f = ''
  if (flagG.value)
    f += 'g'
  if (flagI.value)
    f += 'i'
  if (flagM.value)
    f += 'm'
  if (flagS.value)
    f += 's'
  // u 和 v 互斥，v 优先
  if (flagV.value)
    f += 'v'
  else if (flagU.value)
    f += 'u'
  return f
})

interface MatchResult {
  regex: RegExp
  matches: RegExpExecArray[]
  error: null
}
interface ErrorResult {
  regex: null
  matches: null
  error: string
}

const result = computed<MatchResult | ErrorResult>(() => {
  if (!pattern.value)
    return { regex: null, matches: [], error: null } as unknown as MatchResult

  let regex: RegExp
  try {
    regex = new RegExp(pattern.value, flags.value)
  }
  catch (e: unknown) {
    return { regex: null, matches: null, error: (e as Error).message }
  }

  const matches: RegExpExecArray[] = []
  if (flagG.value) {
    let m: RegExpExecArray | null = regex.exec(testText.value)
    let lastIndex = -1
    while (m !== null) {
      if (m.index === lastIndex) {
        regex.lastIndex++
        m = regex.exec(testText.value)
        continue
      }
      lastIndex = m.index
      matches.push(m)
      m = regex.exec(testText.value)
    }
  }
  else {
    const m = regex.exec(testText.value)
    if (m)
      matches.push(m)
  }

  return { regex, matches, error: null }
})

// 基于匹配索引生成 HSL 颜色
const MATCH_COLORS = [
  { bg: 'rgba(251, 191, 36, 0.3)', text: '#b45309', darkText: '#fbbf24' },
  { bg: 'rgba(52, 211, 153, 0.3)', text: '#047857', darkText: '#6ee7b7' },
  { bg: 'rgba(96, 165, 250, 0.3)', text: '#1d4ed8', darkText: '#93c5fd' },
  { bg: 'rgba(244, 114, 182, 0.3)', text: '#be185d', darkText: '#f9a8d4' },
  { bg: 'rgba(167, 139, 250, 0.3)', text: '#6d28d9', darkText: '#c4b5fd' },
  { bg: 'rgba(251, 146, 60, 0.3)', text: '#c2410c', darkText: '#fdba74' },
  { bg: 'rgba(45, 212, 191, 0.3)', text: '#0f766e', darkText: '#5eead4' },
  { bg: 'rgba(129, 140, 248, 0.3)', text: '#4338ca', darkText: '#a5b4fc' },
]

function getMatchColor(index: number) {
  return MATCH_COLORS[index % MATCH_COLORS.length]
}

// 将测试文本按匹配区间切分为高亮片段
interface Segment {
  text: string
  highlighted: boolean
  matchIndex?: number
}

const segments = computed<Segment[]>(() => {
  if (result.value.error !== null || !result.value.matches || result.value.matches.length === 0)
    return [{ text: testText.value, highlighted: false }]

  const segs: Segment[] = []
  let cursor = 0
  const text = testText.value

  for (let i = 0; i < result.value.matches.length; i++) {
    const m = result.value.matches[i]
    if (m.index > cursor)
      segs.push({ text: text.slice(cursor, m.index), highlighted: false })
    segs.push({ text: m[0], highlighted: true, matchIndex: i })
    cursor = m.index + m[0].length
    if (m[0].length === 0)
      cursor++
  }
  if (cursor < text.length)
    segs.push({ text: text.slice(cursor), highlighted: false })

  return segs
})

const matchCount = computed(() => result.value.matches?.length ?? 0)

// 每个匹配的捕获组详情
const matchDetails = computed(() => {
  if (!result.value.matches)
    return []
  return result.value.matches.map((m, i) => ({
    index: i + 1,
    full: m[0],
    start: m.index,
    end: m.index + m[0].length,
    groups: m.slice(1),
    namedGroups: m.groups ?? {},
  }))
})

const hoveredMatchIndex = shallowRef<number | null>(null)
const lockedMatchIndex = shallowRef<number | null>(null)
const activeMatchIndex = computed(() => lockedMatchIndex.value ?? hoveredMatchIndex.value)

function onMatchCardClick(index: number) {
  lockedMatchIndex.value = lockedMatchIndex.value === index ? null : index
}

function onGlobalClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.match-card'))
    lockedMatchIndex.value = null
}

onMounted(() => document.addEventListener('click', onGlobalClick))
onBeforeUnmount(() => document.removeEventListener('click', onGlobalClick))

const visualizerSVG = shallowRef<ShadowRootExpose>()

watchEffect(async () => {
  const regexValue = pattern.value
  const dark = isDark.value
  const visualizer = visualizerSVG.value?.shadow_root
  if (!visualizer)
    return
  while (visualizer.lastChild)
    visualizer.removeChild(visualizer.lastChild)
  if (!regexValue || result.value.error !== null)
    return
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  try {
    await render(regexValue, svg)
  }
  catch {}
  visualizer.appendChild(svg)

  const baseStyle = document.createElement('style')
  baseStyle.textContent = `
    .subexp .subexp-label tspan,
    .charset .charset-label tspan { font-size: 12px !important; }
  `
  visualizer.appendChild(baseStyle)

  if (dark) {
    const style = document.createElement('style')
    style.textContent = `
      svg { background-color: transparent !important; }
      .root path { stroke: #a1a1aa !important; }
      .root circle { fill: #52525b !important; stroke: #a1a1aa !important; }
      .anchor rect, .any-character rect { fill: #52525b !important; }
      .anchor text, .any-character text { fill: #fff !important; }
      .escape rect, .charset-escape rect { fill: #4d7c0f !important; }
      .escape text, .charset-escape text { fill: #ecfccb !important; }
      .literal rect { fill: #1e3a5f !important; }
      .literal text { fill: #e0f2fe !important; }
      .charset .charset-box { fill: #44403c !important; }
      .charset .charset-label tspan { fill: #e4e4e7 !important; }
      .subexp .subexp-box { stroke: #71717a !important; }
      .subexp .subexp-label tspan { fill: #e4e4e7 !important; }
      .match-fragment .repeat-label tspan { fill: #a1a1aa !important; }
    `
    visualizer.appendChild(style)
  }
})

interface Example {
  label: string
  labelZh: string
  pattern: string
  text: string
  flags: { g: boolean, i: boolean, m: boolean, s: boolean, u: boolean, v: boolean }
}

const EXAMPLES: Example[] = [
  {
    label: 'Capturing group',
    labelZh: '普通捕获组',
    pattern: '(\\d{4})-(\\d{2})-(\\d{2})',
    text: 'Today is 2026-05-15, yesterday was 2026-05-14.',
    flags: { g: true, i: false, m: false, s: false, u: false, v: false },
  },
  {
    label: 'Named group',
    labelZh: '命名捕获组',
    pattern: '(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})',
    text: 'Today is 2026-05-15.',
    flags: { g: true, i: false, m: false, s: false, u: false, v: false },
  },
  {
    label: 'Non-capturing group',
    labelZh: '非捕获组',
    pattern: '(?:https?|ftp)://(\\S+)',
    text: 'Visit https://example.com or http://foo.bar/path?q=1',
    flags: { g: true, i: false, m: false, s: false, u: false, v: false },
  },
  {
    label: 'Nested groups',
    labelZh: '嵌套捕获组',
    pattern: '((\\w+)@(\\w+)\\.(\\w+))',
    text: 'Contact alice@example.com or bob@test.org',
    flags: { g: true, i: false, m: false, s: false, u: false, v: false },
  },
  {
    label: 'Optional group',
    labelZh: '可选捕获组',
    pattern: '(\\+?\\d{1,3})?[\\s-]?(\\d{3})[\\s-]?(\\d{4,})',
    text: '+86 138-0013-8000  010-12345678  5551234',
    flags: { g: true, i: false, m: false, s: false, u: false, v: false },
  },
  {
    label: 'Lookahead',
    labelZh: '前瞻断言',
    pattern: '\\w+(?=\\.com)',
    text: 'Visit google.com or github.com but not example.org',
    flags: { g: true, i: false, m: false, s: false, u: false, v: false },
  },
  {
    label: 'Lookbehind',
    labelZh: '后顾断言',
    pattern: '(?<=\\$)[\\d.]+',
    text: 'Price: $19.99, discount: $5.00, total: $14.99',
    flags: { g: true, i: false, m: false, s: false, u: false, v: false },
  },
  {
    label: 'Backreference',
    labelZh: '反向引用',
    pattern: '([\'"])(.*?)\\1',
    text: 'He said "hello world" and \'goodbye\'',
    flags: { g: true, i: false, m: false, s: false, u: false, v: false },
  },
  {
    label: 'Unicode emoji (u)',
    labelZh: 'Unicode emoji (u)',
    pattern: '\\p{Emoji}',
    text: 'Hello 😀 World 🎉 foo 🚀',
    flags: { g: true, i: false, m: false, s: false, u: true, v: false },
  },
  {
    label: 'Unicode sets (v)',
    labelZh: 'Unicode 集合运算 (v)',
    pattern: '[\\p{Letter}--\\p{ASCII}]',
    text: 'Hello 你好 Wörld αβγ',
    flags: { g: true, i: false, m: false, s: false, u: false, v: true },
  },
]

function applyExample(ex: Example) {
  pattern.value = ex.pattern
  testText.value = ex.text
  flagG.value = ex.flags.g
  flagI.value = ex.flags.i
  flagM.value = ex.flags.m
  flagS.value = ex.flags.s
  flagU.value = ex.flags.u
  flagV.value = ex.flags.v
}
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('pattern_label')">
      <div p-5 flex="~ col gap-3">
        <TextInput
          :model-value="pattern"
          :error="result.error !== null"
          :copyable="false"
          :placeholder="t('pattern_placeholder')"
          font-mono
          @update:model-value="pattern = $event"
        />
        <Transition name="warn">
          <AlertTip v-if="result.error !== null" type="error">
            {{ t('invalid_regex') }}
          </AlertTip>
        </Transition>
        <div flex="~ gap-2 wrap" items-center>
          <ToggleButton v-model="flagG">
            g · {{ t('flag_g') }}
          </ToggleButton>
          <ToggleButton v-model="flagI">
            i · {{ t('flag_i') }}
          </ToggleButton>
          <ToggleButton v-model="flagM">
            m · {{ t('flag_m') }}
          </ToggleButton>
          <ToggleButton v-model="flagS">
            s · {{ t('flag_s') }}
          </ToggleButton>
          <ToggleButton
            :model-value="flagU"
            @update:model-value="flagU = $event; if ($event) flagV = false"
          >
            u · {{ t('flag_u') }}
          </ToggleButton>
          <ToggleButton
            :model-value="flagV"
            @update:model-value="flagV = $event; if ($event) flagU = false"
          >
            v · {{ t('flag_v') }}
          </ToggleButton>
        </div>
      </div>
    </Panel>

    <Panel :title="t('test_label')">
      <div p-5 flex="~ col gap-3">
        <div v-if="isDev" flex="~ gap-2 wrap">
          <BaseButton
            v-for="ex in EXAMPLES"
            :key="ex.label"
            @click="applyExample(ex)"
          >
            {{ ex.labelZh }}
          </BaseButton>
        </div>
        <textarea
          v-model="testText"
          :placeholder="t('test_placeholder')"
          rows="6"
          border="~ c-border focus:c-border-strong" text-sm font-mono px-3 py-2 outline-none rounded-xl bg-c-input w-full resize-y transition-colors
        />
      </div>
    </Panel>

    <Panel :title="t('result_label')">
      <div p-5 flex="~ col gap-4">
        <!-- 高亮预览 -->
        <div
          border="~ c-border" text-sm leading-relaxed font-mono px-3 py-2 rounded-xl bg-c-input min-h-10 whitespace-pre-wrap break-all
        >
          <template v-if="testText">
            <span
              v-for="(seg, i) in segments"
              :key="i"
              :style="seg.highlighted ? {
                background: getMatchColor(seg.matchIndex!).bg,
                color: isDark ? getMatchColor(seg.matchIndex!).darkText : getMatchColor(seg.matchIndex!).text,
                borderRadius: '3px',
                padding: '0 2px',
                boxShadow: activeMatchIndex === seg.matchIndex ? `0 0 0 2px ${isDark ? getMatchColor(seg.matchIndex!).darkText : getMatchColor(seg.matchIndex!).text}` : 'none',
                transition: 'box-shadow 0.15s ease',
              } : {}"
            >{{ seg.text }}</span>
          </template>
          <span v-else op-40>&nbsp;</span>
        </div>

        <!-- 匹配数量 -->
        <div text-sm op-60>
          <span v-if="result.error === null && testText">
            {{ matchCount > 0 ? t('match_count', String(matchCount)) : t('no_match') }}
          </span>
        </div>

        <!-- 匹配详情列表 -->
        <div v-if="matchDetails.length > 0" flex="~ col gap-2">
          <div
            v-for="m in matchDetails"
            :key="m.index"
            class="match-card"
            border="~ c-border" flex="~ col gap-1.5" text-sm p-3 rounded-xl cursor-pointer transition-shadow
            :style="activeMatchIndex === m.index - 1 ? { boxShadow: `0 0 0 2px ${isDark ? getMatchColor(m.index - 1).darkText : getMatchColor(m.index - 1).text}` } : {}"
            @mouseenter="hoveredMatchIndex = m.index - 1"
            @mouseleave="hoveredMatchIndex = null"
            @click="onMatchCardClick(m.index - 1)"
          >
            <div flex gap-2 min-w-0 items-center justify-between>
              <span font-medium font-mono min-w-0 truncate>{{ m.full || '(empty)' }}</span>
              <span
                p="x-1.5 y-0.5" text-xs font-mono rounded shrink-0 select-none
                :style="{ background: getMatchColor(m.index - 1).bg, color: isDark ? getMatchColor(m.index - 1).darkText : getMatchColor(m.index - 1).text }"
              >{{ m.start }}–{{ m.end }}</span>
            </div>
            <div v-if="m.groups.length > 0" flex="~ col gap-1">
              <div
                v-for="(g, gi) in m.groups" :key="gi"
                op-60 flex gap-2 min-w-0 items-center
              >
                <span p="x-1.5 y-0.5" border="~ c-border" text-xs font-mono rounded bg-c-raised shrink-0 select-none>
                  {{ Object.keys(m.namedGroups)[gi] ? `$${gi + 1} · ${Object.keys(m.namedGroups)[gi]}` : `$${gi + 1}` }}
                </span>
                <span font-mono min-w-0 truncate>{{ g ?? 'undefined' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Panel>

    <Panel :title="t('diagram_label')">
      <div p-5 select-none overflow-x-auto>
        <shadow-root ref="visualizerSVG" />
      </div>
    </Panel>
  </div>
</template>
