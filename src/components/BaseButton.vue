<script setup lang="ts">
withDefaults(defineProps<{
  label?: string
  icon?: string
}>(), {})

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    border="~ c-border" flex="~ gap-1.5" text-sm px-3 py-1.5 rounded-lg bg-c-raised transition-colors items-center hover:border-c-border-strong
    @click="emit('click')"
  >
    <div v-if="icon" :class="icon" text-sm op-60 />
    <slot />
  </button>
</template>
