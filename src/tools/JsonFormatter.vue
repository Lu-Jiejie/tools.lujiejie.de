<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'json-formatter',
  name: 'JSON Formatter',
  nameZh: 'JSON 格式化',
  description: 'Format, validate, and minify JSON data with syntax highlighting.',
  descriptionZh: '格式化、验证和压缩 JSON 数据，支持语法高亮。',
  category: 'format',
  keywords: ['json', 'format', 'validate', 'minify'],
})
</script>

<script setup lang="ts">
</script>

<template>
  <div text-sm p-6 op-60>
    JSON Formatter component logic goes here...
  </div>
</template>
