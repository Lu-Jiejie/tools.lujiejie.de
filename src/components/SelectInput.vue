<script setup lang="ts">
import { watchEffect } from 'vue'

const props = defineProps<{
  options: { label: string, value: string }[]
}>()

const model = defineModel<string>()

watchEffect(() => {
  if (props.options.length > 0 && !model.value)
    model.value = props.options[0].value
})
</script>

<template>
  <select
    v-model="model"
    border="~ c-border hover:c-border-strong" text-sm px-3 py-2 select-base outline-none rounded-xl bg-c-input shrink-0 cursor-pointer transition-colors
    style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22%3E%3Cpath fill=%22%23aaa%22 d=%22M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z%22/%3E%3C/svg%3E'); background-position: right 8px center; background-size: 18px; padding-right: 2rem;"
  >
    <option v-for="opt in options" :key="opt.value" :value="opt.value" bg-c-surface>
      {{ opt.label }}
    </option>
  </select>
</template>
