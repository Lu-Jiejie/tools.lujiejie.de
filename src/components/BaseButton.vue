<script setup lang="ts">
import { shallowRef } from 'vue'

const props = withDefaults(defineProps<{
  label?: string
  icon?: string
  active?: boolean
  iconOnly?: boolean
  disabled?: boolean
}>(), {})

const emit = defineEmits<{
  click: []
}>()

const flashing = shallowRef(false)

function handleClick() {
  if (!props.active) {
    flashing.value = true
    setTimeout(() => (flashing.value = false), 200)
  }
  emit('click')
}
</script>

<template>
  <button
    :disabled="disabled"
    :class="[
      disabled ? 'border-transparent text-c-text-faint bg-c-input op-50 cursor-not-allowed' : flashing ? 'border-c-accent text-c-accent bg-c-soft' : active ? 'border-c-accent text-c-accent bg-c-soft' : 'border-transparent text-c-text bg-c-input hover:border-c-border hover:bg-c-surface',
      iconOnly ? 'size-10' : 'min-h-10 px-4 py-2.5',
    ]"
    border="~"
    flex="~ items-center justify-center gap-1.5"

    transition="colors duration-200"
    text-sm font-medium outline-none rounded-xl focus-visible:border-c-border-strong focus-visible:bg-c-surface
    @click="!disabled && handleClick()"
  >
    <div v-if="icon" :class="[icon, iconOnly ? '' : 'op-70']" text-sm />
    <slot />
  </button>
</template>
