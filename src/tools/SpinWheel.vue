<script lang="ts">
import TextInput from '~/components/TextInput.vue'
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'random-wheel',
  name: 'Random Wheel',
  nameZh: '随机转盘',
  description: 'Add options and spin the wheel to randomly pick one.',
  descriptionZh: '添加多个选项，转动转盘随机选中一个。',
  category: 'utility',
  keywords: ['random', 'pick', 'spin', 'wheel', 'lottery', 'decision', '转盘', '随机', '抽奖'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { useLocalStorage, watchDebounced } from '@vueuse/core'
import { computed, nextTick, onMounted, shallowRef, watch } from 'vue'
import BaseButton from '~/components/BaseButton.vue'
import Panel from '~/components/container/Panel.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  options: ['Options', '选项'],
  wheel: ['Wheel', '转盘'],
  add: ['Add', '添加'],
  clear: ['Clear', '清空'],
  clear_confirm: ['Clear all options?', '确定清空所有选项？'],
  placeholder: ['Enter an option...', '输入一个选项...'],
  selected: ['Selected', '选中'],
  spinning: ['Spinning', '转动中'],
  waiting: ['Spin to pick', '转一转试试'],
  at_least_two: ['Add at least 2 options', '至少添加 2 个选项'],
})

const COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#E8A838',
  '#DDA0DD',
  '#98D8C8',
  '#D4A017',
  '#BB8FCE',
  '#85C1E9',
  '#F0B27A',
  '#82E0AA',
]

const items = useLocalStorage<string[]>(
  'random-wheel:items',
  [
    '选项 1',
    '选项 2',
    '选项 3',
    '选项 4',
  ],
)
const newItem = shallowRef('')
const spinning = shallowRef(false)
const resultText = shallowRef('')
const rotation = shallowRef(0)
const canvasRef = shallowRef<HTMLCanvasElement | null>(null)

const canSpin = computed(() =>
  items.value.length >= 2,
)

const spinDisabled = computed(() =>
  !canSpin.value || spinning.value,
)

function addItem() {
  const val = newItem.value.trim()
  if (!val)
    return
  items.value = [
    ...items.value,
    val,
  ]
  newItem.value = ''
}

function removeItem(index: number) {
  items.value = items.value.filter(
    (_, i) => i !== index,
  )
}

function clearItems() {
  if (!confirm(t('clear_confirm')))
    return
  items.value = []
}

