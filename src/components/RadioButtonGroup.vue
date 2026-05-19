<script setup lang="ts">
defineProps<{
  options: { label: string, subLabel?: string, value: string | number } []
}>()

const model = defineModel<string | number>({
  required: true,
})
</script>

<template>
  <div
    role="radiogroup"
    flex="~ gap-1"
    border="~ c-border" p-1 rounded-lg bg-c-input
  >
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      :aria-pressed="model === o.value"
      flex="1 col gap-0.5" p="x-2 y-1.5" text-center rounded-md op-90 min-w-0 transition-colors
      :class="model === o.value ? 'bg-c-accent text-white dark:text-black shadow-sm' : 'hover:bg-c-raised  hover:op-100'"
      @click="model = o.value"
    >
      <span text-xs font-semibold>{{ o.label }}</span>
      <span v-if="o.subLabel" text-xs op-60 block>{{ o.subLabel }}</span>
    </button>
  </div>
</template>
