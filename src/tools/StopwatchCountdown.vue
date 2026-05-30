<script lang="ts">
import { defineTool } from './index'

export const toolMeta = defineTool({
  id: 'stopwatch-countdown',
  name: 'Stopwatch & Countdown',
  nameZh: '秒表与倒计时',
  description: 'A precise stopwatch with lap times and a configurable countdown timer, both with a grand fullscreen display.',
  descriptionZh: '精准的秒表（支持计次）与可配置的倒计时，皆可进入大气优雅的全屏显示。',
  category: 'utility',
  keywords: ['stopwatch', 'countdown', 'timer', 'clock', 'lap', 'fullscreen', '秒表', '倒计时', '计时器', '全屏'],
})
</script>

<!-- eslint-disable import/first -->
<script setup lang="ts">
import { useEventListener, useFullscreen, useStorage } from '@vueuse/core'
import { computed, onUnmounted, ref, watch } from 'vue'
import Panel from '~/components/container/Panel.vue'
import BaseButton from '~/components/input/BaseButton.vue'
import ToggleButtonGroup from '~/components/input/ToggleButtonGroup.vue'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n({
  mode_stopwatch: ['Stopwatch', '秒表'],
  mode_countdown: ['Countdown', '倒计时'],

  start: ['Start', '开始'],
  resume: ['Resume', '继续'],
  pause: ['Pause', '暂停'],
  reset: ['Reset', '重置'],
  lap: ['Lap', '计次'],

  ready: ['Ready', '就绪'],
  running: ['Running', '计时中'],
  paused: ['Paused', '已暂停'],
  finished: ['Time\'s up', '时间到'],

  duration: ['Duration', '时长设置'],
  hours: ['hr', '时'],
  minutes: ['min', '分'],
  seconds: ['sec', '秒'],
  milliseconds: ['ms', '毫秒'],
  presets: ['Presets', '快捷'],
  history: ['Recent', '历史'],

  laps_title: ['Lap Times', '计次记录'],
  lap_no: ['No.', '次'],
  lap_split: ['Split', '单圈'],
  lap_total: ['Total', '总计'],

  enter_fullscreen: ['Enter fullscreen', '进入全屏'],
  exit_fullscreen: ['Exit fullscreen', '退出全屏'],
  notify_on: ['Notifications on', '系统通知 开'],
  notify_off: ['Notifications off', '系统通知 关'],
  notify_title: ['Time\'s up', '时间到'],
  notify_body: ['Your countdown has finished.', '您设置的倒计时已结束。'],

  how_sw_title: ['Stopwatch', '秒表'],
  how_sw_desc: ['Count up with centisecond precision. Press Lap to record a split without stopping the clock.', '以厘秒精度向上计时。点击「计次」可在不停表的情况下记录单圈成绩。'],
  how_cd_title: ['Countdown', '倒计时'],
  how_cd_desc: ['Set hours, minutes and seconds, or pick a preset. A system notification appears when time is up.', '设置时、分、秒，或选择快捷时长。时间到时会弹出系统消息通知。'],
  how_fs_title: ['Fullscreen', '全屏'],
  how_fs_desc: ['Expand the display to fill the screen for a grand, readable clock. Controls fade away while running and return on movement.', '展开为铺满屏幕的大气时钟。计时中控件会自动隐去，移动鼠标即可重新显示。'],
  how_keys_title: ['Shortcuts', '快捷键'],
  how_keys_desc: ['Space to start or pause, R to reset, L to lap, F to toggle fullscreen.', '空格开始/暂停，R 重置，L 计次，F 切换全屏。'],
})

type Mode = 'stopwatch' | 'countdown'

const PRESETS = [1, 3, 5, 10, 15, 25, 45, 60]
const PRESET_MS = new Set(PRESETS.map(p => p * 60000))

// Recently used custom countdown durations (ms), newest first, persisted.
const history = useStorage<number[]>('tools:stopwatch-countdown:history', [])

