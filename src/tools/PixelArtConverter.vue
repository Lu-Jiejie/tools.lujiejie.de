<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'pixel-art-converter',
  name: 'Pixel Art Converter',
  nameZh: '像素画转换',
  description: 'Convert images into pixel art with configurable pixel density, grayscale mode, and palette-based color mapping.',
  descriptionZh: '将图片转换为像素画，支持配置像素密度、灰度模式和调色盘映射。',
  category: 'utility',
  keywords: ['pixel', 'pixelate', 'pixelart', 'retro', '8bit', 'image'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import {
  useDebounceFn,
} from '@vueuse/core'

import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
} from 'vue'

import BaseButton from '~/components/BaseButton.vue'
import CollapsibleExplainer from '~/components/container/CollapsibleExplainer.vue'
import LabelField from '~/components/container/LabelField.vue'
import Panel from '~/components/container/Panel.vue'
import CustomSelect from '~/components/CustomSelect.vue'
import SpringSlider from '~/components/SpringSlider.vue'
import ToggleButtonGroup from '~/components/ToggleButtonGroup.vue'
import { useI18n } from '~/composables/useI18n'

/**
 * =========================================================
 * i18n
 * =========================================================
 */

const { t } = useI18n({
  config: ['Configuration', '配置'],
  upload: ['Upload Image', '上传图片'],
  upload_hint: ['Click or drag an image here', '点击或拖拽图片到此处'],
  pixel_size: ['Pixel Density', '像素密度'],
  mode: ['Color Mode', '色彩模式'],
  mode_original: ['Original', '原色'],
  mode_palette: ['Palette', '调色盘'],
  mode_grayscale: ['Grayscale', '灰度'],
  palette: ['Palette', '调色盘'],
  output: ['Output', '输出'],
  output_size: ['Output Size', '输出尺寸'],
  download: ['Download Image', '下载图片'],
  no_image: ['Upload an image', '上传图片'],
  click_to_change: ['Click to change', '点击更换'],
  scale_1x: ['1x', '1x'],
  scale_2x: ['2x', '2x'],
  scale_4x: ['4x', '4x'],
  scale_8x: ['8x', '8x'],
  how_it_works: ['How It Works', '工作原理'],
  how_1_title: ['Based on giventofly/pixelit', '基于 giventofly/pixelit'],
  how_1_desc: [
    'This tool is powered by pixelit, an open-source JavaScript library for pixel-art conversion.',
    '本工具基于开源 JavaScript 库 pixelit 实现像素画转换功能。',
  ],
  how_2_title: ['Pixelation', '像素化'],
  how_2_desc: [
    'The image is first downscaled to a smaller resolution based on the pixel density slider, then upscaled back with nearest-neighbor interpolation to create crisp pixel blocks.',
    '先将图片按像素密度降低分辨率，再用最近邻插值放大，形成清晰的像素块效果。',
  ],
  how_3_title: ['Palette mode', '调色盘模式'],
  how_3_desc: [
    'Each pixel color is matched to the closest entry in the chosen palette using Euclidean color distance in RGB space.',
    '每个像素的颜色通过 RGB 空间中的欧几里得色差距离，匹配到调色盘中最接近的颜色。',
  ],
})

/**
 * =========================================================
 * Upload
 * =========================================================
 */

const fileInput = ref<HTMLInputElement>()

const uploadedImage
  = shallowRef<HTMLImageElement | null>(null)

const imageDataUrl = shallowRef('')

const isDragging = ref(false)

async function handleFile(file: File) {
  if (!file.type.startsWith('image/'))
    return

  const reader = new FileReader()

  reader.onload = () => {
    const src = reader.result as string

    imageDataUrl.value = src

    const img = new Image()

    img.onload = () => {
      uploadedImage.value = img
    }

    img.src = src
  }

  reader.readAsDataURL(file)
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement

  const file = input.files?.[0]

  if (file)
    handleFile(file)

  input.value = ''
}

function onDrop(e: DragEvent) {
  isDragging.value = false

  const file = e.dataTransfer?.files?.[0]

  if (file)
    handleFile(file)
}

/**
 * =========================================================
 * Config
 * =========================================================
 */

const pixelDensity = ref(12)

