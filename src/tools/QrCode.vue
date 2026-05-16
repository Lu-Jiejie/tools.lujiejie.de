<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'qr-code',
  name: 'QR Code Generator',
  nameZh: '二维码生成',
  description: 'Generate QR codes from text or URLs with customizable options.',
  descriptionZh: '从文本或链接生成二维码，支持自定义样式。',
  category: 'encode',
  keywords: ['qr', 'qrcode', 'barcode', 'scan'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { encode } from 'uqr'
import { computed, shallowRef } from 'vue'
import BaseButton from '~/components/BaseButton.vue'
import Panel from '~/components/Panel.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  input_label: ['Input', '输入'],
  output_label: ['Output', '输出'],
  placeholder: ['Enter text or URL', '输入文本或链接'],
  ecc: ['Error Correction', '容错等级'],
  fg_color: ['Foreground', '前景色'],
  bg_color: ['Background', '背景色'],
  download_svg: ['SVG', 'SVG'],
  download_png: ['PNG', 'PNG'],
  empty_hint: ['Enter content above to generate QR code', '在上方输入内容以生成二维码'],
})

const input = shallowRef('')
const fgColor = shallowRef('#000000')
const bgColor = shallowRef('#ffffff')

const ECC_LEVELS = ['L', 'M', 'Q', 'H'] as const
const ECC_LABELS = ['L 7%', 'M 15%', 'Q 25%', 'H 30%']
const eccIndex = shallowRef(1)
const eccLevel = computed(() => ECC_LEVELS[eccIndex.value])

const qrData = computed(() => {
  if (!input.value.trim())
    return null
  return encode(input.value, { ecc: eccLevel.value, border: 2 })
})

const svgContent = computed(() => {
  if (!qrData.value)
    return ''
  const { data, size } = qrData.value
  const rects: string[] = []
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (data[y][x])
        rects.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`)
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="${bgColor.value}"/><g fill="${fgColor.value}">${rects.join('')}</g></svg>`
})

const svgDataUrl = computed(() => {
  if (!svgContent.value)
    return ''
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent.value)}`
})

function downloadSvg() {
  if (!svgContent.value)
    return
  const blob = new Blob([svgContent.value], { type: 'image/svg+xml' })
  downloadBlob(blob, 'qrcode.svg')
}

function downloadPng() {
  if (!svgContent.value || !qrData.value)
    return
  const pngSize = 1024
  const canvas = document.createElement('canvas')
  canvas.width = pngSize
  canvas.height = pngSize
  const ctx = canvas.getContext('2d')!
  const img = new Image()
  img.onload = () => {
    ctx.drawImage(img, 0, 0, pngSize, pngSize)
    canvas.toBlob((blob) => {
      if (blob)
        downloadBlob(blob, 'qrcode.png')
    }, 'image/png')
  }
  img.src = svgDataUrl.value
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('input_label')">
      <div p-5 flex="~ col gap-4">
        <textarea
          v-model="input"
          :placeholder="t('placeholder')"
          border="~ c-border focus:c-border-strong" text-sm font-mono px-3 py-2 outline-none rounded-xl bg-c-input w-full resize-none transition-colors
          rows="3"
        />
        <div flex="~ gap-3 wrap" items-center>
          <div flex="~ gap-2" min-w-48 items-center>
            <span text-xs tracking-wide font-medium op-60 select-none uppercase>{{ t('ecc') }}</span>
            <input
              v-model.number="eccIndex"
              type="range"
              min="0"
              max="3"
              step="1"
              class="ecc-slider"
              flex-1 cursor-pointer
            >
            <span text-xs font-mono op-70 w-10>{{ ECC_LABELS[eccIndex] }}</span>
          </div>
          <div flex="~ gap-2" items-center>
            <span text-xs tracking-wide font-medium op-60 select-none uppercase>{{ t('fg_color') }}</span>
            <input
              v-model="fgColor"
              type="color"
              border="~ c-border" p-1 rounded-lg bg-c-input size-9 cursor-pointer
            >
          </div>
          <div flex="~ gap-2" items-center>
            <span text-xs tracking-wide font-medium op-60 select-none uppercase>{{ t('bg_color') }}</span>
            <input
              v-model="bgColor"
              type="color"
              border="~ c-border" p-1 rounded-lg bg-c-input size-9 cursor-pointer
            >
          </div>
        </div>
      </div>
    </Panel>

    <Panel :title="t('output_label')">
      <div p-5 flex="~ col gap-4" items-center>
        <img
          v-if="svgDataUrl"
          :src="svgDataUrl"
          alt="QR Code"
          rounded-xl h-64 w-64
          border="~ c-border"
        >
        <div v-else border="~ c-border" rounded-xl bg-white h-64 w-64 />
        <div flex="~ gap-2">
          <BaseButton icon="i-material-symbols-download" :disabled="!svgDataUrl" @click="downloadSvg">
            {{ t('download_svg') }}
          </BaseButton>
          <BaseButton icon="i-material-symbols-download" :disabled="!svgDataUrl" @click="downloadPng">
            {{ t('download_png') }}
          </BaseButton>
        </div>
      </div>
    </Panel>
  </div>
</template>

<style scoped>
.ecc-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: var(--c-border);
  outline: none;
}
.ecc-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--c-accent);
  border: 2px solid var(--c-surface);
  box-shadow: 0 0 0 1px var(--c-border);
  cursor: pointer;
}
.ecc-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--c-accent);
  border: 2px solid var(--c-surface);
  box-shadow: 0 0 0 1px var(--c-border);
  cursor: pointer;
}
.ecc-slider::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: var(--c-border);
}
</style>
