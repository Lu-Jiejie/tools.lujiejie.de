<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import BaseButton from '~/components/BaseButton.vue'
import { useI18n } from '~/composables/useI18n'

const props = withDefaults(defineProps<{
  label?: string
  modelValue: string
  placeholder?: string
  error?: boolean
  readonly?: boolean
  copyable?: boolean
  monospace?: boolean
}>(), {
  copyable: true,
  monospace: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const slots = defineSlots<{
  prefix?: () => unknown
  append?: () => unknown
}>()

const { t } = useI18n({
  copy: ['Copy', '复制'],
  copied: ['Copied', '已复制'],
})

const copied = shallowRef(false)

async function copy() {
  if (!props.modelValue)
    return
  await navigator.clipboard.writeText(props.modelValue)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

const fieldClass = computed(() => [
  props.error ? 'border-red-400' : 'border-c-border',
  props.monospace ? 'font-mono' : '',
  props.readonly ? 'bg-c-input-readonly op-70' : 'bg-c-input focus:border-c-border-strong',
  slots.prefix ? 'pl-8' : '',
])
</script>

<template>
  <div flex="~ col gap-1.5">
    <label v-if="label" text-xs tracking-wide font-medium op-60 select-none uppercase>{{ label }}</label>
    <div flex="~ gap-2" items-center>
      <div flex flex-1 min-w-0 items-center relative>
        <slot name="prefix" />
        <input
          v-if="!readonly"
          :value="modelValue"
          :placeholder="placeholder"
          :class="fieldClass"
          border="~" text-sm px-3 py-2 outline-none rounded-xl w-full transition-colors
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        >
        <div
          v-else
          :class="fieldClass"
          border="~" text-sm px-3 py-2 rounded-xl min-h-9 w-full select-none whitespace-nowrap overflow-x-auto
        >
          {{ modelValue }}
        </div>
      </div>
      <slot name="append" />
      <BaseButton
        v-if="copyable"
        icon-only
        icon="i-carbon-copy"
        :title="t('copy')"
        @click="copy()"
      />
    </div>
  </div>
</template>
