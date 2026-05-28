<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import BaseButton from '~/components/ui/BaseButton.vue'

withDefaults(defineProps<{
  label?: string
  hint?: string
  changeLabel?: string
  /** Allow replacing image after upload */
  allowChange?: boolean
}>(), {
  label: 'Upload Image',
  hint: 'Click or drag an image here',
  changeLabel: 'Change Image',
  allowChange: true,
})

const emit = defineEmits<{
  'update:image': [HTMLImageElement | null]
  'update:dataUrl': [string]
}>()

const fileInput = ref<HTMLInputElement>()
const imageDataUrl = shallowRef('')
const isDragging = ref(false)

async function handleFile(file: File) {
  if (!file.type.startsWith('image/'))
    return

  const reader = new FileReader()
  reader.onload = () => {
    const src = reader.result as string
    imageDataUrl.value = src
    emit('update:dataUrl', src)

    const img = new Image()
    img.onload = () => emit('update:image', img)
    img.src = src
  }
  reader.readAsDataURL(file)
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file)
    handleFile(file)
  input.value = ''
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file)
    handleFile(file)
}

defineExpose({ imageDataUrl })
</script>

<template>
  <div>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="sr-only"
      @change="onFileChange"
    >

    <div
      v-if="!imageDataUrl || !allowChange"
      border="~ dashed c-border"
      bg="c-raised hover:c-surface"
      group rounded-2xl h-40 cursor-pointer transition-all duration-300 relative overflow-hidden
      @click="fileInput?.click()"
      @drop.prevent="onDrop"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
    >
      <!-- Empty placeholder -->
      <div
        v-if="!imageDataUrl"
        flex="~ items-center justify-center"
        inset-0 absolute
      >
        <div
          i-carbon-add
          text-3xl
          text-c-text-muted op-25
          transition-all duration-300
          group-hover:op-50 group-hover:scale-110
        />
      </div>

      <!-- Uploaded image -->
      <img
        v-else
        :src="imageDataUrl"
        p-2 h-full w-full transition-all duration-300 inset-0 absolute object-contain
      >
    </div>

    <!-- Change overlay for non-replaceable mode -->
    <div
      v-if="imageDataUrl && !allowChange"
      mt-3 flex="~ justify-center"
    >
      <BaseButton
        size="sm"
        icon="i-carbon-image"
        @click="fileInput?.click()"
      >
        {{ changeLabel }}
      </BaseButton>
    </div>

    <!-- Change overlay for replaceable mode -->
    <div
      v-if="imageDataUrl && allowChange"
      border="~ dashed c-border"
      bg="c-raised hover:c-surface"
      group rounded-2xl h-40 cursor-pointer transition-all duration-300 relative overflow-hidden
      @click="fileInput?.click()"
      @drop.prevent="onDrop"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
    >
      <img
        :src="imageDataUrl"
        p-2 h-full w-full transition-all duration-300 inset-0 absolute object-contain
        class="group-hover:blur-[2px] group-hover:brightness-50"
      >

      <div
        flex="~ col items-center justify-center gap-1.5"
        op-0 transition-all duration-300 inset-0 absolute group-hover:op-100
        bg="black/20"
      >
        <div i-carbon-image-search text-xl text-white op-80 />
        <span text-xs text-white tracking-wide font-medium>
          {{ changeLabel }}
        </span>
      </div>
    </div>
  </div>
</template>
