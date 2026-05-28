```vue id="0ts1ju"
<script setup lang="ts">
import { ref, shallowRef } from 'vue'

import BaseButton from '~/components/input/BaseButton.vue'

withDefaults(defineProps<{
  label?: string
  hint?: string

  changeLabel?: string

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

const isOver = ref(false)

function onDrop(e: DragEvent) {
  isOver.value = false

  const file = e.dataTransfer?.files?.[0]

  if (file)
    handleFile(file)
}

function onDragLeave(e: DragEvent) {
  const current = e.currentTarget as HTMLElement

  const related = e.relatedTarget as Node | null

  if (!related || !current.contains(related))
    isOver.value = false
}

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

defineExpose({
  imageDataUrl,
})
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
      group

      border="~ dashed c-border"

      bg="c-raised"

      rounded-2xl

      h-40

      cursor-pointer

      relative

      overflow-hidden

      transition="colors duration-200"

      :class="[
        isOver
          ? 'bg-c-surface'
          : 'hover:bg-c-surface',
      ]"

      @click="fileInput?.click()"

      @dragenter.prevent="isOver = true"
      @dragover.prevent

      @drop.prevent="onDrop"

      @dragleave="onDragLeave"
    >
      <template v-if="!imageDataUrl">
        <div
          flex="~ items-center justify-center"

          inset-0
          absolute
        >
          <div
            i-carbon-add

            text="3xl c-text-muted"

            transition="all duration-200"

            :class="[
              isOver
                ? 'op-50'
                : 'op-25 hover:op-50',
            ]"
          />
        </div>
      </template>

      <template v-else>
        <img
          :src="imageDataUrl"

          p-2

          h-full
          w-full

          inset-0
          absolute

          object-contain

          transition="all duration-200"

          :class="[
            allowChange && (
              isOver
                ? 'blur-[2px] brightness-50'
                : 'hover:blur-[2px] hover:brightness-50'
            ),
          ]"
        >

        <div
          v-if="allowChange"

          flex="~ col items-center justify-center gap-1.5"

          bg="black/20"

          inset-0
          absolute

          transition="opacity duration-200"

          :class="[
            isOver
              ? 'op-100'
              : 'op-0 hover:op-100',
          ]"
        >
          <div
            i-carbon-image-search

            text="xl white"

            op-80
          />

          <span
            text="xs white"

            tracking-wide

            font-medium
          >
            {{ changeLabel }}
          </span>
        </div>
      </template>
    </div>

    <div
      v-if="imageDataUrl && !allowChange"

      mt-3

      flex="~ justify-center"
    >
      <BaseButton
        size="sm"

        icon="i-carbon-image"

        @click="fileInput?.click()"
      >
        {{ changeLabel }}
      </BaseButton>
    </div>
  </div>
</template>
```
