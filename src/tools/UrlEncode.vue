<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'url-encode',
  name: 'URL Encode',
  description: 'Encode and decode URL components and query strings.',
  category: 'encode',
  keywords: ['url', 'encode', 'decode', 'percent', 'uri'],
})
</script>

<script setup lang="ts">
</script>

<template>
  <div class="text-sm text-c-muted p-6">
    URL Encode component logic goes here...
  </div>
</template>
