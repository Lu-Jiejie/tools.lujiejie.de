<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'text-replace',
  name: 'Text Replace',
  nameZh: '文本替换',
  description: 'Find and replace text with support for regex patterns.',
  descriptionZh: '查找和替换文本，支持正则表达式模式。',
  category: 'text',
  keywords: ['find', 'replace', 'regex', 'search'],
})
</script>

<script setup lang="ts">
</script>

<template>
  <div text-sm p-6 op-60>
    Text Replace component logic goes here...
  </div>
</template>
