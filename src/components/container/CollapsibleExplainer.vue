<script setup lang="ts">
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
  defaultOpen?: boolean
}>(), {
  title: 'How It Works',
  defaultOpen: false,
})
</script>

<template>
  <div border="~ c-border" rounded-2xl bg-c-surface panel-shadow overflow-hidden>
    <div
      p="x-4 y-2" border="b c-border" text-sm tracking-wide font-medium op-50 select-none uppercase
    >
      {{ title }}
    </div>

    <div p-4>
      <ol flex="~ col gap-4" m-0 p-0 list-none>
        <li
          v-for="(item, index) in items"
          :key="index"
          flex="~ items-start gap-3"
        >
          <span
            flex="~ items-center justify-center"
            text-xs font-medium rounded-md bg-c-raised op-65 shrink-0 size-6 select-none
          >
            {{ index + 1 }}
          </span>

          <div min-w-0 flex="~ col gap-1">
            <div
              v-if="item.title"
              flex="~ items-center gap-1.5"
              min-w-0
            >
              <span text-sm font-medium op-85 truncate>
                {{ item.title }}
              </span>
            </div>

            <div text-sm leading-6 op-60>
              {{ item.description }}
            </div>

            <div v-if="item.links?.length" flex="~ gap-2 wrap" text-sm>
              <a
                v-for="link in item.links"
                :key="link.href"
                :href="link.href"
                target="_blank"
                rel="noreferrer"
                text-c-accent underline-offset-3 hover:underline
              >
                {{ link.label }}
              </a>
            </div>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>
