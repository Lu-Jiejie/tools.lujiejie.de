<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import BaseButton from '~/components/input/BaseButton.vue'
import { useI18n } from '~/composables/useI18n'

type InputMode = 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  error?: boolean
  readonly?: boolean
  copyable?: boolean
  backspaceable?: boolean
  monospace?: boolean
  secret?: boolean
  allowedChars?: RegExp
  normalize?: 'lowercase' | 'uppercase'
  maxlength?: number
  pattern?: string
  inputmode?: InputMode
  autocomplete?: string
  size?: 'default' | 'lg'
  align?: 'left' | 'center'
  tracking?: 'normal' | 'wide' | 'widest'
  tabular?: boolean
}>(), {
  copyable: true,
  monospace: true,
  size: 'default',
  align: 'left',
  tracking: 'normal',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'enter': []
  'focus': []
  'blur': []
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

function normalizeValue(value: string): string {
  let next = value
  if (props.normalize === 'lowercase')
    next = next.toLowerCase()
  if (props.normalize === 'uppercase')
    next = next.toUpperCase()

  if (props.allowedChars) {
    next = Array.from(next).filter((char) => {
      props.allowedChars!.lastIndex = 0
      return props.allowedChars!.test(char)
    }).join('')
  }

  if (typeof props.maxlength === 'number')
    next = next.slice(0, props.maxlength)

  return next
}

function handleInput(event: Event) {
  const input = event.target as HTMLInputElement
  const next = normalizeValue(input.value)
  input.value = next
  emit('update:modelValue', next)
}

const fieldClass = computed(() => [
  props.error ? 'border-red-400 text-red-500 focus:border-red-400' : 'border-transparent text-c-text',
  props.monospace ? 'font-mono' : '',
  props.readonly ? 'bg-c-input-readonly text-c-text-muted' : 'bg-c-input hover:bg-c-surface hover:border-c-border focus:border-c-border-strong focus:bg-c-surface',
  slots.prefix ? 'pl-8' : '',
  props.size === 'lg' ? 'min-h-12 text-xl px-4 py-3' : 'min-h-10 text-sm px-3.5 py-2.5',
  props.align === 'center' ? 'text-center' : '',
  props.tracking === 'wide' ? 'tracking-wide' : '',
  props.tracking === 'widest' ? 'tracking-widest' : '',
  props.tabular ? 'tabular-nums' : '',
])
</script>

<template>
  <div flex="~ items-center gap-2">
    <div flex="~ 1 items-center" min-w-0 relative>
      <slot name="prefix" />
      <input
        v-if="!readonly"
        :value="modelValue"
        :type="secret && !visible ? 'password' : 'text'"
        :autocomplete="autocomplete ?? (secret ? 'off' : undefined)"
        :inputmode="inputmode"
        :maxlength="maxlength"
        :pattern="pattern"
        :placeholder="placeholder"
        :class="fieldClass"
        outline-none border rounded-xl w-full
        transition="colors duration-200"
        placeholder-op-38
        @input="handleInput"
        @keydown.enter="emit('enter')"
        @focus="emit('focus')"
        @blur="emit('blur')"
      >
      <div
        v-else
        :class="fieldClass"
        border rounded-xl min-h-10 w-full select-none whitespace-nowrap overflow-x-auto
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
