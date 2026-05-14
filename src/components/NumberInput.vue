<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: number
  min?: number
  max?: number
}>(), {
  min: -Infinity,
  max: Infinity,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function clamp(n: number) {
  return Math.max(props.min, Math.min(props.max, n))
}

function onInput(e: Event) {
  const n = Number.parseInt((e.target as HTMLInputElement).value)
  if (!Number.isNaN(n))
    emit('update:modelValue', clamp(n))
}

function step(delta: number) {
  emit('update:modelValue', clamp(props.modelValue + delta))
}
</script>

<template>
  <div flex="~ gap-1" border="~ c-border" rounded-xl bg-c-input shrink-0 items-center overflow-hidden>
    <input
      :value="modelValue"
      type="number"
      :min="min"
      :max="max"
      class="no-spinner"
      text-sm font-mono px-3 py-2 text-center outline-none bg-transparent w-14
      @change="onInput"
    >
    <div flex="~ col" border-l border-c-border self-stretch>
      <button
        px-1.5 border-b border-c-border op-40 flex flex-1 transition-opacity items-center justify-center hover:op-100
        @click="step(1)"
      >
        <div i-carbon-chevron-up text-xs />
      </button>
      <button
        px-1.5 op-40 flex flex-1 transition-opacity items-center justify-center hover:op-100
        @click="step(-1)"
      >
        <div i-carbon-chevron-down text-xs />
      </button>
    </div>
  </div>
</template>

<style scoped>
.no-spinner::-webkit-inner-spin-button,
.no-spinner::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.no-spinner {
  -moz-appearance: textfield;
}
</style>
