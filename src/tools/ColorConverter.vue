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

<script setup lang="ts">
</script>

<template>
  <div text-sm p-6 op-60>
    Color Converter component logic goes here...
  </div>
</template>
