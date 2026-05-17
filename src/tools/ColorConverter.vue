<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'color-converter',
  name: 'Color Converter',
  nameZh: '颜色转换',
  description: 'Convert colors between HEX, RGB, HSL, and other formats.',
  descriptionZh: '在 HEX、RGB、HSL 等颜色格式之间互相转换。',
  category: 'convert',
  keywords: ['color', 'hex', 'rgb', 'hsl', 'convert'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import AlertTip from '~/components/AlertTip.vue'
import BaseButton from '~/components/BaseButton.vue'
import Panel from '~/components/Panel.vue'
import SelectInput from '~/components/SelectInput.vue'
import TextInput from '~/components/TextInput.vue'
import { useI18n } from '~/composables/useI18n'
import 'vanilla-colorful/hex-alpha-color-picker.js'

const { t } = useI18n({
  input_label: ['Input', '输入'],
  output_label: ['Output', '输出'],
  invalid: ['Invalid color', '无效颜色'],
  pick: ['Screen Pick', '屏幕取色'],
  color_picker: ['Color Picker', '颜色选择器'],
  hex: ['HEX', 'HEX'],
  rgb: ['RGB', 'RGB'],
  hsl: ['HSL', 'HSL'],
  hwb: ['HWB', 'HWB'],
  rgb_norm: ['RGB (0–1)', 'RGB (0–1)'],
})

// ── 核心状态：内部统一用 { r, g, b, a } ──
interface Rgba { r: number, g: number, b: number, a: number }

type FormatKey = 'hex' | 'rgb' | 'hsl' | 'hwb' | 'rgb_norm'

const FORMAT_OPTIONS: { label: string, value: FormatKey }[] = [
  { label: 'HEX', value: 'hex' },
  { label: 'RGB', value: 'rgb' },
  { label: 'HSL', value: 'hsl' },
  { label: 'HWB', value: 'hwb' },
  { label: 'RGB (0–1)', value: 'rgb_norm' },
]

const color = shallowRef<Rgba>({ r: 45, g: 212, b: 191, a: 1 })
const inputFormat = shallowRef<FormatKey>('hex')
const inputValue = shallowRef('#2dd4bfff')
const error = shallowRef(false)

// ── 颜色解析 ──
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function parseColor(val: string): Rgba | null {
  const s = val.trim()

  // HEX: #rgb #rrggbb #rgba #rrggbbaa — 严格长度，不走 canvas 兜底
  const hex = s.match(/^#([0-9a-f]{3,8})$/i)
  if (hex) {
    let h = hex[1]
    if (h.length === 3)
      h = `${h.split('').map(c => c + c).join('')}ff`
    else if (h.length === 4)
      h = h.split('').map(c => c + c).join('')
    else if (h.length === 6)
      h = `${h}ff`
    if (h.length === 8) {
      return {
        r: Number.parseInt(h.slice(0, 2), 16),
        g: Number.parseInt(h.slice(2, 4), 16),
        b: Number.parseInt(h.slice(4, 6), 16),
        a: Number.parseInt(h.slice(6, 8), 16) / 255,
      }
    }
  }

  // rgb(r, g, b) / rgba(r, g, b, a)
  const rgba = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/)
  if (rgba) {
    return {
      r: clamp(Number(rgba[1]), 0, 255),
      g: clamp(Number(rgba[2]), 0, 255),
      b: clamp(Number(rgba[3]), 0, 255),
      a: rgba[4] !== undefined ? clamp(Number(rgba[4]), 0, 1) : 1,
    }
  }

  // rgb(r g b / a) modern syntax
  const rgbMod = s.match(/^rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/)
  if (rgbMod) {
    const aRaw = rgbMod[4]
    const a = aRaw === undefined ? 1 : aRaw.endsWith('%') ? Number.parseFloat(aRaw) / 100 : Number(aRaw)
    return {
      r: clamp(Number(rgbMod[1]), 0, 255),
      g: clamp(Number(rgbMod[2]), 0, 255),
      b: clamp(Number(rgbMod[3]), 0, 255),
      a: clamp(a, 0, 1),
    }
  }

  // hsl(h, s%, l%) / hsla
  const hsla = s.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)/)
  if (hsla) {
    const [r, g, b] = hslToRgb(Number(hsla[1]), Number(hsla[2]), Number(hsla[3]))
    return { r, g, b, a: hsla[4] !== undefined ? clamp(Number(hsla[4]), 0, 1) : 1 }
  }

  // hsl(h s% l% / a) modern
  const hslMod = s.match(/^hsla?\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%(?:\s*\/\s*([\d.]+%?))?\s*\)/)
  if (hslMod) {
    const [r, g, b] = hslToRgb(Number(hslMod[1]), Number(hslMod[2]), Number(hslMod[3]))
    const aRaw = hslMod[4]
    const a = aRaw === undefined ? 1 : aRaw.endsWith('%') ? Number.parseFloat(aRaw) / 100 : Number(aRaw)
    return { r, g, b, a: clamp(a, 0, 1) }
  }

  // hwb(h w% b%)
  const hwb = s.match(/^hwb\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%(?:\s*\/\s*([\d.]+%?))?\s*\)/)
  if (hwb) {
    const [r, g, b] = hwbToRgb(Number(hwb[1]), Number(hwb[2]), Number(hwb[3]))
    const aRaw = hwb[4]
    const a = aRaw === undefined ? 1 : aRaw.endsWith('%') ? Number.parseFloat(aRaw) / 100 : Number(aRaw)
    return { r, g, b, a: clamp(a, 0, 1) }
  }

  // CSS named color via canvas（排除 # 开头，避免非法 hex 被静默接受）
  if (s.startsWith('#'))
    return null
  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = s
    if (!ctx.fillStyle || ctx.fillStyle === 'rgba(0, 0, 0, 0)')
      return null
    ctx.fillRect(0, 0, 1, 1)
    const d = ctx.getImageData(0, 0, 1, 1).data
    return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 }
  }
  catch {
    return null
  }
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

