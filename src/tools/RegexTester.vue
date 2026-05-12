<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'regex-tester',
  name: 'Regex Tester',
  description: 'Test and debug regular expressions with live match highlighting.',
  category: 'text',
  keywords: ['regex', 'regexp', 'pattern', 'match'],
})
</script>

<script setup lang="ts">
</script>

<template>
  <div class="text-sm text-c-muted p-6">
    Regex Tester component logic goes here...
  </div>
</template>
