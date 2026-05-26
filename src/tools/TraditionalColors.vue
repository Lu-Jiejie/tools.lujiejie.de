<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'traditional-colors',
  name: 'Traditional Colors',
  nameZh: '传统色盘',
  description: 'Browse Chinese traditional colors and Nippon Colors with color details.',
  descriptionZh: '浏览中国传统色与 Nippon Colors，并查看颜色详情。',
  category: 'design',
  keywords: ['color', 'palette', 'traditional', 'china', 'chinese', 'nippon', 'japan', 'hex', '颜色', '传统色'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import LabelField from '~/components/container/LabelField.vue'
import Panel from '~/components/container/Panel.vue'
import CustomSelect from '~/components/input/SelectInput.vue'
import TextInput from '~/components/input/TextInput.vue'
import BaseButton from '~/components/ui/BaseButton.vue'
import { useI18n } from '~/composables/useI18n'
import { useLocale } from '~/composables/useLocale'
import colorData from '~/data/traditional-colors.json'

interface PaletteColor {
  id: string
  source: PaletteKey
  name: string
  reading: string
  hex: string
  rgb: [number, number, number]
  cmyk: [number, number, number, number]
}

interface Palette {
  id: PaletteKey
  name: string
  nameZh: string
  colors: PaletteColor[]
}

type PaletteKey = 'chinese' | 'nippon'
type HueFilterKey = 'all' | 'neutral' | 'red' | 'amber' | 'green' | 'cyan' | 'indigo' | 'violet'
type SortKey = 'default' | 'hue' | 'lightness' | 'saturation'
type SortDirection = 'asc' | 'desc'
type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'cmyk'

interface HueFilter {
  key: HueFilterKey
  label: string
  labelZh: string
  color: string
  ranges: Array<[number, number]>
}

const { locale } = useLocale()
const { t } = useI18n({
  palette: ['Palette', '色盘'],
  palette_source: ['Source', '来源'],
  hue_filter: ['Color type', '色型'],
  sort: ['Sort', '排序'],
  sort_asc: ['Ascending', '升序'],
  sort_desc: ['Descending', '降序'],
  search: ['Search', '搜索'],
  search_placeholder: [
    (count: string) => `Search among ${count} colors...`,
    (count: string) => `在 ${count} 个颜色中搜索...`,
  ],
  hex: ['HEX', 'HEX'],
  rgb: ['RGB', 'RGB'],
  hsl: ['HSL', 'HSL'],
  cmyk: ['CMYK', 'CMYK'],
})

const palettes = colorData.palettes as Palette[]
const palette = shallowRef<PaletteKey>('chinese')
const hueFilter = shallowRef<HueFilterKey>('all')
const sortBy = shallowRef('default')
const sortDirection = shallowRef<SortDirection>('asc')
const query = shallowRef('')
const hueFilters: HueFilter[] = [
  { key: 'all', label: 'All', labelZh: '全部', color: 'linear-gradient(135deg, #ef4444, #eab308, #22c55e, #0ea5e9, #8b5cf6)', ranges: [[0, 360]] },
  { key: 'neutral', label: 'Neutral', labelZh: '素色', color: '#8a8178', ranges: [] },
  { key: 'red', label: 'Red', labelZh: '红色', color: '#b91c1c', ranges: [[330, 360], [0, 25]] },
  { key: 'amber', label: 'Amber', labelZh: '黄色', color: '#b7791f', ranges: [[18, 78]] },
  { key: 'green', label: 'Green', labelZh: '绿色', color: '#2f855a', ranges: [[70, 165]] },
  { key: 'cyan', label: 'Cyan', labelZh: '青色', color: '#0f766e', ranges: [[150, 210]] },
  { key: 'indigo', label: 'Blue', labelZh: '蓝色', color: '#334e68', ranges: [[200, 270]] },
  { key: 'violet', label: 'Violet', labelZh: '紫色', color: '#7e3f8f', ranges: [[270, 330]] },
]
const colorFormats: ColorFormat[] = ['hex', 'rgb', 'hsl', 'cmyk']
const sortOptions = computed(() => [
  { label: locale.value === 'zh' ? '默认' : 'Default', value: 'default' },
  { label: locale.value === 'zh' ? '色相' : 'Hue', value: 'hue' },
  { label: locale.value === 'zh' ? '明度' : 'Lightness', value: 'lightness' },
  { label: locale.value === 'zh' ? '饱和度' : 'Saturation', value: 'saturation' },
])

const activePalette = computed(() => palettes.find(item => item.id === palette.value) ?? palettes[0])
const activeColors = computed(() => activePalette.value.colors)
const filteredColors = computed(() => {
  const q = query.value.trim().toLowerCase()
  return activeColors.value.filter((color) => {
    const matchedQuery = !q
      || color.name.toLowerCase().includes(q)
      || color.reading.toLowerCase().includes(q)
      || color.hex.toLowerCase().includes(q)

    return matchedQuery && matchesHueFilter(color, hueFilter.value)
  })
})
const sortedColors = computed(() => sortColors(filteredColors.value, sortBy.value as SortKey, sortDirection.value))
const searchPlaceholder = computed(() => t('search_placeholder', String(sortedColors.value.length)))

function setPalette(next: PaletteKey) {
  palette.value = next
  query.value = ''
  hueFilter.value = 'all'
}

function paletteName(item: Palette) {
  return locale.value === 'zh' ? item.nameZh : item.name
}

function hueFilterLabel(item: HueFilter) {
  return locale.value === 'zh' ? item.labelZh : item.label
}

function setHueFilter(next: HueFilterKey) {
  hueFilter.value = next
}

function toggleSortDirection() {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
}

function sortColors(colors: PaletteColor[], sort: SortKey, direction: SortDirection) {
  const next = [...colors]
  if (sort === 'default') {
    if (direction === 'desc')
      next.reverse()
    return next
  }

  const order = direction === 'asc' ? 1 : -1
  return next.sort((a, b) => {
    if (sort === 'hue')
      return (colorHue(a) - colorHue(b) || colorLightness(b) - colorLightness(a)) * order
    if (sort === 'lightness')
      return (colorLightness(a) - colorLightness(b) || colorHue(a) - colorHue(b)) * order
    return (colorSaturation(a) - colorSaturation(b) || colorHue(a) - colorHue(b)) * order
  })
}

function rgbText(color: PaletteColor) {
  return color.rgb.join(', ')
}

function hslText(color: PaletteColor) {
  const [r, g, b] = color.rgb
  const { h, s, l } = rgbToHsl(r, g, b)
  return `${h}deg, ${s}%, ${l}%`
}

function cmykText(color: PaletteColor) {
  return color.cmyk.join(', ')
}

function colorFormatText(color: PaletteColor, format: ColorFormat) {
  if (format === 'hex')
    return color.hex.toUpperCase()
  if (format === 'rgb')
    return rgbText(color)
  if (format === 'hsl')
    return hslText(color)
  return cmykText(color)
}

function colorFormatLabel(color: PaletteColor, format: ColorFormat) {
  return format === 'hex' ? colorFormatText(color, format) : t(format)
}

function matchesHueFilter(color: PaletteColor, filter: HueFilterKey) {
  if (filter === 'all')
    return true

  const [r, g, b] = color.rgb
  const { h, s } = rgbToHsl(r, g, b)
  const isNeutral = s < 10
  if (filter === 'neutral')
    return isNeutral
  if (isNeutral)
    return false

  const currentFilter = hueFilters.find(item => item.key === filter)
  if (!currentFilter)
    return true

  return currentFilter.ranges.some(([from, to]) => h >= from && h < to)
}

function colorHue(color: PaletteColor) {
  return rgbToHsl(...color.rgb).h
}

function colorLightness(color: PaletteColor) {
  return rgbToHsl(...color.rgb).l
}

function colorSaturation(color: PaletteColor) {
  return rgbToHsl(...color.rgb).s
}

async function copyColor(color: PaletteColor, format: ColorFormat) {
  await navigator.clipboard.writeText(colorFormatText(color, format))
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r)
      h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g)
      h = (b - r) / d + 2
    else
      h = (r - g) / d + 4
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function readableTextColor([r, g, b]: [number, number, number]) {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.58 ? '#111827' : '#ffffff'
}
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('palette')">
      <div p-5 flex="~ col gap-4">
        <LabelField :label="t('palette_source')">
          <div flex="~ gap-2 wrap" items-center>
            <BaseButton
              v-for="item in palettes"
              :key="item.id"
              :active="palette === item.id"
              @click="setPalette(item.id)"
            >
              {{ paletteName(item) }}
            </BaseButton>
          </div>
        </LabelField>

        <LabelField :label="t('hue_filter')">
          <div flex="~ wrap gap-2">
            <BaseButton
              v-for="item in hueFilters"
              :key="item.key"
              :active="hueFilter === item.key"
              @click="setHueFilter(item.key)"
            >
              <span
                rounded-full shrink-0 size-2.5
                border="~ white/58"
                :class="hueFilter === item.key ? 'shadow-[0_0_0_1px_rgb(0_0_0_/_8%),0_0_0_3px_var(--c-accent-soft)]' : 'shadow-[0_0_0_1px_rgb(0_0_0_/_8%)]'"
                :style="{ background: item.color }"
              />
              <span>{{ hueFilterLabel(item) }}</span>
            </BaseButton>
          </div>
        </LabelField>

        <div grid="~ cols-1 md:cols-[auto_minmax(0,1fr)] gap-3" items-end>
          <LabelField :label="t('sort')">
            <div flex="~ gap-2" items-center>
              <CustomSelect v-model="sortBy" :options="sortOptions" />
              <BaseButton
                :icon="sortDirection === 'asc' ? 'i-carbon-sort-ascending' : 'i-carbon-sort-descending'"
                icon-only
                :title="sortDirection === 'asc' ? t('sort_asc') : t('sort_desc')"
                @click="toggleSortDirection"
              />
            </div>
          </LabelField>

          <LabelField :label="t('search')">
            <TextInput
              v-model="query"
              :placeholder="searchPlaceholder"
              :copyable="false"
              :monospace="false"
              inputmode="search"
            />
          </LabelField>
        </div>
      </div>
    </Panel>

    <div grid="~ cols-1 lg:cols-2 gap-3">
      <div
        v-for="color in sortedColors"
        :key="color.id"
        border="~ c-border"
        rounded-xl bg-c-surface transition-150 overflow-hidden hover:border-c-border-strong
      >
        <div
          flex="~ col gap-2" p-5 min-h-42 justify-between relative overflow-hidden isolate
          :style="{
            backgroundColor: color.hex,
            color: readableTextColor(color.rgb),
          }"
        >
          <div min-w-0>
            <div text-3xl font-semibold font-serif truncate>
              {{ color.name }}
            </div>
            <div text-sm mt-1 op-75 truncate>
              {{ color.reading }}
            </div>
          </div>
        </div>
        <div p-3 flex="~ col gap-2">
          <div grid="~ cols-2 gap-2" text-xs>
            <button
              v-for="format in colorFormats" :key="format"
              type="button"
              border="~ c-border"
              font-mono px-2 py-1.5 rounded-lg bg-c-raised select-none truncate hover:border-c-border-strong
              :title="colorFormatText(color, format)"
              @click="copyColor(color, format)"
            >
              {{ colorFormatLabel(color, format) }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
