<script setup lang="ts">
const props = withDefaults(defineProps<{
  options: {
    label: string
    subLabel?: string
    value: string | number
  }[]
  required?: boolean
}>(), {
  required: false,
})

const model = defineModel<(string | number)[]>({
  required: true,
})

function toggle(value: string | number) {
  const exists = model.value.includes(value)

  // 已选中 -> 取消
  if (exists) {
    // required 时至少保留一个
    if (props.required && model.value.length <= 1)
      return

    model.value = model.value.filter(v => v !== value)
    return
  }

  // 未选中 -> 添加
  model.value = [...model.value, value]
}
</script>

<template>
  <div role="group" flex="~ gap-1" border="~ c-border" p-1 rounded-lg bg-c-input w-full>
    <button
      v-for="o in options" :key="o.value" type="button"
      :aria-pressed="model.includes(o.value)"
      flex="1 col gap-0.5" p="x-2 y-2" text-center rounded-md op-90 min-w-0 transition-colors :class="
        model.includes(o.value)
          ? 'bg-c-accent text-white dark:text-black shadow-sm'
          : 'hover:bg-c-raised hover:op-100'
      "
      @click="toggle(o.value)"
    >
      <span text-xs font-semibold>
        {{ o.label }}
      </span>

      <span v-if="o.subLabel" text-xs op-60 block>
        {{ o.subLabel }}
      </span>
    </button>
  </div>
</template>
