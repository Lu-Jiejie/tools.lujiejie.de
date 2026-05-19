<script setup lang="ts">
import { watchEffect } from 'vue'

const props = defineProps<{
  options: { label: string, value: string }[]
  selectClass?: string
}>()

const model = defineModel<string>()

watchEffect(() => {
  if (props.options.length > 0 && !model.value)
    model.value = props.options[0].value
})
</script>

<template>
  <div text-sm inline-flex items-center relative>
    <select
      v-model="model" :class="selectClass"
      border="~ c-border hover:c-border-strong rounded-xl" p="l-3 r-8 y-2" select-base outline-none bg-c-input shrink-0 cursor-pointer transition-colors
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value" bg-c-surface>
        {{ opt.label }}
      </option>
    </select>
    <span class="i-carbon-chevron-down" op-60 pointer-events-none right-2 absolute aria-hidden="true" />
  </div>
</template>
