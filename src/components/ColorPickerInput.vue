<script setup lang="ts">
import { onClickOutside, useEventListener } from '@vueuse/core'
import { nextTick, ref, shallowRef, watch } from 'vue'
import TextInput from './TextInput.vue'
import 'vanilla-colorful/hex-alpha-color-picker.js'

const props = withDefaults(defineProps<{
  modelValue: string
  previewColor: string
  pickerColor?: string
  textColor?: string
  swatchLabel?: string
  placeholder?: string
  error?: boolean
  copyable?: boolean
  readonly?: boolean
}>(), {
  textColor: 'currentColor',
  swatchLabel: '',
  placeholder: '',
  error: false,
  copyable: false,
  readonly: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'pick': [value: string]
}>()

const slots = defineSlots<{
  append?: () => unknown
}>()

const pickerOpen = shallowRef(false)
const anchorRef = ref<HTMLElement | null>(null)
const pickerRef = ref<HTMLElement | null>(null)
const popupRef = ref<HTMLElement | null>(null)
const popupStyle = shallowRef({ top: '0px', left: '0px', width: '0px' })

const checkerStyle = {
  backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
  backgroundSize: '8px 8px',
  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
}

function updatePopupPosition() {
  if (!pickerOpen.value)
    return

  const anchor = anchorRef.value
  if (!anchor)
    return

  const rect = anchor.getBoundingClientRect()
  popupStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  }
}

function syncPicker() {
  const picker = pickerRef.value as HTMLElement & { color?: string } | null
  if (picker)
    picker.color = props.pickerColor || props.previewColor
}

function togglePicker() {
  pickerOpen.value = !pickerOpen.value
  if (pickerOpen.value) {
    updatePopupPosition()
    nextTick(() => syncPicker())
  }
}

function updateValue(value: string) {
  if (props.readonly)
    return
  emit('update:modelValue', value)
}

onClickOutside(popupRef, () => {
  pickerOpen.value = false
}, { ignore: [anchorRef] })

useEventListener(window, 'scroll', updatePopupPosition, { passive: true, capture: true })
useEventListener(window, 'resize', updatePopupPosition, { passive: true })

watch(pickerRef, (picker) => {
  if (!picker)
    return

  picker.addEventListener('color-changed', (event) => {
    if (props.readonly)
      return
    const hex8 = (event as CustomEvent<{ value: string }>).detail.value
    emit('update:modelValue', hex8)
    emit('pick', hex8)
  })
})

watch(() => [props.previewColor, props.pickerColor], () => {
  if (pickerOpen.value)
    syncPicker()
})
</script>

<template>
  <div flex="~ col gap-2">
    <button
      ref="anchorRef"
      type="button"
      border="~ c-border" rounded-xl h-12 w-full cursor-pointer relative overflow-hidden
      @click="togglePicker"
    >
      <div inset-0 absolute :style="checkerStyle" />
      <div transition-colors duration-300 inset-0 absolute :style="{ backgroundColor: previewColor }" />
      <div
        text-xs tracking-wider font-medium font-mono flex select-none transition-colors duration-300 items-center inset-0 justify-center absolute
        :style="{ color: textColor }"
      >
        {{ swatchLabel || modelValue }}
      </div>
    </button>

    <TextInput
      :model-value="modelValue"
      :error="error"
      :copyable="copyable"
      :readonly="readonly"
      :placeholder="placeholder"
      @update:model-value="updateValue"
    >
      <template v-if="slots.append" #append>
        <slot name="append" />
      </template>
    </TextInput>

    <Teleport to="body">
      <Transition name="picker">
        <div
          v-if="pickerOpen"
          ref="popupRef"
          :style="popupStyle"
          border="~ c-border" p-3 rounded-2xl bg-c-surface fixed z-50
          class="color-picker-popup"
        >
          <hex-alpha-color-picker
            ref="pickerRef"
            :class="{ 'pointer-events-none': readonly }"
            style="width: 100%; --cp-border-radius: 10px;"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Vue <Transition> classes and popup shadow are component-local visual behavior. */
.picker-enter-active,
.picker-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.picker-enter-from,
.picker-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
.color-picker-popup {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
</style>
