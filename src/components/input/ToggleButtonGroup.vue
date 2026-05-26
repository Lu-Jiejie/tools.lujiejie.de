<script setup lang="ts">
import { computed } from 'vue'

type OptionValue = string | number

const props = withDefaults(defineProps<{
  options: {
    label: string
    subLabel?: string
    value: OptionValue
  }[]
  multiple?: boolean
  required?: boolean
  columns?: number
}>(), {
  multiple: true,
  required: false,
})

const model = defineModel<OptionValue | OptionValue[] | undefined>({
  required: true,
})

const columnCount = computed(() => props.columns ?? props.options.length)
const groupRole = computed(() => props.multiple ? 'group' : 'radiogroup')

function isSelected(value: OptionValue) {
  return props.multiple
    ? Array.isArray(model.value) && model.value.includes(value)
    : model.value === value
}

function toggle(value: OptionValue) {
  if (!props.multiple) {
    if (model.value === value) {
      if (!props.required)
        model.value = undefined
      return
    }

    model.value = value
    return
  }

  const current = Array.isArray(model.value) ? model.value : []
  const exists = current.includes(value)

  if (exists) {
    if (
      props.required
      && current.length <= 1
    ) {
      return
    }

    model.value = current.filter(
      v => v !== value,
    )

    return
  }

  model.value = [
    ...current,
    value,
  ]
}
</script>

<template>
  <div
    :role="groupRole"
    border="~ c-border"
    p-1 rounded-xl bg-c-input gap-1 grid w-full
    :style="{
      gridTemplateColumns:
        `repeat(${columnCount}, minmax(0, 1fr))`,
    }"
  >
    <button
      v-for="o in options" :key="o.value" type="button"
      :aria-pressed="isSelected(o.value)"
      p="x-2.5 y-2.75" flex="~ col gap-0.75"
      border="~ transparent"
      text-center rounded-lg min-h-11 min-w-0 transition="colors duration-200"
      :class="
        isSelected(o.value)
          ? 'bg-c-surface border-c-border-strong text-c-accent'
          : 'text-c-text-muted hover:text-c-text hover:bg-c-surface hover:border-c-border'
      "
      @click="toggle(o.value)"
    >
      <span text-sm font-semibold truncate>
        {{ o.label }}
      </span>

      <span
        v-if="o.subLabel"
        text-xs text-c-text-faint op-70 block truncate
      >
        {{ o.subLabel }}
      </span>
    </button>
  </div>
</template>
