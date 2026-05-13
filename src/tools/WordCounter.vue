<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'word-counter',
  name: 'Word Counter',
  nameZh: '字数统计',
  description: 'Count words, characters, sentences, and estimate reading time.',
  descriptionZh: '统计字数、字符数、句子数，估算阅读时间。',
  category: 'text',
  keywords: ['word', 'count', 'character', 'reading'],
})
</script>

<script setup lang="ts">
</script>

<template>
  <div text-sm p-6 op-60>
    Word Counter component logic goes here...
  </div>
</template>