const colorMode = ref<'original' | 'color' | 'grayscale'>(
  'original',
)

type Palette = Array<
  [number, number, number]
>

const PALETTES: Palette[] = [
  [
    [7, 5, 5],
    [33, 25, 25],
    [82, 58, 42],
    [138, 107, 62],
    [193, 156, 77],
    [234, 219, 116],
    [160, 179, 53],
    [83, 124, 68],
    [66, 60, 86],
    [89, 111, 175],
    [107, 185, 182],
    [251, 250, 249],
    [184, 170, 176],
    [121, 112, 126],
    [148, 91, 40],
  ],
  [
    [13, 43, 69],
    [32, 60, 86],
    [84, 78, 104],
    [141, 105, 122],
    [208, 129, 89],
    [255, 170, 94],
    [255, 212, 163],
    [255, 236, 214],
  ],
  [
    [43, 15, 84],
    [171, 31, 101],
    [255, 79, 105],
    [255, 247, 248],
    [255, 129, 66],
    [255, 218, 69],
    [51, 104, 220],
    [73, 231, 236],
  ],
  [
    [48, 0, 48],
    [96, 40, 120],
    [248, 144, 32],
    [248, 240, 136],
  ],
  [
    [239, 26, 26],
    [172, 23, 23],
    [243, 216, 216],
    [177, 139, 139],
    [53, 52, 65],
    [27, 26, 29],
  ],
  [
    [26, 28, 44],
    [93, 39, 93],
    [177, 62, 83],
    [239, 125, 87],
    [255, 205, 117],
    [167, 240, 112],
    [56, 183, 100],
    [37, 113, 121],
    [41, 54, 111],
    [59, 93, 201],
    [65, 166, 246],
    [115, 239, 247],
    [244, 244, 244],
    [148, 176, 194],
    [86, 108, 134],
    [51, 60, 87],
  ],
  [
    [44, 33, 55],
    [118, 68, 98],
    [237, 180, 161],
    [169, 104, 104],
  ],
  [
    [171, 97, 135],
    [235, 198, 134],
    [216, 232, 230],
    [101, 219, 115],
    [112, 157, 207],
    [90, 104, 125],
    [33, 30, 51],
  ],
  [
    [140, 143, 174],
    [88, 69, 99],
    [62, 33, 55],
    [154, 99, 72],
    [215, 155, 125],
    [245, 237, 186],
    [192, 199, 65],
    [100, 125, 52],
    [228, 148, 58],
    [157, 48, 59],
    [210, 100, 113],
    [112, 55, 127],
    [126, 196, 193],
    [52, 133, 157],
    [23, 67, 75],
    [31, 14, 28],
  ],
  [
    [94, 96, 110],
    [34, 52, 209],
    [12, 126, 69],
    [68, 170, 204],
    [138, 54, 34],
    [235, 138, 96],
    [0, 0, 0],
    [92, 46, 120],
    [226, 61, 105],
    [170, 92, 61],
    [255, 217, 63],
    [181, 181, 181],
    [255, 255, 255],
  ],
  [
    [49, 31, 95],
    [22, 135, 167],
    [31, 213, 188],
    [237, 255, 177],
  ],
  [
    [21, 25, 26],
    [138, 76, 88],
    [217, 98, 117],
    [230, 184, 193],
    [69, 107, 115],
    [75, 151, 166],
    [165, 189, 194],
    [255, 245, 247],
  ],
]

const selectedPaletteIndex = ref('0')

const paletteOptions = PALETTES.map((palette, i) => ({
  value: String(i),
  label: `#${i + 1}`,
  palette,
}))

const activePalette = computed(() => PALETTES[Number(selectedPaletteIndex.value)])

const diffSliderPos = ref(50)
const isDraggingSlider = ref(false)

const outputScale = ref('4')

const outputScaleOptions = [
  { value: '1', label: t('scale_1x') },
  { value: '2', label: t('scale_2x') },
  { value: '4', label: t('scale_4x') },
  { value: '8', label: t('scale_8x') },
]

