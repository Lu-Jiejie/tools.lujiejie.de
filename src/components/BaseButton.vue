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
      disabled ? 'border-c-border op-40 cursor-not-allowed' : flashing ? 'border-c-accent text-c-accent bg-c-accent/15' : active ? 'border-c-accent text-c-accent bg-c-accent/8' : 'border-c-border hover:border-c-border-strong',
      iconOnly ? 'size-9.5' : 'px-3 py-2',
    ]"
    border="~" flex="~ gap-1.5" text-sm rounded-lg bg-c-raised items-center justify-center
    @click="!disabled && handleClick()"
  >
    <div v-if="icon" :class="[icon, iconOnly ? '' : 'op-60']" text-sm />
    <slot />
  </button>
</template>
