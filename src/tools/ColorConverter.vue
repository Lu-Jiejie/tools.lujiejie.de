<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'color-converter',
  name: 'Color Converter',
  description: 'Convert colors between HEX, RGB, HSL, and other formats.',
  category: 'convert',
  keywords: ['color', 'hex', 'rgb', 'hsl', 'convert'],
})
</script>

<script setup lang="ts">
</script>

<template>
  <div class="text-sm text-c-muted p-6">
    Color Converter component logic goes here...
  </div>
</template>
