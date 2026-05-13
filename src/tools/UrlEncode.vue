<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'url-encode',
  name: 'URL Encode',
  nameZh: 'URL 编解码',
  description: 'Encode and decode URL components and query strings.',
  descriptionZh: '对 URL 组件和查询字符串进行编码和解码。',
  category: 'encode',
  keywords: ['url', 'encode', 'decode', 'percent', 'uri'],
})
</script>

<script setup lang="ts">
</script>

<template>
  <div text-sm p-6 op-60>
    URL Encode component logic goes here...
  </div>
</template>