function hwbToRgb(h: number, w: number, b: number): [number, number, number] {
  w /= 100
  b /= 100
  if (w + b >= 1) {
    const gray = Math.round((w / (w + b)) * 255)
    return [gray, gray, gray]
  }
  const [r, g, bv] = hslToRgb(h, 100, 50)
  const apply = (c: number) => Math.round(c / 255 * (1 - w - b) * 255 + w * 255)
  return [apply(r), apply(g), apply(bv)]
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
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
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g)
      h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function rgbToHwb(r: number, g: number, b: number): [number, number, number] {
  const [h] = rgbToHsl(r, g, b)
  const w = Math.min(r, g, b) / 255
  const bk = 1 - Math.max(r, g, b) / 255
  return [h, Math.round(w * 100), Math.round(bk * 100)]
}

function toHex2(n: number) {
  return Math.round(n).toString(16).padStart(2, '0')
}

// ── 输出 computed ──
const hasAlpha = computed(() => color.value.a < 1)

const outHex = computed(() => {
  const { r, g, b, a } = color.value
  const base = `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`
  return hasAlpha.value ? base + toHex2(a * 255) : base
})

// picker 始终需要 8 位 hex
const outHexa = computed(() => {
  const { r, g, b, a } = color.value
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}${toHex2(a * 255)}`
})

const outRgb = computed(() => {
  const { r, g, b, a } = color.value
  return hasAlpha.value
    ? `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a.toFixed(2)})`
    : `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
})

const outHsl = computed(() => {
  const { r, g, b, a } = color.value
  const [h, s, l] = rgbToHsl(r, g, b)
  return hasAlpha.value
    ? `hsla(${h}, ${s}%, ${l}%, ${a.toFixed(2)})`
    : `hsl(${h}, ${s}%, ${l}%)`
})

const outHwb = computed(() => {
  const { r, g, b, a } = color.value
  const [h, w, bk] = rgbToHwb(r, g, b)
  return hasAlpha.value
    ? `hwb(${h} ${w}% ${bk}% / ${a.toFixed(2)})`
    : `hwb(${h} ${w}% ${bk}%)`
})

const outRgbNorm = computed(() => {
  const { r, g, b, a } = color.value
  const base = `${(r / 255).toFixed(3)}, ${(g / 255).toFixed(3)}, ${(b / 255).toFixed(3)}`
  return hasAlpha.value ? `${base}, ${a.toFixed(3)}` : base
})