function drawWheel() {
  const canvas = canvasRef.value
  if (!canvas)
    return
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  const size = canvas.width
  const center = size / 2
  const radius = center - 4
  const count = items.value.length

  ctx.clearRect(0, 0, size, size)

  if (!count)
    return

  const arc = (2 * Math.PI) / count
  const rotRad = (rotation.value * Math.PI) / 180

  for (let i = 0; i < count; i++) {
    const startAngle = rotRad + i * arc
    const endAngle = startAngle + arc

    ctx.beginPath()
    ctx.moveTo(center, center)
    ctx.arc(center, center, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = COLORS[i % COLORS.length]
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.save()
    ctx.translate(center, center)
    ctx.rotate(startAngle + arc / 2)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.max(12, Math.min(16, 200 / count))}px sans-serif`
    ctx.shadowColor = 'rgba(0,0,0,0.3)'
    ctx.shadowBlur = 2
    const text = items.value[i].length > 8 ? `${items.value[i].slice(0, 7)}…` : items.value[i]
    ctx.fillText(text, radius - 20, 5)
    ctx.restore()
  }
}

function spin() {
  if (spinDisabled.value)
    return

  spinning.value = true
  resultText.value = ''

  const extraSpins = 5 + Math.random() * 5
  const targetAngle = rotation.value + extraSpins * 360 + Math.random() * 360
  const duration = 4000
  const startTime = performance.now()
  const startRotation = rotation.value

  function animate(now: number) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - (1 - progress) ** 4

    rotation.value = startRotation + (targetAngle - startRotation) * eased
    // drawWheel()

    if (progress < 1) {
      requestAnimationFrame(animate)
    }
    else {
      spinning.value = false
      const count = items.value.length
      const arc = 360 / count
      const normalizedAngle = ((360 - (rotation.value % 360)) + 360) % 360
      const index = Math.floor(normalizedAngle / arc) % count
      resultText.value = items.value[index]
    }
  }

  requestAnimationFrame(animate)
}

watchDebounced(
  items,
  async () => {
    await nextTick()

    drawWheel()
  },
  {
    debounce: 80,
    deep: true,
    immediate: true,
  },
)

watch(rotation, drawWheel)

onMounted(() => {
  nextTick(drawWheel)
})
</script>

<template>
  <div flex="~ col gap-4">
    <Panel :title="t('options')">
      <div p-5 flex="~ col gap-3">
        <div flex="~ gap-2">
          <TextInput
            v-model="newItem"
            :placeholder="t('placeholder')"
            :copyable="false"
            :monospace="false"
            flex-1
            @enter="addItem"
          />
          <BaseButton
            icon="i-carbon-add" :disabled="!newItem.trim()" icon-only @click="addItem"
          />
          <BaseButton
            v-if="items.length > 0" icon="i-carbon-trash-can" icon-only @click="clearItems"
          />
        </div>
        <div v-if="items.length > 0" flex="~ gap-2 wrap">
          <span
            v-for="(item, i) in items" :key="i"
            flex="~ items-center gap-2"
            border="~ c-border" p="x-2.5 y-1.5"
            transition="colors duration-200"
            hover="border-c-border-strong bg-c-surface"
            text-sm rounded-xl bg-c-input max-w-full
          >
            <span
              rounded-full shrink-0 h-3.5 w-1
              :style="{ background: COLORS[i % COLORS.length] }"
            />
            <span text-c-text pl-1 max-w-42 select-none truncate>{{ item }}</span>
            <button
              type="button"
              flex="~ items-center justify-center"
              text-c-text-faint rounded-md size-5
              cursor-pointer transition="colors duration-200"
              hover="text-c-text bg-c-raised"
              :aria-label="`Remove ${item}`"
              @click="removeItem(i)"
            >
              <div i-carbon-close text-xs />
            </button>
          </span>
        </div>
      </div>
    </Panel>

    <Panel :title="t('wheel')">
      <div p-5 flex="~ col gap-4" items-center>
        <div relative>
          <canvas
            ref="canvasRef"
            width="320"
            height="320"
            rounded-full shadow="[0_4px_20px_rgba(0,0,0,0.15)]"
          />
          <!-- 指针 -->
          <div
            border="b-(12px transparent) r-(20px [var(--c-accent)]) t-(12px transparent) solid" size-0 absolute
            class="translate-y--50% right--8px top-[50%] drop-shadow-[-2px_0_2px_rgba(0,0,0,0.2)]"
          />
          <!-- 中心按钮 -->
          <div
            absolute top="50%" left="50%" un-translate="-50%"
          >
            <button
              type="button" text="sm white font-bold"
              border="3 white" rounded-full size-12
              cursor-pointer transition="transform opacity 150" hover:scale-110
              un-disabled="cursor-not-allowed opacity-40"
              :class="{ spinning }"
              :disabled="spinDisabled"
              :style="{ background: 'var(--c-accent)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)' }"
              @click="spin"
            >
              GO
            </button>
          </div>
        </div>
        <div v-if="!canSpin && !spinning" text-sm op-50>
          {{ t('at_least_two') }}
        </div>
        <div
          flex="~ items-center justify-center"
          border="~" p="x-4 y-3" rounded-xl w-full relative
          style="height: 82px"
          :class="resultText ? 'border-c-border-strong bg-c-surface' : 'border-c-border bg-c-input'"
        >
          <div flex="~ col items-center gap-1.5" text-center max-w-full min-w-0>
            <span
              rounded-full h-0.75 w-8
              :class="resultText ? 'bg-c-accent' : 'bg-c-border-strong op-55'"
            />
            <span text="[0.6875rem] c-text-muted" leading-none font-mono uppercase>
              {{ t('selected') }}
            </span>
            <span
              text="2xl center"
              font="serif normal" leading-tight max-w-full truncate
              :class="resultText ? 'text-c-text' : 'text-c-text-muted select-none'"
            >
              {{ resultText || (spinning ? t('spinning') : t('waiting')) }}
            </span>
          </div>
          <span
            text-xl right-4 absolute
            :class="resultText ? 'text-c-accent op-70 i-carbon-checkmark-outline' : 'text-c-text-faint i-carbon-circle-dash'"
          />
        </div>
      </div>
    </Panel>
  </div>
</template>

<style scoped>
/* CSS triangle pointer & @keyframes — UnoCSS cannot express border tricks or keyframe animations */
.pointer {
  position: absolute;
  top: 50%;
  right: -8px;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 12px solid transparent;
  border-bottom: 12px solid transparent;
  border-right: 20px solid var(--c-accent);
  filter: drop-shadow(-2px 0 2px rgba(0, 0, 0, 0.2));
}
.spinning {
  animation: pulse 0.6s ease-in-out infinite;
}
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.9);
  }
}
</style>
