<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'image-color-extractor',
  name: 'Image Color Extractor',
  nameZh: '图片色调提取',
  description: 'Extract dominant color, palette and semantic swatches from images.',
  descriptionZh: '从图片中提取主色调、色板和语义色板。',
  category: 'design',
  keywords: [
    'color',
    'extract',
    'palette',
    'image',
    'dominant',
    'swatch',
    'colorthief',
  ],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import type { Color, Swatch, SwatchRole } from 'colorthief'
import { getColorSync, getPaletteSync, getSwatchesSync } from 'colorthief'
import { computed, shallowRef, watch } from 'vue'
import Markdown from '~/components/container/Markdown.vue'
import Panel from '~/components/container/Panel.vue'
import ImageUploadInput from '~/components/input/ImageUploadInput.vue'
import { useI18n } from '~/composables/useI18n'
import MD_EN from '~/contents/ImageColorExtractor.en.md?raw'
import MD_ZH from '~/contents/ImageColorExtractor.zh.md?raw'
import { hexToHsl, readableTextColor } from '~/utils/color'

type Format = 'hex' | 'rgb' | 'hsl'

const { t } = useI18n({
  'upload': ['Upload Image', '上传图片'],
  'dominant': ['Dominant Color', '主色调'],
  'palette': ['Palette', '色板'],
  'semantic': ['Semantic Swatches', '语义色板'],
  'change': ['Change Image', '更换图片'],
  'population': ['Population', '占比'],
  'no_match': ['No match', '无匹配'],

  'swatch.Vibrant': ['Vibrant', '鲜艳'],
  'swatch.Muted': ['Muted', '柔和'],
  'swatch.DarkVibrant': ['Dark Vibrant', '深色鲜艳'],
  'swatch.DarkMuted': ['Dark Muted', '深色柔和'],
  'swatch.LightVibrant': ['Light Vibrant', '浅色鲜艳'],
  'swatch.LightMuted': ['Light Muted', '浅色柔和'],
})

const uploadedImage = shallowRef<HTMLImageElement | null>(null)

// ── Extraction ──

interface SwatchEntry {
  role: SwatchRole
  label: string
  swatch: Swatch | null
}

const dominantColor = shallowRef<Color | null>(null)
const paletteList = shallowRef<Color[]>([])
const swatchEntries = shallowRef<SwatchEntry[]>([])
const hasResult = computed(() => dominantColor.value !== null)

function extractColors(img: HTMLImageElement) {
  dominantColor.value = getColorSync(img)
  paletteList.value = getPaletteSync(img, { colorCount: 8, quality: 10 }) || []
  const swatches = getSwatchesSync(img)
  swatchEntries.value = (Object.entries(swatches) as [SwatchRole, Swatch | null][])
    .map(([role, swatch]) => ({
      role,
      label: t(`swatch.${role}`),
      swatch,
    }))
}

watch(uploadedImage, (img) => {
  if (img)
    extractColors(img)
})

// ── Color helpers ──

function rgbText(color: Color) {
  const { r, g, b } = color.rgb()
  return `rgb(${r}, ${g}, ${b})`
}

function hslText(color: Color) {
  const { h, s, l } = hexToHsl(color.hex())
  return `hsl(${h}, ${s}%, ${l}%)`
}

function fmt(color: Color, format: Format) {
  if (format === 'hex')
    return color.hex().toUpperCase()
  if (format === 'rgb')
    return rgbText(color)
  return hslText(color)
}

function pct(c: Color) {
  return `${(c.proportion * 100).toFixed(1)}%`
}

// ── Copy ──

const copiedKey = shallowRef('')

async function copyColor(color: Color, format: Format) {
  const text = fmt(color, format)
  await navigator.clipboard.writeText(text)
  copiedKey.value = `${color.hex()}-${format}`
  setTimeout(() => (copiedKey.value = ''), 1200)
}

// ── Shared format list ──

const FORMATS: Format[] = ['hex', 'rgb', 'hsl']
</script>

