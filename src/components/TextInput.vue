<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import BaseButton from '~/components/BaseButton.vue'
import { useI18n } from '~/composables/useI18n'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  error?: boolean
  readonly?: boolean
  copyable?: boolean
  backspaceable?: boolean
  monospace?: boolean
  secret?: boolean
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

const visible = shallowRef(false)

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

let longPressTimer: ReturnType<typeof setTimeout> | null = null

function onBackspacePointerDown() {
  longPressTimer = setTimeout(() => {
    longPressTimer = null
    emit('update:modelValue', '')
  }, 500)
}

function onBackspacePointerUp() {
  if (longPressTimer !== null) {
    clearTimeout(longPressTimer)
    longPressTimer = null
    emit('update:modelValue', props.modelValue.slice(0, -1))
  }
}

function onBackspacePointerLeave() {
  if (longPressTimer !== null) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

const fieldClass = computed(() => [
  props.error ? 'border-red-400' : 'border-c-border',
  props.monospace ? 'font-mono' : '',
  props.readonly ? 'bg-c-input-readonly op-70' : 'bg-c-input focus:border-c-border-strong',
  slots.prefix ? 'pl-8' : '',
])
</script>

<template>
  <div flex="~ gap-2" items-center>
    <div flex="~ 1" min-w-0 items-center relative>
      <slot name="prefix" />
      <input
        v-if="!readonly"
        :value="modelValue"
        :type="secret && !visible ? 'password' : 'text'"
        :autocomplete="secret ? 'off' : undefined"
        :placeholder="placeholder"
        :class="fieldClass"
        text-sm px-3 py-2 outline-none border rounded-xl w-full transition-colors
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      >
      <div
        v-else
        :class="fieldClass"
        text-sm px-3 py-2 border rounded-xl min-h-9 w-full select-none whitespace-nowrap overflow-x-auto
      >
        {{ secret && !visible ? '•'.repeat(modelValue.length) : modelValue }}&nbsp;
      </div>
    </div>
    <slot name="append" />
    <BaseButton
      v-if="backspaceable"
      icon-only
      icon="i-ph-backspace"
      @pointerdown="onBackspacePointerDown"
      @pointerup="onBackspacePointerUp"
      @pointerleave="onBackspacePointerLeave"
    />
    <BaseButton
      v-if="secret"
      icon-only
      :icon="visible ? 'i-material-symbols-visibility-off' : 'i-material-symbols-visibility'"
      @click="visible = !visible"
    />
    <BaseButton
      v-if="copyable"
      icon-only
      icon="i-carbon-copy"
      :title="t('copy')"
      @click="copy()"
    />
  </div>
</template>

<style scoped>
/* MS Edge / Chrome password reveal button — UnoCSS cannot target these pseudo-elements */
input::-ms-reveal,
input::-webkit-credentials-auto-fill-button {
  display: none;
}
</style>
