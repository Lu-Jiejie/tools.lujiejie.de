<script setup lang="ts">
import { computed } from 'vue'
import BaseButton from '~/components/input/BaseButton.vue'

type Val = number | string | boolean

// A compact left/right stepper: two buttons flanking a centred value.
// - Numeric mode (default): −/+ buttons step by `step`, clamped to [min, max],
//   and the matching arrow disables at a bound (unless `loop`).
// - Enum mode (pass `options`): ‹/› buttons cycle through the options and always
//   loop, so both sides switch endlessly — used for on/off style toggles.
const props = withDefaults(defineProps<{
  options?: { label: string, value: Val }[]
  min?: number
  max?: number
  step?: number
  unit?: string
  loop?: boolean
}>(), {
  step: 1,
  loop: false,
})

const model = defineModel<Val>({ required: true })

const isEnum = computed(() => Array.isArray(props.options) && props.options.length > 0)
// Enum always wraps; numeric only when explicitly asked.
const looping = computed(() => isEnum.value || props.loop)

const currentIndex = computed(() =>
  isEnum.value ? props.options!.findIndex(o => o.value === model.value) : -1)

const displayLabel = computed(() => {
  if (isEnum.value)
    return props.options![currentIndex.value]?.label ?? ''
  return `${model.value}`
})

const atMin = computed(() =>
  !looping.value && typeof model.value === 'number' && props.min !== undefined && model.value <= props.min)
const atMax = computed(() =>
  !looping.value && typeof model.value === 'number' && props.max !== undefined && model.value >= props.max)

function step(dir: -1 | 1) {
  if (isEnum.value) {
    const len = props.options!.length
    const idx = currentIndex.value < 0 ? 0 : currentIndex.value
    model.value = props.options![(idx + dir + len) % len].value
    return
  }
  if (typeof model.value !== 'number')
    return
  const min = props.min ?? Number.NEGATIVE_INFINITY
  const max = props.max ?? Number.POSITIVE_INFINITY
  let next = model.value + dir * props.step
  if (looping.value && props.min !== undefined && props.max !== undefined) {
    const span = max - min + props.step
    next = ((next - min) % span + span) % span + min
  }
  else {
    next = Math.min(max, Math.max(min, next))
  }
  model.value = next
}
</script>

<template>
  <div flex="~ items-center gap-2">
    <BaseButton
      icon-only
      :disabled="atMin"
      :icon="isEnum ? 'i-carbon-chevron-left' : 'i-carbon-subtract'"
      @click="step(-1)"
    />

    <span text="base c-text" font-mono text-center min-w-16 tabular-nums>
      {{ displayLabel }}<span v-if="unit && !isEnum" text="xs c-text-faint" ml-1>{{ unit }}</span>
    </span>

    <BaseButton
      icon-only
      :disabled="atMax"
      :icon="isEnum ? 'i-carbon-chevron-right' : 'i-carbon-add'"
      @click="step(1)"
    />
  </div>
</template>