<template>
  <div flex="~ col gap-6">
    <!-- Upload -->
    <Panel :title="t('upload')">
      <div p-5>
        <ImageUploadInput
          :change-label="t('change')"
          @update:image="uploadedImage = $event"
        />
      </div>
    </Panel>

    <template v-if="hasResult && dominantColor">
      <!-- ═══════════════════════════════════════════ -->
      <!--  Dominant Color                             -->
      <!-- ═══════════════════════════════════════════ -->
      <Panel :title="t('dominant')">
        <div p-5>
          <div flex="~ col lg:row gap-5" items-stretch>
            <!-- Swatch -->
            <div

              flex="~ col items-center justify-center gap-2"
              rounded-2xl flex-1 min-h-36 relative overflow-hidden lg:min-h-40
              :style="{ backgroundColor: dominantColor.hex() }"
            >
              <div
                rounded-2xl inset-0 absolute
                class="shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.05)]"
              />
              <span
                text="2xl lg:3xl" font="mono bold" tracking-wider px-4 text-center relative
                :style="{ color: readableTextColor(dominantColor.hex()) }"
                class="drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]"
              >
                {{ dominantColor.hex().toUpperCase() }}
              </span>
              <span
                text="sm" font="mono" tracking-wider op-60 relative
                :style="{ color: readableTextColor(dominantColor.hex()) }"
                class="drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
              >
                {{ pct(dominantColor) }}
              </span>
            </div>

            <!-- Info -->
            <div
              flex="~ col justify-center gap-4"
              p-5 rounded-2xl bg-c-raised w-full lg:w-72 border="~ c-border"
            >
              <div flex="~ col gap-0.5">
                <span text="xs c-text-muted" tracking-wider font-mono op-45 uppercase>HEX</span>
                <span text="base c-text" font="mono medium" tracking-wide>
                  {{ dominantColor.hex().toUpperCase() }}
                </span>
              </div>
              <div flex="~ col gap-0.5">
                <span text="xs c-text-muted" tracking-wider font-mono op-45 uppercase>RGB</span>
                <span text="base c-text" font="mono medium" tracking-wide>
                  {{ rgbText(dominantColor) }}
                </span>
              </div>
              <div flex="~ col gap-0.5">
                <span text="xs c-text-muted" tracking-wider font-mono op-45 uppercase>HSL</span>
                <span text="base c-text" font="mono medium" tracking-wide>
                  {{ hslText(dominantColor) }}
                </span>
              </div>
              <div flex="~ col gap-0.5">
                <span text="xs c-text-muted" tracking-wider font-mono op-45 uppercase>
                  {{ t('population') }}
                </span>
                <span text="base c-text" font="mono medium" tracking-wide>
                  {{ pct(dominantColor) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <!-- ═══════════════════════════════════════════ -->
      <!--  Palette                                    -->
      <!-- ═══════════════════════════════════════════ -->
      <Panel :title="t('palette')">
        <div p-5>
          <div grid="~ cols-1 sm:cols-2 lg:cols-4 gap-3">
            <div
              v-for="color in paletteList"
              :key="color.hex()"
              border="~ c-border" rounded-xl bg-c-surface overflow-hidden
            >
              <!-- Color block -->
              <div
                flex="~ col items-center justify-center gap-1"
                min-h-28 relative overflow-hidden
                :style="{ backgroundColor: color.hex() }"
              >
                <div
                  inset-0 absolute
                  class="shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.05)]"
                />
                <span
                  text="sm" font="mono medium" tracking-wider px-2 text-center relative
                  :style="{ color: readableTextColor(color.hex()) }"
                  class="drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
                >
                  {{ color.hex().toUpperCase() }}
                </span>
                <span
                  text="11px" font="mono" tracking-wider op-60 relative
                  :style="{ color: readableTextColor(color.hex()) }"
                  class="drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
                >
                  {{ pct(color) }}
                </span>
              </div>

              <!-- Copy row -->
              <div grid="~ cols-3 gap-1.5" p-2>
                <button
                  v-for="format in FORMATS" :key="format"
                  type="button"
                  border="~ c-border"
                  text="xs"
                  transition="colors duration-150"
                  font-mono
                  px-1.5 py-1.5 rounded-lg bg-c-raised select-none truncate hover:border-c-border-strong
                  :title="fmt(color, format)"
                  @click="copyColor(color, format)"
                >
                  <span>{{ format.toUpperCase() }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <!-- ═══════════════════════════════════════════ -->
      <!--  Semantic Swatches                          -->
      <!-- ═══════════════════════════════════════════ -->
      <Panel :title="t('semantic')">
        <div p-5>
          <div grid="~ cols-1 sm:cols-2 lg:cols-3 gap-4">
            <div
              v-for="entry in swatchEntries"
              :key="entry.role"
              border="~ c-border" rounded-xl bg-c-surface overflow-hidden
              :class="!entry.swatch ? 'op-35' : ''"
            >
              <!-- Color block — same pattern as palette -->
              <div
                v-if="entry.swatch"
                flex="~ col items-center justify-center gap-1"
                min-h-28 relative overflow-hidden
                :style="{ backgroundColor: entry.swatch.color.hex() }"
              >
                <div
                  inset-0 absolute
                  class="shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.05)]"
                />
                <span
                  text="base" font="sans medium" tracking-wide px-2 text-center relative
                  :style="{ color: readableTextColor(entry.swatch.color.hex()) }"
                  class="drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
                >
                  {{ entry.swatch.color.hex().toUpperCase() }}
                </span>
                <span
                  text="xs" font="medium" tracking-wider text-center op-65 relative
                  :style="{ color: readableTextColor(entry.swatch.color.hex()) }"
                  class="drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
                >
                  {{ entry.label }}
                </span>
              </div>

              <div v-else flex="~ items-center justify-center" min-h-28>
                <span text="xs c-text-muted" tracking-wider font-mono>{{ t('no_match') }}</span>
              </div>

              <!-- Copy row — same pattern as palette -->
              <div v-if="entry.swatch" grid="~ cols-3 gap-1.5" p-2>
                <button
                  v-for="format in FORMATS" :key="format"
                  type="button"
                  border="~ c-border"
                  text="xs"
                  transition="colors duration-150"
                  font-mono px-1.5 py-1.5 rounded-lg bg-c-raised select-none truncate hover:border-c-border-strong
                  :title="fmt(entry.swatch.color, format)"
                  @click="copyColor(entry.swatch.color, format)"
                >
                  <span>{{ format.toUpperCase() }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </template>

    <Panel :title="t('title.how_it_works')">
      <Markdown
        :content="[MD_EN, MD_ZH]"
      />
    </Panel>
  </div>
</template>
