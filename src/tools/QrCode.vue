<script lang="ts">
import LabelField from '~/components/container/LabelField.vue'
import ToggleButtonGroup from '~/components/input/ToggleButtonGroup.vue'
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'qr-code',
  name: 'QR Code Generator',
  nameZh: '二维码生成',
  description: 'Generate QR codes from text or URLs with customizable options.',
  descriptionZh: '从文本或链接生成二维码，支持自定义样式。',
  category: 'generate',
  keywords: ['qr', 'qrcode', 'barcode', 'scan'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { encode } from 'uqr'
import { computed, ref, shallowRef } from 'vue'
import Panel from '~/components/container/Panel.vue'
import BaseButton from '~/components/input/BaseButton.vue'
import TextareaInput from '~/components/input/TextareaInput.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  input_label: ['Input', '输入'],
  content: ['Content', '内容'],
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

const ECC_OPTIONS = [
  { value: 'L', label: 'L', subLabel: '7%' },
  { value: 'M', label: 'M', subLabel: '15%' },
  { value: 'Q', label: 'Q', subLabel: '25%' },
  { value: 'H', label: 'H', subLabel: '30%' },
]
const eccLevel = ref<'L' | 'M' | 'Q' | 'H'>('M')

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
        <LabelField :label="t('content')">
          <TextareaInput
            id="qr-content"
            v-model="input"
            :placeholder="t('placeholder')"
            :rows="3"
            resize="none"
          />
        </LabelField>

        <LabelField :label="t('ecc')">
          <ToggleButtonGroup
            v-model="eccLevel"
            :options="ECC_OPTIONS"
            :multiple="false"
            required
          />
        </LabelField>

        <div grid="~ cols-2 gap-4">
          <LabelField :label="t('fg_color')">
            <div flex="~ gap-4" border="~ c-border" p-3 rounded-xl bg-c-input items-center>
              <input
                id="qr-fg-color"
                v-model="fgColor"
                type="color"
                border="~ c-border" p-1 rounded-lg bg-c-surface shrink-0 size-10 cursor-pointer
              >
              <span text-sm font-mono op-70 truncate>{{ fgColor.toUpperCase() }}</span>
            </div>
          </LabelField>

          <LabelField :label="t('bg_color')">
            <div flex="~ gap-4" border="~ c-border" p-3 rounded-xl bg-c-input items-center>
              <input
                id="qr-bg-color"
                v-model="bgColor"
                type="color"
                border="~ c-border" p-1 rounded-lg bg-c-surface shrink-0 size-10 cursor-pointer
              >
              <span text-sm font-mono op-70 truncate>{{ bgColor.toUpperCase() }}</span>
            </div>
          </LabelField>
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
