<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'base64',
  name: 'Base64',
  description: 'Encode and decode Base64 strings instantly.',
  category: 'encode',
  keywords: ['base64', 'encode', 'decode'],
})
</script>

<script setup lang="ts">
</script>

<template>
  <div class="text-sm text-c-muted p-6">
    Base64 component logic goes here...
  </div>
</template>
