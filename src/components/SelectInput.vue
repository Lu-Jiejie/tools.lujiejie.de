<script setup lang="ts">
import { watchEffect } from 'vue'

const props = defineProps<{
  options: { label: string, value: string }[]
  selectClass?: string
}>()

const model = defineModel<string>({
  required: true,
})

watchEffect(() => {
  if (props.options.length > 0 && !model.value) {
    model.value = props.options[0].value
  }
})
</script>

<template>
  <div text-sm inline-flex items-center relative>
    <select
      v-model="model"
      :class="selectClass"
      border="~ transparent rounded-xl"
      p="l-3.5 r-8 y-2.5"

      transition="colors duration-200"
      text-c-text select-base outline-none bg-c-input shrink-0 min-h-10 cursor-pointer hover:text-c-text focus:border-c-border-strong hover:border-c-border focus:bg-c-surface hover:bg-c-surface
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value" bg-c-surface>
        {{ opt.label }}
      </option>
    </select>
    <span class="i-carbon-chevron-down" text-xs text-c-text-muted pointer-events-none right-3.5 absolute aria-hidden="true" />
  </div>
</template>