const mode = ref<Mode>('stopwatch')
const elapsed = ref(0)
const remaining = ref(0)
const running = ref(false)
const finished = ref(false)
const laps = ref<{ index: number, total: number }[]>([])
const notifyOn = ref(true)
const controlsVisible = ref(true)

const cdH = ref(0)
const cdM = ref(5)
const cdS = ref(0)

const stageRef = ref<HTMLElement | null>(null)
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(stageRef)

let swStart = 0
let cdTarget = 0
let rafId = 0
let hideTimer: ReturnType<typeof setTimeout> | undefined

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

const durationMs = computed(() => ((cdH.value * 3600) + (cdM.value * 60) + cdS.value) * 1000)
remaining.value = durationMs.value

// Whether the timer has progressed beyond its idle state (used to choose
// between "Start" and "Resume", and to enable Reset).
const engaged = computed(() =>
  mode.value === 'stopwatch'
    ? elapsed.value > 0
    : running.value || finished.value || remaining.value < durationMs.value - 1,
)

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function breakdown(ms: number) {
  const v = Math.max(0, ms)
  return {
    h: Math.floor(v / 3600000),
    m: Math.floor(v / 60000) % 60,
    s: Math.floor(v / 1000) % 60,
    ms: Math.floor(v % 1000),
  }
}

interface ClockToken {
  type: 'num' | 'sep'
  text: string
  key?: 'h' | 'm' | 's' | 'ms'
  label?: string
}

// Both modes share one segmented display: H : M : S . MS, each numeric group
// captioned with its unit. The countdown reads `remaining`, the stopwatch
// reads `elapsed`.
const clockTokens = computed<ClockToken[]>(() => {
  const b = breakdown(mode.value === 'stopwatch' ? elapsed.value : remaining.value)
  return [
    { type: 'num', key: 'h', text: pad(b.h), label: t('hours') },
    { type: 'sep', text: ':' },
    { type: 'num', key: 'm', text: pad(b.m), label: t('minutes') },
    { type: 'sep', text: ':' },
    { type: 'num', key: 's', text: pad(b.s), label: t('seconds') },
    { type: 'sep', text: '.' },
    { type: 'num', key: 'ms', text: b.ms.toString().padStart(3, '0'), label: t('milliseconds') },
  ]
})

// Steppers sit on the H/M/S groups of the countdown. They stay visible once
// counting starts but are disabled (dimmed) so the displayed numbers always
// match the duration being edited.
const steppersEnabled = computed(() =>
  mode.value === 'countdown' && !running.value && !engaged.value)

function stepUnit(key: 'h' | 'm' | 's' | 'ms' | undefined, delta: number) {
  if (!steppersEnabled.value)
    return
  if (key === 'h')
    cdH.value = clamp(cdH.value + delta, 0, 99)
  else if (key === 'm')
    cdM.value = clamp(cdM.value + delta, 0, 59)
  else if (key === 's')
    cdS.value = clamp(cdS.value + delta, 0, 59)
  else
    return
  finished.value = false
}

const statusLabel = computed(() => {
  if (mode.value === 'countdown' && finished.value)
    return t('finished')
  if (running.value)
    return t('running')
  return engaged.value ? t('paused') : t('ready')
})

const primaryLabel = computed(() => {
  if (mode.value === 'countdown' && finished.value)
    return t('reset')
  if (running.value)
    return t('pause')
  return engaged.value ? t('resume') : t('start')
})

const primaryIcon = computed(() => {
  if (mode.value === 'countdown' && finished.value)
    return 'i-carbon-reset'
  return running.value ? 'i-carbon-pause-filled' : 'i-carbon-play-filled-alt'
})

const canReset = computed(() => mode.value === 'stopwatch'
  ? running.value || elapsed.value > 0 || laps.value.length > 0
  : engaged.value)

// Only blocked when a countdown has no time set and nothing to resume/clear.
const primaryDisabled = computed(() =>
  mode.value === 'countdown' && !running.value && !finished.value && remaining.value <= 0)