const explainItems = computed(() => [
  {
    title: t('how_1_title'),
    description: t('how_1_desc'),
    links: [
      { label: 'GitHub: giventofly/pixelit', href: 'https://github.com/giventofly/pixelit' },
    ],
  },
  {
    title: t('how_2_title'),
    description: t('how_2_desc'),
  },
  {
    title: t('how_3_title'),
    description: t('how_3_desc'),
  },
])

/**
 * =========================================================
 * Canvas
 * =========================================================
 */

const diffContainer = ref<HTMLDivElement>()

/**
 * Hold the upscaled pixel-art as a data URL for diff rendering
 */
const pixelArtDataUrl = shallowRef('')

/**
 * 复用 temp canvas
 */

const tempCanvas
  = document.createElement('canvas')

const tempCtx
  = tempCanvas.getContext('2d')!

/**
 * =========================================================
 * Color Cache
 * =========================================================
 */

const colorCache = new Map<
  string,
  [number, number, number]
>()

function findClosestColor(
  color: [number, number, number],
  palette: Palette,
): [number, number, number] {
  const key = color.join(',')

  const cached = colorCache.get(key)

  if (cached)
    return cached

  let best = palette[0]
  let bestDist = Infinity

  for (const c of palette) {
    const dr = color[0] - c[0]
    const dg = color[1] - c[1]
    const db = color[2] - c[2]

    const dist
      = dr * dr
        + dg * dg
        + db * db

    if (dist < bestDist) {
      bestDist = dist
      best = c
    }
  }

  colorCache.set(key, best)

  return best
}

/**
 * =========================================================
 * Generate
 * =========================================================
 */

async function generatePixelArt() {
  if (!uploadedImage.value)
    return

  await nextTick()

  const img = uploadedImage.value

  const natW = img.naturalWidth || img.width
  const natH = img.naturalHeight || img.height

  let scale = pixelDensity.value * 0.01
  if (natW > 1200 || natH > 1200)
    scale *= 0.5

  const scaledW = Math.max(1, Math.floor(natW * scale))
  const scaledH = Math.max(1, Math.floor(natH * scale))

  // Downscale
  tempCanvas.width = scaledW
  tempCanvas.height = scaledH
  tempCtx.clearRect(0, 0, scaledW, scaledH)
  tempCtx.drawImage(img, 0, 0, scaledW, scaledH)

  const imageData = tempCtx.getImageData(0, 0, scaledW, scaledH)
  const data = imageData.data

  // Grayscale
  if (colorMode.value === 'grayscale') {
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      data[i] = gray
      data[i + 1] = gray
      data[i + 2] = gray
    }
  }

  // Palette mapping
  if (colorMode.value === 'color' && activePalette.value) {
    const palette = activePalette.value
    colorCache.clear()
    for (let i = 0; i < data.length; i += 4) {
      const closest = findClosestColor([data[i], data[i + 1], data[i + 2]], palette)
      data[i] = closest[0]
      data[i + 1] = closest[1]
      data[i + 2] = closest[2]
    }
  }

  tempCtx.putImageData(imageData, 0, 0)

  const upscale = Number.parseInt(outputScale.value)
  const width = scaledW * upscale
  const height = scaledH * upscale

  // Always render to an offscreen canvas so pixelArtDataUrl stays fresh
  const offscreen = document.createElement('canvas')
  offscreen.width = width
  offscreen.height = height
  const offCtx = offscreen.getContext('2d')!
  offCtx.imageSmoothingEnabled = false
  offCtx.drawImage(tempCanvas, 0, 0, scaledW, scaledH, 0, 0, width, height)
  pixelArtDataUrl.value = offscreen.toDataURL('image/png')
}

/**
 * =========================================================
 * Diff mode – slider compare
 * =========================================================
 */

const diffNaturalW = ref(0)
const diffNaturalH = ref(0)

function applyDiffClip(percent: number) {
  const el = diffContainer.value
  if (!el)
    return

  const clamped = Math.max(0, Math.min(100, percent))
  diffSliderPos.value = clamped
  el.style.setProperty('--diff-clip', `${clamped}%`)
}

function getSliderPercent(clientX: number): number {
  const el = diffContainer.value
  if (!el)
    return 50

  const rect = el.getBoundingClientRect()
  return ((clientX - rect.left) / rect.width) * 100
}

