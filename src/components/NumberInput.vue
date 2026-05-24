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
    flex="~ items-center"
    border="~ transparent"

    transition="colors duration-200"
    bg-c-input shrink-0 overflow-hidden focus-within:border-c-border-strong hover:border-c-border focus-within:bg-c-surface hover:bg-c-surface
    :class="size === 'sm' ? 'rounded-lg' : 'rounded-xl'"
  >
    <input
      :value="modelValue"
      type="number"
      :min="min"
      :max="max"
      class="no-spinner"
      :class="size === 'sm' ? 'px-2 py-1 w-10 text-xs' : 'min-h-10 px-3.5 py-2.5 w-16 text-sm'"
      text-c-text font-mono text-center outline-none bg-transparent
      @change="onInput"
    >
    <div flex="~ col" border-l border-c-border self-stretch>
      <button

        flex="~ 1 items-center justify-center"
        text-c-text-muted border-b border-c-border hover:text-c-text hover:bg-c-raised
        transition="colors duration-200"
        :class="size === 'sm' ? 'px-1' : 'px-2'"
        @click="step(1)"
      >
        <div i-carbon-chevron-up text-xs />
      </button>
      <button
        flex="~ 1 items-center justify-center"
        text-c-text-muted hover:text-c-text hover:bg-c-raised
        transition="colors duration-200"
        :class="size === 'sm' ? 'px-1' : 'px-2'"
        @click="step(-1)"
      >
        <div i-carbon-chevron-down text-xs />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Hide number input spinners — UnoCSS cannot target these pseudo-elements */
.no-spinner::-webkit-inner-spin-button,
.no-spinner::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.no-spinner {
  -moz-appearance: textfield;
}
</style>