// `finished` is owned by the countdown; scope its visual treatment so a
// remembered finished countdown never tints the stopwatch after a tab switch.
const showFinished = computed(() => mode.value === 'countdown' && finished.value)

function formatLap(ms: number) {
  const totalCs = Math.floor(ms / 10)
  const cs = totalCs % 100
  const totalSec = Math.floor(totalCs / 100)
  const s = totalSec % 60
  const totalMin = Math.floor(totalSec / 60)
  const m = totalMin % 60
  const h = Math.floor(totalMin / 60)
  return `${h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`}.${pad(cs)}`
}

// Lap rows with each lap's split time, newest first.
const lapRows = computed(() =>
  laps.value
    .map((l, i) => ({
      index: l.index,
      total: l.total,
      split: i === 0 ? l.total : l.total - laps.value[i - 1].total,
    }))
    .reverse(),
)

function tick() {
  const now = performance.now()
  if (mode.value === 'stopwatch') {
    elapsed.value = now - swStart
  }
  else {
    const rem = cdTarget - now
    if (rem <= 0) {
      remaining.value = 0
      onCountdownFinish()
      return
    }
    remaining.value = rem
  }
  rafId = requestAnimationFrame(tick)
}

function start() {
  if (running.value)
    return
  if (mode.value === 'countdown') {
    if (remaining.value <= 0)
      return
    finished.value = false
    cdTarget = performance.now() + remaining.value
    recordHistory(durationMs.value)
    ensureNotifyPermission()
  }
  else {
    swStart = performance.now() - elapsed.value
  }
  running.value = true
  pokeControls()
  rafId = requestAnimationFrame(tick)
}

function pause() {
  if (!running.value)
    return
  running.value = false
  cancelAnimationFrame(rafId)
  pokeControls()
}

function reset() {
  running.value = false
  cancelAnimationFrame(rafId)
  if (mode.value === 'stopwatch') {
    elapsed.value = 0
    laps.value = []
  }
  else {
    finished.value = false
    remaining.value = durationMs.value
  }
  pokeControls()
}

function onCountdownFinish() {
  running.value = false
  finished.value = true
  cancelAnimationFrame(rafId)
  controlsVisible.value = true
  clearTimeout(hideTimer)
  notify()
}

function lap() {
  if (mode.value !== 'stopwatch' || !running.value)
    return
  laps.value = [...laps.value, { index: laps.value.length + 1, total: elapsed.value }]
}

function primaryAction() {
  if (mode.value === 'countdown' && finished.value) {
    reset()
    return
  }
  if (running.value)
    pause()
  else
    start()
}

// Apply a duration (ms) to the countdown and make it the active value.
function applyMs(ms: number) {
  running.value = false
  cancelAnimationFrame(rafId)
  finished.value = false
  const total = Math.round(ms / 1000)
  cdH.value = Math.floor(total / 3600)
  cdM.value = Math.floor((total % 3600) / 60)
  cdS.value = total % 60
  remaining.value = ms
}

// Remember a started countdown's duration. Presets are skipped so the history
// row stays meaningful (recent custom durations only).
function recordHistory(ms: number) {
  if (ms <= 0 || PRESET_MS.has(ms))
    return
  history.value = [ms, ...history.value.filter(v => v !== ms)].slice(0, 6)
}

// Full HH:MM:SS (hours always shown, zero-padded) for the quick-pick chips.
function formatChipTime(ms: number) {
  const total = Math.round(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

// Show a desktop/system notification when the countdown ends. No sound is
// played (silent), per the tool's notification-only design.
function notify() {
  if (!notifyOn.value || typeof Notification === 'undefined')
    return
  if (Notification.permission !== 'granted')
    return
  try {
    // eslint-disable-next-line no-new
    new Notification(t('notify_title'), {
      body: t('notify_body'),
      silent: true,
    })
  }
  catch {
    // Notification not available; fail silently.
  }
}

// Request permission up front (when a countdown starts) so the end-of-time
// alert can fire without a prompt interrupting the moment.
function ensureNotifyPermission() {
  if (!notifyOn.value || typeof Notification === 'undefined')
    return
  if (Notification.permission === 'default')
    Notification.requestPermission()
}

// Toggle the notification preference. Turning it on prompts for permission and
// only sticks if the browser grants it (a blocked permission keeps it off).
async function toggleNotify() {
  if (notifyOn.value) {
    notifyOn.value = false
    return
  }
  if (typeof Notification === 'undefined') {
    notifyOn.value = true
    return
  }
  if (Notification.permission === 'default')
    await Notification.requestPermission()
  notifyOn.value = Notification.permission === 'granted'
}

// In fullscreen the controls fade out while idle and reappear on movement,
// keeping the clock itself unobstructed.
function pokeControls() {
  controlsVisible.value = true
  clearTimeout(hideTimer)
  if (isFullscreen.value && running.value)
    hideTimer = setTimeout(() => (controlsVisible.value = false), 2600)
}

// Switching tabs preserves each mode's own state (elapsed / laps for the
// stopwatch, remaining / finished for the countdown). Tab switching is blocked
// while running, so this never interrupts an active timer.
watch(mode, () => {
  cancelAnimationFrame(rafId)
  controlsVisible.value = true
  clearTimeout(hideTimer)
})

watch(durationMs, (ms) => {
  if (mode.value === 'countdown' && !running.value && !finished.value)
    remaining.value = ms
})

watch(isFullscreen, () => {
  pokeControls()
})

useEventListener(window, 'keydown', (e: KeyboardEvent) => {
  const el = e.target as HTMLElement | null
  if (el && /^(?:input|textarea|select)$/i.test(el.tagName))
    return
  if (e.code === 'Space') {
    e.preventDefault()
    primaryAction()
  }
  else if (e.key === 'r' || e.key === 'R') {
    reset()
  }
  else if (e.key === 'l' || e.key === 'L') {
    lap()
  }
  else if (e.key === 'f' || e.key === 'F') {
    toggleFullscreen()
  }
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  clearTimeout(hideTimer)
})

const MODE_OPTIONS = computed(() => [
  { label: t('mode_stopwatch'), value: 'stopwatch' },
  { label: t('mode_countdown'), value: 'countdown' },
])
</script>

<template>
  <div flex="~ col gap-4">
    <!-- Mode switch: locked while a timer is running. -->
    <ToggleButtonGroup
      v-model="mode"
      :options="MODE_OPTIONS"
      :multiple="false"
      :required="true"
      :disabled="running"
    />

    <!-- Main stage: the hero clock. This element is the fullscreen target. -->
    <Panel>
      <div
        ref="stageRef"
        class="clock-stage"
        flex="~ col items-center justify-center"
        select-none relative overflow-hidden
        :class="isFullscreen
          ? 'bg-c-surface h-screen w-screen gap-10'
          : 'px-2 sm:px-6 py-12 sm:py-14 gap-8 sm:gap-9 min-h-72'"
        @mousemove="pokeControls"
        @touchstart="pokeControls"
      >
        <!-- Top-right controls: notification toggle (countdown only) sits to the
             left of the fullscreen toggle. -->
        <div
          flex="~ items-center gap-2"
          transition="opacity duration-300"
          right-4 top-4 absolute
          :class="(!isFullscreen || controlsVisible) ? 'op-100' : 'op-0 pointer-events-none'"
        >
          <BaseButton
            v-if="mode === 'countdown'"
            icon-only bg-c-surface! hover:border-c-input! hover:bg-c-input!
            :icon="notifyOn ? 'i-carbon-notification op-70' : 'i-carbon-notification-off op-70'"
            :title="notifyOn ? t('notify_on') : t('notify_off')"
            @click="toggleNotify"
          />
          <BaseButton
            icon-only bg-c-surface! hover:border-c-input! hover:bg-c-input!
            :icon="isFullscreen ? 'i-carbon-minimize op-70' : 'i-carbon-maximize op-70'"
            :title="isFullscreen ? t('exit_fullscreen') : t('enter_fullscreen')"
            @click="toggleFullscreen"
          />
        </div>

        <!-- Status line: the centre dot is pinned to the panel's centre, with
             each caption hugging it from its side so changing labels never
             shift the dot. -->
        <div

          grid="~ cols-[1fr_auto_1fr] items-center gap-x-3"
          text="[clamp(0.75rem,2.4cqw,1.1rem)] c-text-faint" tracking-widest font-mono w-full uppercase
        >
          <span text-right>{{ mode === 'stopwatch' ? t('mode_stopwatch') : t('mode_countdown') }}</span>
          <span op-40>·</span>
          <span text-left :class="(running || finished) ? 'text-c-accent' : ''">{{ statusLabel }}</span>
        </div>

        <!-- The grand time display: per-unit columns with captions, plus
             inline steppers for adjusting the countdown when idle. -->
        <div
          font="serif normal" leading-none tabular-nums
          flex="~ items-start justify-center gap-x-0.5 sm:gap-x-2"
          transition="colors duration-300"
        >
          <div
            v-for="(tok, i) in clockTokens"
            :key="i"
            flex="~ col items-center"
          >
            <!-- Up stepper -->
            <div
              v-if="mode === 'countdown'"
              flex="~ items-center justify-center"
              :class="isFullscreen ? 'h-11' : 'h-8'"
            >
              <button
                v-if="tok.type === 'num' && tok.key !== 'ms'"
                type="button"
                :disabled="!steppersEnabled"
                flex="~ items-center justify-center"
                outline-none rounded-lg size-8
                transition="all duration-200"
                :class="steppersEnabled
                  ? 'text-c-text-faint hover:text-c-accent hover:bg-c-raised focus-visible:text-c-accent'
                  : 'text-c-text-faint op-25 cursor-not-allowed'"
                @click="stepUnit(tok.key, 1)"
              >
                <div i-carbon-chevron-up text-base />
              </button>
            </div>

            <!-- Digits / separator -->
            <div
              leading-none whitespace-nowrap
              :class="[
                isFullscreen ? 'text-[clamp(3rem,14cqw,12rem)]' : 'text-[clamp(2rem,13cqw,5.5rem)]',
                tok.type === 'sep'
                  ? 'text-c-text-faint op-70'
                  : showFinished ? 'text-c-accent' : 'text-c-text',
              ]"
            >
              <template v-if="tok.type === 'num'">
                <span
                  v-for="(ch, ci) in tok.text"
                  :key="ci"
                  class="clk-cell"
                >{{ ch }}</span>
              </template>
              <span v-else class="clk-sep">{{ tok.text }}</span>
            </div>

            <!-- Down stepper -->
            <div
              v-if="mode === 'countdown'"
              flex="~ items-center justify-center"
              :class="isFullscreen ? 'h-11' : 'h-8'"
            >
              <button
                v-if="tok.type === 'num' && tok.key !== 'ms'"
                type="button"
                :disabled="!steppersEnabled"
                flex="~ items-center justify-center"
                outline-none rounded-lg size-8
                transition="all duration-200"
                :class="steppersEnabled
                  ? 'text-c-text-faint hover:text-c-accent hover:bg-c-raised focus-visible:text-c-accent'
                  : 'text-c-text-faint op-25 cursor-not-allowed'"
                @click="stepUnit(tok.key, -1)"
              >
                <div i-carbon-chevron-down text-base />
              </button>
            </div>

            <!-- Unit caption -->
            <div mt-3 flex="~ items-center justify-center">
              <span
                v-if="tok.type === 'num'"
                text="[clamp(0.72rem,2.3cqw,1.05rem)] c-text-faint" leading-none tracking-widest font-mono uppercase
              >{{ tok.label }}</span>
            </div>
          </div>
        </div>

        <!-- Controls. Keyed by mode so the buttons remount on a tab switch
             instead of cross-fading their enabled/disabled state. -->
        <div
          :key="mode"
          flex="~ items-center justify-center gap-3 wrap"
          transition="opacity duration-300"
          :class="(!isFullscreen || controlsVisible) ? 'op-100' : 'op-0 pointer-events-none'"
        >
          <BaseButton
            :icon="`${primaryIcon} text-c-accent`"
            :disabled="primaryDisabled"
            @click="primaryAction"
          >
            {{ primaryLabel }}
          </BaseButton>

          <BaseButton
            v-if="mode === 'stopwatch'"
            icon="i-carbon-flag-filled text-amber-500"
            :disabled="!running"
            @click="lap"
          >
            {{ t('lap') }}
          </BaseButton>

          <BaseButton
            icon="i-carbon-reset text-rose-500"
            :disabled="!canReset"
            @click="reset"
          >
            {{ t('reset') }}
          </BaseButton>
        </div>
      </div>
    </Panel>

    <!-- Quick durations (countdown, normal view only) -->
    <Panel v-if="mode === 'countdown' && !isFullscreen" :title="t('presets')">
      <div p-5 grid="~ cols-3 sm:cols-4 gap-2.5">
        <BaseButton
          v-for="p in PRESETS"
          :key="p"
          :active="durationMs === p * 60000"
          @click="applyMs(p * 60000)"
        >
          <span font-mono tabular-nums>{{ formatChipTime(p * 60000) }}</span>
        </BaseButton>
      </div>
    </Panel>

    <!-- Recently used custom durations (countdown, normal view only) -->
    <Panel v-if="mode === 'countdown' && !isFullscreen && history.length" :title="t('history')">
      <div p-5 grid="~ cols-3 sm:cols-4 gap-2.5">
        <BaseButton
          v-for="ms in history"
          :key="ms"
          :active="durationMs === ms"
          @click="applyMs(ms)"
        >
          <span font-mono tabular-nums>{{ formatChipTime(ms) }}</span>
        </BaseButton>
      </div>
    </Panel>

    <!-- Lap times (stopwatch, normal view only) -->
    <Panel v-if="mode === 'stopwatch' && laps.length && !isFullscreen" :title="t('laps_title')">
      <div p-5>
        <div
          grid="~ cols-[auto_1fr_1fr] gap-x-4"
          text="xs c-text-faint" tracking-wide font-mono pb-2 select-none uppercase
          border="b c-border"
        >
          <span>{{ t('lap_no') }}</span>
          <span text-right>{{ t('lap_split') }}</span>
          <span text-right>{{ t('lap_total') }}</span>
        </div>
        <div
          v-for="row in lapRows"
          :key="row.index"
          grid="~ cols-[auto_1fr_1fr] gap-x-4 items-center"
          border="b c-border"
          py-2.5 last:border-b-0
        >
          <span text="sm c-text-muted" font-mono>{{ pad(row.index) }}</span>
          <span text="base c-text" font-mono text-right tabular-nums>{{ formatLap(row.split) }}</span>
          <span text="base c-text-muted" font-mono text-right tabular-nums>{{ formatLap(row.total) }}</span>
        </div>
      </div>
    </Panel>
  </div>
</template>

<style scoped>
/* The clock scales to this container's width (via cqw units below) rather than
   the viewport, so it never overflows the panel when a sidebar narrows the
   content area. In fullscreen the stage spans the screen, so it still grows. */
.clock-stage {
  container-type: inline-size;
}

/* Fixed-width digit cells: DM Serif Display is not monospaced and lacks
   tabular figures, so each digit is locked into an em-relative box (sized
   against the parent font-size) to stop the time from shifting as it ticks. */
.clk-cell {
  display: inline-block;
  width: 0.62em;
  text-align: center;
}
.clk-sep {
  display: inline-block;
  width: 0.34em;
  text-align: center;
}
</style>
