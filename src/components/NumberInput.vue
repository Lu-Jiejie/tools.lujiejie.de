<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: number
  min?: number
  max?: number
  size?: 'sm' | 'default'
}>(), {
  min: -Infinity,
  max: Infinity,
  size: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function clamp(n: number) {
  return Math.max(props.min, Math.min(props.max, n))
}

function onInput(e: Event) {
  const input = e.target as HTMLInputElement
  const n = Number.parseInt(input.value)
  if (!Number.isNaN(n)) {
    const clamped = clamp(n)
    input.value = String(clamped)
    emit('update:modelValue', clamped)
  }
}

function step(delta: number) {
  emit('update:modelValue', clamp(props.modelValue + delta))
}
</script>

<template>
  <div
    flex="~ gap-1" border="~ c-border" bg-c-input shrink-0 items-center overflow-hidden
    :class="size === 'sm' ? 'rounded-lg' : 'rounded-xl'"
  >
    <input
      :value="modelValue"
      type="number"
      :min="min"
      :max="max"
      class="no-spinner"
      :class="size === 'sm' ? 'px-2 py-1 w-10 text-xs' : 'px-3 py-2 w-14 text-sm'"
      font-mono text-center outline-none bg-transparent
      @change="onInput"
    >
    <div flex="~ col" border-l border-c-border self-stretch>
      <button
        border-b border-c-border op-40 flex flex-1 transition-opacity items-center justify-center hover:op-100
        :class="size === 'sm' ? 'px-1' : 'px-1.5'"
        @click="step(1)"
      >
        <div i-carbon-chevron-up text-xs />
      </button>
      <button
        op-40 flex flex-1 transition-opacity items-center justify-center hover:op-100
        :class="size === 'sm' ? 'px-1' : 'px-1.5'"
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
