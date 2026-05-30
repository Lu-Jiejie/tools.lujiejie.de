<script setup lang="ts">
import { computed, ref, watch } from 'vue'

// A single odometer-style digit cell with a seamless, single-direction loop.
// The strip repeats 0..max (so a minutes/seconds tens place loops 0-5, while a
// units or hours place loops 0-9) and always rolls the way `dir` points, so a
// counting digit keeps spinning the same direction and wraps by a single step
// instead of rewinding. The viewport is exactly one glyph tall — at rest only
// the current digit shows (neighbours clipped just outside) — and its top/bottom
// are edge-faded, so a digit only softens as it rolls out past an edge and the
// next one softly rolls in. Roll duration scales with the steps crossed.
const props = withDefaults(defineProps<{
  digit: string | number
  max?: number
  dir?: 'up' | 'down'
  baseMs?: number
  stepMs?: number
  maxMs?: number
  // When false the digit snaps to its value with no roll. Used for the fast
  // milliseconds place while a timer runs (rolling every frame would lag and
  // overflow the strip); it still rolls on a paused mode switch when animate is
  // re-enabled.
  animate?: boolean
}>(), {
  max: 9,
  dir: 'up',
  baseMs: 200,
  stepMs: 200,
  maxMs: 600,
  animate: true,
})

// Decades of glyphs in the strip; `pos` rests in the middle one so a roll in
// either direction always has room before an invisible whole-decade rebase.
const REPEAT = 6

const radix = computed(() => Math.max(2, Math.trunc(props.max) + 1))
const strip = computed(() =>
  Array.from({ length: radix.value * REPEAT }, (_, k) => k % radix.value))
const band = computed(() => radix.value * Math.floor(REPEAT / 2))

function toVal(d: string | number) {
  const n = Math.trunc(Number(d))
  if (!Number.isFinite(n))
    return 0
  return Math.min(radix.value - 1, Math.max(0, n))
}

const pos = ref(band.value + toVal(props.digit))
const duration = ref(0)
const stripRef = ref<HTMLElement | null>(null)

watch(() => props.digit, (d) => {
  const r = radix.value
  const target = toVal(d)
  const current = ((pos.value % r) + r) % r
  if (target === current)
    return
  // Animation off: snap straight to the value (and stay in the resting band so
  // a fast-updating place never drifts off the end of the strip).
  if (!props.animate) {
    duration.value = 0
    pos.value = band.value + target
    return
  }
  // Steps to reach the target while moving in `dir` (1..r-1); a wrap is just 1.
  const steps = props.dir === 'up'
    ? (target - current + r) % r
    : (current - target + r) % r
  // Rebase the reel to a band-relative start congruent to the on-screen glyph,
  // committing it instantly (0ms + forced reflow) before the roll. Without this,
  // rapid rolls that interrupt each other (e.g. press-and-hold) never reach
  // `transitionend`, so `pos` keeps accumulating and eventually scrolls the digit
  // clean off the end of the strip. Rebasing every time keeps `pos` bounded, and
  // because the start glyph is identical the snap is invisible.
  const startPos = band.value + current
  const targetPos = startPos + (props.dir === 'up' ? steps : -steps)
  const dur = Math.min(props.maxMs, props.baseMs + steps * props.stepMs)
  // Drive the roll imperatively. Doing it via the reactive style alone is
  // unreliable here: consecutive hold steps share the same `dur`, so Vue would
  // skip rewriting the duration and leave the 0ms snap in place (no animation).
  const el = stripRef.value
  if (el) {
    el.style.transitionDuration = '0ms'
    el.style.transform = `translateY(${-startPos}em)`
    void el.offsetHeight
    el.style.transitionDuration = `${dur}ms`
    el.style.transform = `translateY(${-targetPos}em)`
  }
  // Keep the refs in sync so the reactive binding, `onSettled`, and the next
  // roll all agree with what was just written to the DOM.
  pos.value = targetPos
  duration.value = dur
})

// Once a roll settles, pin the reel and (when needed) shift `pos` back into the
// resting band by whole decades. A decade-sized jump lands on the same digit,
// so nothing visibly moves — it just restores headroom for the next roll.
function onSettled() {
  const r = radix.value
  const home = band.value + (((pos.value % r) + r) % r)
  // Always drop the duration to 0 once a roll lands, even when no rebase is
  // needed. The strip's transform is em-based, so a later width change shifts
  // the font-size (and thus the resolved px) — a leftover non-zero duration
  // would re-run the transition and the digit would appear to roll on its own
  // though its value never changed.
  duration.value = 0
  if (home !== pos.value)
    pos.value = home
}
</script>

<template>
  <span class="roll-cell">
    <span
      ref="stripRef"
      class="roll-strip"
      :style="{
        transform: `translateY(${-pos}em)`,
        transitionDuration: `${duration}ms`,
      }"
      @transitionend="onSettled"
    >
      <span v-for="(g, k) in strip" :key="k" class="roll-glyph">{{ g }}</span>
    </span>
  </span>
</template>

<style scoped>
.roll-cell {
  display: inline-block;
  width: 0.62em;
  height: 1em;
  overflow: hidden;
  line-height: 1;
  vertical-align: top;
  /* Soften only the rolling edges: the fade sits in the line-box leading above
     and below the digit ink, so a resting (centred) digit stays crisp while a
     digit rolling out past the edge — and the next rolling in — go soft. */
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 16%, #000 84%, transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0%, #000 16%, #000 84%, transparent 100%);
}
.roll-strip {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}
.roll-glyph {
  display: block;
  width: 100%;
  height: 1em;
  line-height: 1;
  text-align: center;
}
</style>
