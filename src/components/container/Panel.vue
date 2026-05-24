<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

defineProps<{
  title?: string
}>()
</script>

<template>
  <div
    v-if="title"
    v-bind="$attrs"
    class="panel-outside-section [.panel-outside-section+&]:mt-3.5"
  >
    <div mb-3 flex="~ items-end gap-4" select-none>
      <span rounded-full bg-c-accent h-8 w-1.5 translate-y--0.5 />
      <div min-w-0>
        <h2 text="2xl md:3xl c-text" leading-none font="serif normal" op-90>
          {{ title }}
        </h2>
      </div>
    </div>

    <section
      border="~ c-border"
      rounded-2xl bg-c-surface
      overflow-hidden
      class="shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_1px_2px_rgba(0,0,0,0.018)]"
    >
      <slot />
    </section>
  </div>

  <section
    v-else
    v-bind="$attrs"
    border="~ c-border"
    rounded-2xl bg-c-surface
    overflow-hidden
    class="shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_1px_2px_rgba(0,0,0,0.018)]"
  >
    <slot />
  </section>
</template>