function onSliderMouseDown(e: MouseEvent) {
  e.preventDefault()
  isDraggingSlider.value = true
  applyDiffClip(getSliderPercent(e.clientX))
}

function onSliderTouchStart(e: TouchEvent) {
  isDraggingSlider.value = true
  applyDiffClip(getSliderPercent(e.touches[0].clientX))
}

function onWindowMouseMove(e: MouseEvent) {
  if (!isDraggingSlider.value)
    return
  applyDiffClip(getSliderPercent(e.clientX))
}

function onWindowTouchMove(e: TouchEvent) {
  if (!isDraggingSlider.value)
    return
  applyDiffClip(getSliderPercent(e.touches[0].clientX))
}

function onWindowMouseUp() {
  isDraggingSlider.value = false
}

function onWindowTouchEnd() {
  isDraggingSlider.value = false
}

onMounted(() => {
  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('mouseup', onWindowMouseUp)
  window.addEventListener('touchmove', onWindowTouchMove, { passive: false })
  window.addEventListener('touchend', onWindowTouchEnd)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('mouseup', onWindowMouseUp)
  window.removeEventListener('touchmove', onWindowTouchMove)
  window.removeEventListener('touchend', onWindowTouchEnd)
})

function updateDiffSize() {
  if (!uploadedImage.value) {
    diffNaturalW.value = 0
    diffNaturalH.value = 0
    return
  }

  const img = uploadedImage.value
  const natW = img.naturalWidth || img.width
  const natH = img.naturalHeight || img.height
  const upscale = Number.parseInt(outputScale.value)

  // Store the upscaled pixel-art dimensions as the base aspect ratio.
  // The container will scale these down with object-contain naturally.
  diffNaturalW.value = natW * upscale
  diffNaturalH.value = natH * upscale
}

watch(
  [uploadedImage, outputScale],
  updateDiffSize,
)

/**
 * =========================================================
 * Debounced Generate
 * =========================================================
 */

const regenerate = useDebounceFn(
  generatePixelArt,
  16,
)

watch(
  [
    uploadedImage,
    pixelDensity,
    colorMode,
    selectedPaletteIndex,
    outputScale,
  ],
  regenerate,
)

/**
 * =========================================================
 * Download
 * =========================================================
 */

function downloadPng() {
  if (!pixelArtDataUrl.value)
    return
  const link = document.createElement('a')
  link.download = 'pixel-art.png'
  link.href = pixelArtDataUrl.value
  link.click()
}
</script>

