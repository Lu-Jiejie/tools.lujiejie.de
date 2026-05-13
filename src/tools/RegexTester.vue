<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'regex-tester',
  name: 'Regex Tester',
  nameZh: '正则测试',
  description: 'Test and debug regular expressions with live match highlighting.',
  descriptionZh: '测试和调试正则表达式，实时高亮匹配结果。',
  category: 'text',
  keywords: ['regex', 'regexp', 'pattern', 'match'],
})
</script>

<script setup lang="ts">
</script>

<template>
  <div text-sm p-6 op-60>
    Regex Tester component logic goes here...
  </div>
</template>
