<script setup lang="ts">
import { ref } from 'vue'

export interface ExplainerItem {
  title?: string
  description: string
  icon?: string
}

withDefaults(defineProps<{
  title?: string
  items: ExplainerItem[]
  defaultOpen?: boolean
}>(), {
  title: 'How It Works',
  defaultOpen: false,
})

const open = ref(false)
</script>

<template>
  <div border="~ c-border" rounded-xl bg-c-surface overflow-hidden>
    <button
      type="button"
      flex="~ items-center justify-between"

      text-sm font-medium px-4 py-3 w-full transition-colors hover:bg-c-raised
      @click="open = !open"
    >
      <span flex="~ items-center gap-2">
        <span class="i-carbon-information" op-70 />
        {{ title }}
      </span>

      <span
        class="i-carbon-chevron-down"
        op-70 transition-transform
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <div v-show="open" border="t~ c-border" p-4>
      <div flex="~ col gap-4">
        <div
          v-for="(item, index) in items"
          :key="index"
          flex="~ items-start gap-3"
        >
          <div

            flex="~ items-center justify-center"
            text-xs font-semibold rounded-full bg-c-raised op-80 shrink-0 h-6 w-6
          >
            {{ index + 1 }}
          </div>

          <div min-w-0 flex="~ col gap-1">
            <div
              v-if="item.title"
              flex="~ items-center gap-1.5"
            >
              <span
                v-if="item.icon"
                :class="item.icon"
                op-70 shrink-0
              />

              <span text-sm font-medium>
                {{ item.title }}
              </span>
            </div>

            <div text-sm leading-6 op-75>
              {{ item.description }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
