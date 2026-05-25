<script setup lang="ts" generic="T extends Record<string, any>">
import type {
  CSSProperties,
} from 'vue'

import {
  onClickOutside,
  useEventListener,
} from '@vueuse/core'
import {
  computed,
  nextTick,
  onMounted,
  ref,
  useSlots,
  watch,
} from 'vue'

/**
 * =========================================================
 * Types
 * =========================================================
 */

type Option = T & {
  label: string
  value: string
  disabled?: boolean
}

/**
 * =========================================================
 * Props
 * =========================================================
 */

const props = withDefaults(
  defineProps<{
    options: Option[]
    placeholder?: string
    disabled?: boolean
    width?: number | string
  }>(),
  {
    placeholder: 'Select...',
    width: 'auto',
  },
)

/**
 * =========================================================
 * Model
 * =========================================================
 */

const model = defineModel<string>({
  required: true,
})

/**
 * =========================================================
 * State
 * =========================================================
 */

const slots = useSlots()
const open = ref(false)
const triggerRef = ref<HTMLElement>()
const dropdownRef = ref<HTMLElement>()
const dropdownRect = ref<DOMRect | null>(null)
const measureRef = ref<HTMLElement>()
const triggerWidth = ref<number | null>(null)

const hasTriggerSlot = computed(() => !!slots.trigger)

/**
 * =========================================================
 * Measure max content width (text mode only)
 * =========================================================
 */

function measureMaxWidth() {
  const container = measureRef.value
  if (!container)
    return

  let max = 0
  const texts = [props.placeholder, ...props.options.map(o => o.label)]

  for (const text of texts) {
    container.textContent = text
    max = Math.max(max, container.scrollWidth)
  }

  triggerWidth.value = max + 60
}

onMounted(() => {
  if (!hasTriggerSlot.value) {
    requestAnimationFrame(() => {
      measureMaxWidth()
    })
  }
})

watch(() => props.options, () => {
  if (!hasTriggerSlot.value) {
    nextTick(measureMaxWidth)
  }
}, { deep: true })
/**
 * =========================================================
 * Selected
 * =========================================================
 */

const selectedOption = computed(() =>
  props.options.find(o => o.value === model.value),
)

/**
 * =========================================================
 * Trigger Position
 * =========================================================
 */

/**
 * =========================================================
 * Dropdown Position
 * =========================================================
 */

const dropdownStyle = computed<CSSProperties>(() => {
  const rect = dropdownRect.value
  if (!rect)
    return {}

  const dropdownMaxHeight = 320

  const shouldFlip
    = window.innerHeight - rect.bottom < dropdownMaxHeight

  return {
    position: 'fixed',
    left: `${rect.left}px`,
    width: typeof props.width === 'number'
      ? `${props.width}px`
      : triggerWidth.value
        ? `${triggerWidth.value}px`
        : `${rect.width}px`,

    top: shouldFlip
      ? undefined
      : `${rect.bottom + 2}px`,

    bottom: shouldFlip
      ? `${window.innerHeight - rect.top + 2}px`
      : undefined,
  }
})

/**
 * Trigger min-width style — prevents width from jumping
 * when switching between different-length options
 */

const triggerStyle = computed<CSSProperties>(() => {
  if (hasTriggerSlot.value || !triggerWidth.value)
    return {}
  return { width: `${triggerWidth.value}px` }
})

/**
 * =========================================================
 * Actions
 * =========================================================
 */

async function toggleDropdown() {
  if (props.disabled)
    return

  if (!open.value) {
    const el = triggerRef.value
    if (el) {
      dropdownRect.value = el.getBoundingClientRect()
    }
  }

  open.value = !open.value
}

function closeDropdown() {
  open.value = false
}

function selectOption(option: Option) {
  if (option.disabled)
    return
  model.value = option.value
  closeDropdown()
}

/**
 * =========================================================
 * Click Outside
 * =========================================================
 */

onClickOutside(dropdownRef, closeDropdown, { ignore: [triggerRef] })

/**
 * =========================================================
 * Auto Close
 * =========================================================
 */

useEventListener(window, 'resize', closeDropdown)
useEventListener(window, 'scroll', () => {
  if (!open.value)
    return
  const el = triggerRef.value
  if (el) {
    dropdownRect.value = el.getBoundingClientRect()
  }
}, {
  capture: true,
  passive: true,
})
</script>

<template>
  <div :style="triggerStyle" inline-flex relative>
    <!-- Trigger -->

    <button
      ref="triggerRef"
      type="button"
      border="~ c-border"
      text-sm px-3.5 py-2.5 rounded-xl bg-c-input min-h-10 w-full transition-colors
      flex="~ items-center justify-between gap-3"
      :class="[
        disabled
          ? 'op-50 cursor-not-allowed'
          : 'cursor-pointer hover:bg-c-surface',
      ]"

      @click="toggleDropdown"
    >
      <!-- Trigger Slot -->

      <slot name="trigger" :selected="selectedOption">
        <span text-left truncate>
          {{ selectedOption?.label || placeholder }}
        </span>
      </slot>

      <!-- Arrow -->

      <div
        i-carbon-chevron-down text-xs shrink-0 transition-transform
        :class="{ 'rotate-180': open }"
      />
    </button>

    <!-- Dropdown -->

    <Teleport to="body">
      <Transition name="select">
        <div
          v-if="open"
          ref="dropdownRef"
          border="~ c-border"
          py-1 rounded-xl bg-c-surface fixed z-999 overflow-hidden
          shadow="[0_18px_44px_rgba(0,0,0,0.14)]"
          :style="dropdownStyle"
        >
          <div
            max-h-80 overflow-x-hidden overflow-y-auto
            class="[scrollbar-gutter:stable]"
          >
            <div
              v-for="option in options"
              :key="option.value"
              text-sm px-3.5 py-2.5 transition-colors
              flex="~ items-center gap-2"
              :class="[
                option.disabled
                  ? 'op-40 cursor-not-allowed'
                  : option.value
                    === model
                    ? 'bg-c-accent/8 text-c-accent cursor-pointer'
                    : 'cursor-pointer hover:bg-c-raised',
              ]"

              @click=" selectOption(option) "
            >
              <!-- Option Slot -->

              <slot name="option" :option="option" :selected=" option.value === model ">
                {{ option.label }}
              </slot>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
  <div
    ref="measureRef"
    text-sm
    style="
    position: fixed;
    visibility: hidden;
    white-space: nowrap;
    pointer-events: none;
    height: auto;
  "
  />
</template>

<style scoped>
.select-enter-active,
.select-leave-active {
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}

.select-enter-from,
.select-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