<template>
  <div flex="~ col gap-4">
    <!-- Config -->

    <Panel :title="t('config')">
      <div p-5 flex="~ col gap-4">
        <!-- Upload -->

        <LabelField :label="t('upload')">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="sr-only"
            @change="onFileChange"
          >

          <div

            border="~ dashed c-border"

            bg="c-raised hover:c-surface"
            group rounded-2xl h-40 cursor-pointer transition-all duration-300 relative overflow-hidden
            @click="fileInput?.click()"
            @drop.prevent="onDrop"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
          >
            <!-- 空状态占位 -->
            <div
              v-if="!imageDataUrl"
              flex="~ items-center justify-center"
              inset-0 absolute
            >
              <div
                i-carbon-add
                text-3xl
                text-c-text-muted op-25
                transition-all duration-300
                group-hover:op-50 group-hover:scale-110
              />
            </div>

            <!-- 已上传图片 -->
            <img
              v-else
              :src="imageDataUrl"

              p-2 h-full w-full transition-all duration-300 inset-0 absolute object-contain
              class="group-hover:blur-[2px] group-hover:brightness-50"
            >

            <!-- hover 覆盖层 -->
            <div
              v-if="imageDataUrl"

              flex="~ col items-center justify-center gap-1.5"

              op-0 transition-all duration-300 inset-0 absolute group-hover:op-100
              bg="black/20"
            >
              <div i-carbon-image-search text-xl text-white op-80 />
              <span text-xs text-white tracking-wide font-medium>
                {{ t('click_to_change') }}
              </span>
            </div>
          </div>
        </LabelField>

        <!-- Density -->

        <LabelField :label="t('pixel_size')">
          <SpringSlider v-model="pixelDensity" :min="2" :max="50" :step="1" />
        </LabelField>

        <!-- Mode -->

        <LabelField :label="t('mode')">
          <ToggleButtonGroup
            v-model="colorMode"
            :options="[
              {
                value: 'original',
                label: t('mode_original'),
              },
              {
                value: 'grayscale',
                label: t('mode_grayscale'),
              },
              {
                value: 'color',
                label: t('mode_palette'),
              },
            ]"
            :multiple="false"
            required
          />
        </LabelField>

        <!-- Palette -->
        <LabelField v-if="colorMode === 'color'" :label="t('palette')">
          <CustomSelect
            v-model="selectedPaletteIndex"
            :options="paletteOptions"
          >
            <template #trigger="{ selected }">
              <div v-if="selected?.palette" flex="~ gap-0.5">
                <span
                  v-for="(c, idx) in selected.palette"
                  :key="idx"
                  rounded-sm size-3.5 border="~ black/15"
                  :style="{ background: `rgb(${c[0]},${c[1]},${c[2]})` }"
                />
              </div>
            </template>
            <template #option="{ option }">
              <div flex="~ gap-0.5">
                <span
                  v-for="(c, idx) in option.palette"
                  :key="idx"
                  rounded-sm size-3.5 border="~ black/15"
                  :style="{ background: `rgb(${c[0]},${c[1]},${c[2]})` }"
                />
              </div>
            </template>
          </CustomSelect>
        </LabelField>

        <!-- Output Size -->

        <LabelField :label="t('output_size')">
          <ToggleButtonGroup
            v-model="outputScale"
            :options="outputScaleOptions"
            :multiple="false"
            required
          />
        </LabelField>
      </div>
    </Panel>

    <!-- Output -->

    <Panel :title="t('output')">
      <div p-5 flex="~ col gap-4" items-center>
        <!-- Diff compare view -->
        <div
          v-if="uploadedImage"
          flex="~ col gap-3"
          w-full items-stretch
        >
          <div
            ref="diffContainer"

            border="~ c-border"

            rounded-xl w-full cursor-col-resize select-none relative overflow-hidden
            :style="{
              'aspectRatio': diffNaturalW && diffNaturalH ? `${diffNaturalW}/${diffNaturalH}` : undefined,
              '--diff-clip': `${diffSliderPos}%`,
            }"
            @mousedown="onSliderMouseDown"
            @touchstart.prevent="onSliderTouchStart"
          >
            <!-- 原图（底层 full-width） -->
            <img
              :src="imageDataUrl"
              class="diff-original"
              h-full w-full inset-0 absolute object-contain
            >

            <!-- 像素图（上层，clip 到 --diff-clip） -->
            <img
              v-if="pixelArtDataUrl"
              :src="pixelArtDataUrl"
              class="diff-pixelated [image-rendering:pixelated]"
              h-full w-full inset-0 absolute object-contain
            >

            <!-- 垂直分割线 -->
            <div
              bg="gray-800 dark:white" w-0.5 pointer-events-none bottom-0 top-0 absolute z-10
              :style="{ left: `${diffSliderPos}%`, transform: 'translateX(-50%)' }"
            />

            <!-- 拖拽手柄 -->
            <div
              top="50%"
              flex="~ items-center justify-center"
              rounded-full size-8 pointer-events-none shadow-lg absolute z-10
              bg="gray-800 dark:white"
              text="white dark:gray-800"
              :style="{ left: `${diffSliderPos}%`, transform: 'translate(-50%, -50%)' }"
            >
              <div i-carbon-arrows-horizontal text-sm />
            </div>
          </div>

          <BaseButton icon="i-carbon-download" @click="downloadPng">
            {{ t('download') }}
          </BaseButton>
        </div>

        <div
          v-else
          border="~ c-border"
          rounded-xl bg-c-raised h-40 w-full
          flex="~ items-center justify-center"
        >
          <span text-2xl text-c-text-muted tracking-widest op-30 select-none>
            ...
          </span>
        </div>
      </div>
    </Panel>

    <CollapsibleExplainer
      :title="t('how_it_works')"
      :items="explainItems"
    />
  </div>
</template>

<style scoped>
.diff-pixelated {
  clip-path: inset(0 0 0 var(--diff-clip, 50%));
}
</style>
