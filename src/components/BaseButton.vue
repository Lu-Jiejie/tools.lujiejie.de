<script setup lang="ts">
withDefaults(defineProps<{
  label?: string
  icon?: string
  active?: boolean
}>(), {})

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    :class="active ? 'border-c-accent text-c-accent bg-c-accent/8' : 'border-c-border hover:border-c-border-strong'"
    border="~" flex="~ gap-1.5" text-sm px-3 py-1.5 rounded-lg bg-c-raised transition-colors items-center
    @click="emit('click')"
  >
    <div v-if="icon" :class="icon" text-sm op-60 />
    <slot />
  </button>
</template>
