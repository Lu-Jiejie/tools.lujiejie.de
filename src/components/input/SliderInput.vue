<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: number
  min?: number
  max?: number
  step?: number
}>(), {
  min: 0,
  max: 100,
  step: 1,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const trackRef = ref<HTMLElement | null>(null)

/**
 * =========================================================
 * State
 * =========================================================
 */

const isDragging = ref(false)

// 当前显示值（直接驱动 UI）
const visualValue = ref(props.modelValue)

// 拖动中的预览值（只用于显示）
const previewValue = ref(props.modelValue)

/**
 * =========================================================
 * Utils
 * =========================================================
 */

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

function snap(v: number) {
  const stepped = Math.round(v / props.step) * props.step
  return clamp(stepped, props.min, props.max)
}

function valueToPercent(v: number) {
  return ((v - props.min) / (props.max - props.min)) * 100
}

function clientToValue(clientX: number) {
  if (!trackRef.value)
    return props.modelValue

  const rect = trackRef.value.getBoundingClientRect()

  const percent = (clientX - rect.left) / rect.width

  const raw = props.min + percent * (props.max - props.min)

  return snap(raw)
}

/**
 * =========================================================
 * Pointer Logic (核心优化点)
 * =========================================================
 */

function update(clientX: number) {
  const value = clientToValue(clientX)

  previewValue.value = value

  // ⚠️ 关键：直接硬同步，不做 spring
  visualValue.value = value
}

function onPointerDown(e: PointerEvent) {
  if (!trackRef.value)
    return

  isDragging.value = true

  trackRef.value.setPointerCapture(e.pointerId)

  update(e.clientX)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value)
    return

  update(e.clientX)
}

function onPointerUp(e: PointerEvent) {
  if (!isDragging.value)
    return

  isDragging.value = false

  trackRef.value?.releasePointerCapture(e.pointerId)

  emit('update:modelValue', previewValue.value)
}

/**
 * =========================================================
 * Global pointer safety (移动端关键修复)
 * =========================================================
 */

useEventListener(window, 'pointermove', onPointerMove)
useEventListener(window, 'pointerup', onPointerUp)

/**
 * =========================================================
 * Keyboard
 * =========================================================
 */

function onKeyDown(e: KeyboardEvent) {
  let next: number | null = null

  if (e.key === 'ArrowLeft' || e.key === 'ArrowDown')
    next = props.modelValue - props.step

  else if (e.key === 'ArrowRight' || e.key === 'ArrowUp')
    next = props.modelValue + props.step

  else if (e.key === 'Home')
    next = props.min

  else if (e.key === 'End')
    next = props.max

  if (next === null)
    return

  e.preventDefault()

  next = snap(next)

  previewValue.value = next
  visualValue.value = next

  emit('update:modelValue', next)
}

/**
 * =========================================================
 * External sync
 * =========================================================
 */

watch(
  () => props.modelValue,
  (v) => {
    if (isDragging.value)
      return

    visualValue.value = v
    previewValue.value = v
  },
)

/**
 * =========================================================
 * Display
 * =========================================================
 */

const displayValue = computed(() =>
  isDragging.value ? previewValue.value : props.modelValue,
)

const visualPercent = computed(() =>
  valueToPercent(visualValue.value),
)
</script>

<template>
  <div flex="~ items-center gap-2">
    <!-- Slider -->
    <div
      ref="trackRef"
      role="slider"
      :tabindex="0"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuenow="displayValue"
      aria-label="Slider"
      flex="~ items-center"
      outline-none flex-1 h-8 cursor-pointer select-none relative touch-none
      @pointerdown.prevent="onPointerDown"
      @keydown="onKeyDown"
    >
      <!-- Track -->
      <div class="track" rounded-full bg-c-border h-1.5 w-full relative overflow-hidden>
        <div
          class="active"
          rounded-full bg-c-accent inset-y-0 left-0 absolute
          :style="{ width: `${visualPercent}%` }"
        />
      </div>

      <!-- Thumb -->
      <div
        top="50%"
        border="2 c-accent"
        rounded-md bg-c-surface size-4.5 shadow-sm absolute
        :style="{
          left: `${visualPercent}%`,
          transform: 'translate(-50%, -50%)',
        }"
      />
    </div>

    <!-- Value -->
    <span
      text="sm c-text-muted"
      font-mono ml-2 text-right min-w-4 tabular-nums
    >
      {{ displayValue }}
    </span>
  </div>
</template>
