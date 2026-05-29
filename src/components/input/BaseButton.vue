<script setup lang="ts">
withDefaults(defineProps<{
  icon?: string
  active?: boolean
  activeClass?: string
  iconOnly?: boolean
  disabled?: boolean
}>(), {})

const emit = defineEmits<{
  click: []
}>()

function handleClick() {
  emit('click')
}
</script>

<template>
  <button
    :disabled="disabled"
    :class="[
      disabled ? 'border-transparent text-c-text-faint bg-c-input op-50 cursor-not-allowed' : active ? `border-c-accent text-c-accent bg-c-soft ${activeClass ?? ''}` : 'border-transparent text-c-text bg-c-input hover:border-c-border hover:bg-c-surface',
      iconOnly ? 'size-10' : 'min-h-10 px-4 py-2.5',
    ]"
    border="~"
    flex="~ items-center justify-center gap-1.5"
    transition="colors duration-200"
    text-sm font-medium outline-none rounded-xl select-none
    focus-visible:border-c-border-strong focus-visible:bg-c-surface
    @click="!disabled && handleClick()"
  >
    <div v-if="icon" :class="[icon, iconOnly ? '' : 'op-70']" text-sm />
    <slot />
  </button>
</template>
