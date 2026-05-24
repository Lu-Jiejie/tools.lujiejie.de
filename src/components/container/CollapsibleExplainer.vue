<script setup lang="ts">
import Panel from '~/components/container/Panel.vue'

export interface ExplainerItem {
  title?: string
  description: string
  icon?: string
  links?: {
    label: string
    href: string
  }[]
}

withDefaults(defineProps<{
  title?: string
  items: ExplainerItem[]
}>(), {
  title: 'How It Works',
})
</script>

<template>
  <Panel :title="title">
    <div p-5>
      <ol
        grid="~ cols-1 md:cols-2 gap-x-6 gap-y-5"
        m-0 p-0 list-none
      >
        <li
          v-for="(item, index) in items"
          :key="index"
          border="t c-border" p="t-4"
          flex="~ items-start gap-3"
        >
          <span
            text-xs text-c-text-faint leading-none font-mono pt-1.5 shrink-0 min-w-6 select-none
          >
            {{ (index + 1).toString().padStart(2, '0') }}
          </span>

          <div min-w-0 flex="~ col gap-2">
            <div
              v-if="item.title"
              flex="~ items-center gap-1.5"
              min-w-0
            >
              <span text-lg text-c-text leading-snug font="serif normal" op-92>
                {{ item.title }}
              </span>
            </div>

            <div text-sm text-c-text-muted leading-6>
              {{ item.description }}
            </div>

            <div
              v-if="item.links?.length"
              flex="~ gap-2 wrap"
              text-xs font-mono
            >
              <a
                v-for="link in item.links"
                :key="link.href"
                :href="link.href"
                target="_blank"
                rel="noreferrer"
                border="~ c-border"

                transition="colors duration-200"
                text-c-text-muted px-2 py-1 rounded-full no-underline hover:text-c-accent hover:border-c-border-strong
              >
                {{ link.label }}
              </a>
            </div>
          </div>
        </li>
      </ol>
    </div>
  </Panel>
</template>
