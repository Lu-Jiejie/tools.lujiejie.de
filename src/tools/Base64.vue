<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'base64',
  name: 'Base64',
  nameZh: 'Base64 编解码',
  description: 'Encode and decode Base64 strings instantly.',
  descriptionZh: '快速进行 Base64 编码和解码。',
  category: 'encode',
  keywords: ['base64', 'encode', 'decode'],
})
</script>

<script setup lang="ts">
</script>

<template>
  <div text-sm p-6 op-60>
    Base64 component logic goes here...
  </div>
</template>
