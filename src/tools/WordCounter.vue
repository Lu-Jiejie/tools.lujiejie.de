<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'word-counter',
  name: 'Word Counter',
  description: 'Count words, characters, sentences, and estimate reading time.',
  category: 'text',
  keywords: ['word', 'count', 'character', 'reading'],
})
</script>

<script setup lang="ts">
</script>

<template>
  <div class="text-sm text-c-muted p-6">
    Word Counter component logic goes here...
  </div>
</template>
