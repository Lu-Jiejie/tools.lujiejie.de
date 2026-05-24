<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'color-contrast-checker',
  name: 'Color Contrast Checker',
  nameZh: '颜色对比度检查',
  description: 'Check foreground and background color contrast against WCAG AA and AAA.',
  descriptionZh: '检查前景色和背景色的 WCAG AA/AAA 对比度。',
  category: 'design',
  keywords: ['color', 'contrast', 'wcag', 'accessibility', 'a11y', 'foreground', 'background'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import AlertTip from '~/components/AlertTip.vue'
import BaseButton from '~/components/BaseButton.vue'
import ColorPickerInput from '~/components/ColorPickerInput.vue'
import CollapsibleExplainer from '~/components/container/CollapsibleExplainer.vue'
import LabelField from '~/components/container/LabelField.vue'
import Panel from '~/components/container/Panel.vue'
import TextInput from '~/components/TextInput.vue'
import { useI18n } from '~/composables/useI18n'

interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

interface CheckItem {
  label: string
  required: number
}

const { t } = useI18n({
  input_label: ['Colors', '颜色'],
  result_label: ['WCAG Result', 'WCAG 结果'],
  preview_label: ['Preview', '预览'],
  recommendation_label: ['Recommendations', '推荐'],
  foreground: ['Foreground', '前景色'],
  background: ['Background', '背景色'],
  swap: ['Swap', '交换'],
  invalid_color: ['Invalid color input.', '颜色输入无效。'],
  contrast_ratio: ['Contrast Ratio', '对比度'],
  pass: ['Pass', '通过'],
  fail: ['Fail', '未通过'],
  normal_aa: ['Normal Text AA', '普通文本 AA'],
  normal_aaa: ['Normal Text AAA', '普通文本 AAA'],
  large_aa: ['Large Text AA', '大号文本 AA'],
  large_aaa: ['Large Text AAA', '大号文本 AAA'],
  ui_aa: ['UI / Icons AA', 'UI / 图标 AA'],
  best_readable: ['Most readable text color', '最易读文字色'],
  aa_recommendation: ['Nearest AA foreground', '最近 AA 前景色'],
  aaa_recommendation: ['Nearest AAA foreground', '最近 AAA 前景色'],
  sample_title: ['Readable heading', '可读的标题'],
  sample_body: ['Short body text for contrast checking.', '用于检查对比度的短正文。'],
  sample_meta: ['Just now', '刚刚更新'],
  sample_badge: ['Active', '启用中'],
  sample_button: ['Continue', '继续'],
  sample_secondary: ['Secondary note', '辅助说明'],
  sample_link: ['Learn more', '了解更多'],
  sample_icon_label: ['Notice', '提示'],
  how_it_works: ['How It Works', '工作原理'],
  how_1_title: ['Calculate brightness', '计算亮度'],
  how_1_desc: [
    'The tool converts the sRGB color to linear light, then calculates brightness from red, green, and blue.',
    '工具会先把 sRGB 颜色转成线性光，再用红、绿、蓝三个通道算出亮度。',
  ],
  how_2_title: ['Compare colors', '对比颜色'],
  how_2_desc: [
    'Contrast is the lighter brightness divided by the darker brightness, with 0.05 added to both sides.',
    '对比度就是较亮的亮度除以较暗的亮度，两边都会先加上 0.05。',
  ],
  how_3_title: ['WCAG levels', 'WCAG 等级'],
  how_3_desc: [
    'AA uses 4.5:1 for normal text and 3:1 for large text or UI graphics. AAA is stricter: 7:1 and 4.5:1.',
    'AA 对普通文本要求 4.5:1，对大号文本和 UI 图形要求 3:1。AAA 更严格，分别是 7:1 和 4.5:1。',
  ],
  how_4_title: ['Recommendations', '推荐颜色'],
  how_4_desc: [
    'Recommended colors keep the background unchanged and move the foreground toward black or white until it passes.',
    '推荐颜色会保持背景不变，只把前景色往黑色或白色方向调整，直到达到要求。',
  ],
})

const foregroundInput = shallowRef('#666666')
const backgroundInput = shallowRef('#ffffff')

const CHECKS = computed<CheckItem[]>(() => [
  { label: t('normal_aa'), required: 4.5 },
  { label: t('normal_aaa'), required: 7 },
  { label: t('large_aa'), required: 3 },
  { label: t('large_aaa'), required: 4.5 },
  { label: t('ui_aa'), required: 3 },
])

const passedChecks = computed(() => CHECKS.value.filter(check => ratio.value >= check.required).length)
const explainItems = computed(() => [
  {
    title: t('how_1_title'),
    description: t('how_1_desc'),
    links: [
      { label: 'W3C WCAG Contrast Minimum', href: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html' },
    ],
  },
  {
    title: t('how_2_title'),
    description: t('how_2_desc'),
    links: [
      { label: 'Wikipedia: Contrast ratio', href: 'https://en.wikipedia.org/wiki/Contrast_ratio' },
    ],
  },
  { title: t('how_3_title'), description: t('how_3_desc') },
  { title: t('how_4_title'), description: t('how_4_desc') },
])

const foreground = computed(() => parseColor(foregroundInput.value))
const background = computed(() => parseColor(backgroundInput.value))
const hasError = computed(() => foreground.value === null || background.value === null)
const compositedBackground = computed(() => background.value ? composite(background.value, { r: 255, g: 255, b: 255, a: 1 }) : null)
const compositedForeground = computed(() => foreground.value && compositedBackground.value ? composite(foreground.value, compositedBackground.value) : null)
const ratio = computed(() => {
  if (!compositedForeground.value || !compositedBackground.value)
    return 1
  return contrastRatio(compositedForeground.value, compositedBackground.value)
})
const ratioText = computed(() => `${ratio.value.toFixed(2)}:1`)
const foregroundHex = computed(() => foreground.value ? toHex(compositedForeground.value ?? foreground.value) : '')
const backgroundHex = computed(() => background.value ? toHex(compositedBackground.value ?? background.value) : '')
const foregroundPickerHex = computed(() => foreground.value ? toHexAlpha(foreground.value) : '')
const backgroundPickerHex = computed(() => background.value ? toHexAlpha(background.value) : '')
const bestTextColor = computed(() => {
  if (!compositedBackground.value)
    return ''
  const blackRatio = contrastRatio({ r: 0, g: 0, b: 0, a: 1 }, compositedBackground.value)
  const whiteRatio = contrastRatio({ r: 255, g: 255, b: 255, a: 1 }, compositedBackground.value)
  return blackRatio >= whiteRatio ? '#000000' : '#ffffff'
})
const aaRecommendation = computed(() => recommendForeground(4.5))
const aaaRecommendation = computed(() => recommendForeground(7))
const previewStyle = computed(() => ({
  color: foregroundHex.value || '#666666',
  backgroundColor: backgroundHex.value || '#ffffff',
}))

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function parseColor(value: string): Rgba | null {
  const text = value.trim()
  const hex = text.match(/^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i)
  if (hex) {
    let h = hex[1]
    if (h.length === 3)
      h = `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}ff`
    else if (h.length === 4)
      h = `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`
    else if (h.length === 6)
      h = `${h}ff`

    return {
      r: Number.parseInt(h.slice(0, 2), 16),
      g: Number.parseInt(h.slice(2, 4), 16),
      b: Number.parseInt(h.slice(4, 6), 16),
      a: Number.parseInt(h.slice(6, 8), 16) / 255,
    }
  }

  const rgb = text.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i)
  if (rgb) {
    return {
      r: clamp(Number(rgb[1]), 0, 255),
      g: clamp(Number(rgb[2]), 0, 255),
      b: clamp(Number(rgb[3]), 0, 255),
      a: rgb[4] === undefined ? 1 : clamp(Number(rgb[4]), 0, 1),
    }
  }

  const hsl = text.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)$/i)
  if (hsl) {
    const [r, g, b] = hslToRgb(Number(hsl[1]), Number(hsl[2]), Number(hsl[3]))
    return {
      r,
      g,
      b,
      a: hsl[4] === undefined ? 1 : clamp(Number(hsl[4]), 0, 1),
    }
  }

  return null
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