const previewColor = computed(() => {
  const { r, g, b, a } = color.value
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`
})

// 根据背景亮度决定文字用黑或白
const previewTextColor = computed(() => {
  const { r, g, b, a } = color.value
  // 混合白色背景后的感知亮度
  const blended = (c: number) => c * a + 255 * (1 - a)
  const luminance = (0.299 * blended(r) + 0.587 * blended(g) + 0.114 * blended(b)) / 255
  return luminance > 0.5 ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)'
})

// 棋盘格背景（透明度预览用）
const checkerStyle = {
  backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
  backgroundSize: '8px 8px',
  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
}

const outputs = computed(() => [
  { key: 'hex', label: t('hex'), value: outHex.value },
  { key: 'rgb', label: t('rgb'), value: outRgb.value },
  { key: 'hsl', label: t('hsl'), value: outHsl.value },
  { key: 'hwb', label: t('hwb'), value: outHwb.value },
  { key: 'rgb_norm', label: t('rgb_norm'), value: outRgbNorm.value },
])

// ── 输入处理 ──
function formatByKey(key: FormatKey): string {
  switch (key) {
    case 'hex': return outHexa.value
    case 'rgb': return outRgb.value
    case 'hsl': return outHsl.value
    case 'hwb': return outHwb.value
    case 'rgb_norm': return outRgbNorm.value
  }
}

function onInput(val: string) {
  inputValue.value = val
  const parsed = parseColor(val)
  if (parsed === null) {
    error.value = true
    return
  }
  error.value = false
  color.value = parsed
  syncPicker()
}

// 切换格式时把当前颜色转成新格式填入输入框
watch(inputFormat, (fmt) => {
  inputValue.value = formatByKey(fmt)
  error.value = false
})

// ── vanilla-colorful picker 同步 ──
const pickerOpen = shallowRef(false)
const pickerAnchorRef = ref<HTMLElement | null>(null)
const pickerRef = ref<HTMLElement | null>(null)
const pickerPopupRef = ref<HTMLElement | null>(null)
const pickerStyle = shallowRef({ top: '0px', left: '0px', width: '0px' })

function syncPicker() {
  const el = pickerRef.value as any
  if (el)
    el.color = outHexa.value
}

function updatePickerPosition() {
  const anchor = pickerAnchorRef.value
  if (!anchor)
    return
  const rect = anchor.getBoundingClientRect()
  pickerStyle.value = {
    top: `${rect.bottom + window.scrollY + 8}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`,
  }
}

function togglePicker() {
  pickerOpen.value = !pickerOpen.value
  if (pickerOpen.value) {
    updatePickerPosition()
    nextTick(() => syncPicker())
  }
}

onClickOutside(pickerPopupRef, () => {
  pickerOpen.value = false
}, { ignore: [pickerAnchorRef] })

watch(pickerRef, (el) => {
  if (!el) {
    return
  }
  (el as any).addEventListener('color-changed', (e: CustomEvent) => {
    const hex8: string = e.detail.value
    const parsed = parseColor(hex8)
    if (parsed) {
      color.value = parsed
      inputValue.value = formatByKey(inputFormat.value)
      error.value = false
    }
  })
})

watch(color, () => {
  if (pickerOpen.value)
    syncPicker()
})

// ── EyeDropper 取色 ──
async function pickColor() {
  if (!('EyeDropper' in window))
    return
  try {
    // @ts-expect-error EyeDropper not in TS lib
    const eyeDropper = new window.EyeDropper()
    const result = await eyeDropper.open()
    onInput(result.sRGBHex)
  }
  catch {}
}

const eyeDropperSupported = 'EyeDropper' in window
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('input_label')">
      <div p-5 flex="~ col gap-4">
        <!-- 颜色长条 + 取色按钮 -->
        <div flex="~ gap-2" items-center>
          <div ref="pickerAnchorRef" flex-1 relative>
            <div
              border="~ c-border" rounded-xl h-12 w-full cursor-pointer relative overflow-hidden
              @click="togglePicker"
            >
              <div inset-0 absolute :style="checkerStyle" />
              <div transition-colors duration-300 inset-0 absolute :style="{ backgroundColor: previewColor }" />
              <!-- hex 文字 -->
              <div
                text-xs tracking-wider font-medium font-mono flex select-none transition-colors duration-300 items-center inset-0 justify-center absolute
                :style="{ color: previewTextColor }"
              >
                {{ outHex.toUpperCase() }}
              </div>
            </div>
          </div>
          <BaseButton
            v-if="eyeDropperSupported"
            icon="i-carbon-eyedropper"
            @click="pickColor"
          >
            {{ t('pick') }}
          </BaseButton>
        </div>

        <!-- Teleport picker 到 body，避免被 Panel overflow 裁剪 -->
        <Teleport to="body">
          <Transition name="picker">
            <div
              v-if="pickerOpen"
              ref="pickerPopupRef"

              :style="pickerStyle"
              border="~ c-border" p-3 rounded-2xl bg-c-surface fixed z-50
              style="box-shadow: 0 8px 24px rgba(0,0,0,0.12);"
            >
              <div text-xs tracking-wide font-medium mb-2 op-50 select-none uppercase>
                {{ t('color_picker') }}
              </div>
              <hex-alpha-color-picker ref="pickerRef" style="width: 100%; --cp-border-radius: 10px;" />
            </div>
          </Transition>
        </Teleport>

        <!-- 文字输入 -->
        <TextInput
          :model-value="inputValue"
          :error="error"
          :copyable="false"
          placeholder="#2dd4bfff / rgb(45, 212, 191, 1) / hsl(172, 66%, 50%, 1)"
          @update:model-value="onInput"
        >
          <template #append>
            <SelectInput
              v-model="inputFormat"
              :options="FORMAT_OPTIONS"
            />
          </template>
        </TextInput>
        <Transition name="warn">
          <AlertTip v-if="error" type="error">
            {{ t('invalid') }}
          </AlertTip>
        </Transition>
      </div>
    </Panel>

    <Panel :title="t('output_label')">
      <div p-5 flex="~ col gap-3">
        <TextInput
          v-for="out in outputs"
          :key="out.key"
          :model-value="out.value"
          :label="out.label"
          readonly
        />
      </div>
    </Panel>
  </div>
</template>

<style scoped>
.picker-enter-active,
.picker-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.picker-enter-from,
.picker-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
