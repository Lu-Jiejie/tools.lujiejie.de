<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'json-formatter',
  name: 'JSON Formatter',
  description: 'Format, validate, and minify JSON data with syntax highlighting.',
  category: 'format',
  keywords: ['json', 'format', 'validate', 'minify'],
})
</script>

<script setup lang="ts">
</script>

<template>
  <div class="text-sm text-c-muted p-6">
    JSON Formatter component logic goes here...
  </div>
</template>