function composite(top: Rgba, bottom: Rgba): Rgba {
  const a = top.a + bottom.a * (1 - top.a)
  if (a === 0)
    return { r: 0, g: 0, b: 0, a: 0 }

  return {
    r: Math.round((top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / a),
    g: Math.round((top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / a),
    b: Math.round((top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / a),
    a,
  }
}

function channelToLinear(value: number): number {
  const normalized = value / 255
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4
}

function luminance(color: Rgba): number {
  return 0.2126 * channelToLinear(color.r) + 0.7152 * channelToLinear(color.g) + 0.0722 * channelToLinear(color.b)
}

function contrastRatio(a: Rgba, b: Rgba): number {
  const l1 = luminance(a)
  const l2 = luminance(b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function toHex(color: Rgba): string {
  const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  return `#${hex(color.r)}${hex(color.g)}${hex(color.b)}`
}

function toHexAlpha(color: Rgba): string {
  const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  return `#${hex(color.r)}${hex(color.g)}${hex(color.b)}${hex(color.a * 255)}`
}

function mix(a: Rgba, b: Rgba, amount: number): Rgba {
  return {
    r: Math.round(a.r + (b.r - a.r) * amount),
    g: Math.round(a.g + (b.g - a.g) * amount),
    b: Math.round(a.b + (b.b - a.b) * amount),
    a: 1,
  }
}

function recommendForeground(target: number): string {
  if (!compositedForeground.value || !compositedBackground.value)
    return ''
  if (ratio.value >= target)
    return toHex(compositedForeground.value)

  const bgLum = luminance(compositedBackground.value)
  const fgLum = luminance(compositedForeground.value)
  const endpoint = fgLum < bgLum
    ? { r: 0, g: 0, b: 0, a: 1 }
    : { r: 255, g: 255, b: 255, a: 1 }

  if (contrastRatio(endpoint, compositedBackground.value) < target)
    return bestTextColor.value

  let low = 0
  let high = 1
  for (let i = 0; i < 16; i++) {
    const mid = (low + high) / 2
    const candidate = mix(compositedForeground.value, endpoint, mid)
    if (contrastRatio(candidate, compositedBackground.value) >= target)
      high = mid
    else
      low = mid
  }

  return toHex(mix(compositedForeground.value, endpoint, high))
}

function swapColors() {
  const currentForeground = foregroundInput.value
  foregroundInput.value = backgroundInput.value
  backgroundInput.value = currentForeground
}
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('input_label')">
      <div p-5 flex="~ col gap-4">
        <div grid="~ cols-1 md:cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-4" items-end>
          <LabelField :label="t('foreground')">
            <div flex="~ items-center gap-2">
              <TextInput
                v-model="foregroundInput"
                :error="foreground === null"
                placeholder="#111827 / rgb(17, 24, 39) / hsl(221, 39%, 11%)"
                :copyable="false"
                class="flex-1"
              />
              <ColorPickerInput
                v-model="foregroundInput"
                size="small"
                :preview-color="foregroundHex || '#000000'"
                :picker-color="foregroundPickerHex || '#000000ff'"
                :text-color="backgroundHex || '#ffffff'"
              />
            </div>
          </LabelField>

          <div flex="~ justify-center" class="md:pb-0.5">
            <BaseButton icon="i-carbon-arrows-horizontal" icon-only @click="swapColors" />
          </div>

          <LabelField :label="t('background')">
            <div flex="~ items-center gap-2">
              <TextInput
                v-model="backgroundInput"
                :error="background === null"
                placeholder="#ffffff / rgb(255, 255, 255)"
                :copyable="false"
                class="flex-1"
              />
              <ColorPickerInput
                v-model="backgroundInput"
                size="small"
                :preview-color="backgroundHex || '#ffffff'"
                :picker-color="backgroundPickerHex || '#ffffffff'"
                :text-color="foregroundHex || '#111827'"
              />
            </div>
          </LabelField>
        </div>

        <AlertTip v-if="hasError" type="error">
          <span text-sm>{{ t('invalid_color') }}</span>
        </AlertTip>
      </div>
    </Panel>

    <Panel :title="t('preview_label')">
      <div p-5>
        <div
          pointer-events-none select-none transition-colors
          :style="previewStyle"
        >
          <div>
            <div max-w-170>
              <div flex="~ gap-2 wrap" mb-3 items-center>
                <span border="~ current/35" text-xs font-medium px-2.5 py-1 rounded-lg>
                  {{ t('sample_badge') }}
                </span>
                <span text-xs op-65>{{ t('sample_meta') }}</span>
              </div>

              <div text="3xl md:4xl" leading-tight font="serif normal">
                {{ t('sample_title') }}
              </div>

              <div text-sm leading-relaxed mt-3 op-82 max-w-145>
                {{ t('sample_body') }}
                <span underline underline-offset-3 inline-block whitespace-nowrap>{{ t('sample_link') }}</span>
              </div>
            </div>

            <div border="t current/16" mt-6 pt-4 flex="~ col sm:row gap-3 sm:items-center sm:justify-between">
              <div flex="~ items-center gap-2" min-w-0>
                <span border="~ current/35" i-carbon-information p-2 rounded-full shrink-0 />
                <div min-w-0>
                  <div text-sm font-medium truncate>
                    {{ t('sample_icon_label') }}
                  </div>
                  <div text-xs op-62 truncate>
                    {{ t('sample_secondary') }}
                  </div>
                </div>
              </div>

              <div border="~ current/35" text-sm font-medium px-4 rounded-xl flex shrink-0 h-10 items-center justify-center>
                {{ t('sample_button') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Panel>

    <Panel :title="t('result_label')">
      <div p-5 flex="~ col gap-4">
        <div flex="~ col sm:row gap-3 sm:items-end sm:justify-between">
          <div min-w-0>
            <div text="5xl c-text" leading-none font-mono font-semibold>
              {{ ratioText }}
            </div>
            <div mt-2 flex="~ items-center gap-2">
              <span rounded-full bg-c-accent h-0.75 w-8 />
              <span text-xs text-c-text-muted leading-none font-mono uppercase>
                {{ t('contrast_ratio') }}
              </span>
            </div>
          </div>

          <div text-sm text-c-text-muted>
            <span text-c-text font-mono>{{ passedChecks }}/{{ CHECKS.length }}</span>
            {{ t('pass') }}
          </div>
        </div>

        <div grid="~ cols-1 md:cols-2 gap-3">
          <div
            v-for="check in CHECKS"
            :key="check.label"
            border="~ c-border"
            p="x-3.5 y-3"
            rounded-xl bg-c-surface
            flex gap-3 items-center justify-between
          >
            <div>
              <div text-sm font-medium>
                {{ check.label }}
              </div>
              <div text-xs op-55>
                {{ check.required }}:1
              </div>
            </div>
            <div
              border="~" text-xs font-medium px-2 py-1 rounded-lg select-none
              :class="ratio >= check.required ? 'text-c-accent bg-c-soft border-c-accent/30' : 'text-red-500 bg-red-500/8 border-red-500/40'"
            >
              {{ ratio >= check.required ? t('pass') : t('fail') }}
            </div>
          </div>
        </div>
      </div>
    </Panel>

    <Panel :title="t('recommendation_label')">
      <div p-5 grid="~ cols-1 md:cols-3 gap-4">
        <LabelField :label="t('best_readable')">
          <TextInput :model-value="bestTextColor" readonly copyable class="flex-1" />
        </LabelField>

        <LabelField :label="t('aa_recommendation')">
          <TextInput :model-value="aaRecommendation" readonly copyable class="flex-1" />
        </LabelField>

        <LabelField :label="t('aaa_recommendation')">
          <TextInput :model-value="aaaRecommendation" readonly copyable class="flex-1" />
        </LabelField>
      </div>
    </Panel>

    <CollapsibleExplainer
      :title="t('how_it_works')"
      :items="explainItems"
    />
  </div>
</template>
