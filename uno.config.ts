import transformerDirectives from '@unocss/transformer-directives'
import transformerVariantGroup from '@unocss/transformer-variant-group'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetWebFonts,
  presetWind4,
} from 'unocss'

export default defineConfig({
  theme: {
    colors: {
      c: {
        'bg': 'var(--c-bg)',
        'surface': 'var(--c-surface)',
        'raised': 'var(--c-surface-raised)',
        'input': 'var(--c-input)',
        'input-readonly': 'var(--c-input-readonly)',
        'border': 'var(--c-border)',
        'border-strong': 'var(--c-border-strong)',
        'accent': 'var(--c-accent)',
        'soft': 'var(--c-accent-soft)',
        'text': 'var(--c-text)',
        'text-muted': 'var(--c-text-muted)',
        'text-faint': 'var(--c-text-faint)',
      },
    },
  },
  shortcuts: [
    // layout primitives
    ['place-center', 'flex items-center justify-center'],
    ['page-container', 'mx-auto px-6 py-12 max-w-4xl md:px-12'],
    // tools grid (used in two places)
    ['tools-grid', 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'],
    // icon button (header icons + search clear button)
    ['icon-btn', 'place-center rounded-lg op-60 hover:op-90 hover:bg-c-raised transition-150'],
    // favorite buttons (ToolCard + [tool].vue)
    ['btn-favorite', 'flex shrink-0 size-6 place-center op-30 hover:op-60 transition-colors duration-200'],
    ['btn-favorite-active', 'flex shrink-0 size-6 place-center text-amber-500 transition-colors duration-200'],
    // panel card shadow
    ['panel-shadow', 'shadow-[0_1px_3px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.04)]'],
    // chip/tag button — base (CronTool mode-btn / specific-btn)
    ['btn-chip', 'border border-c-border rounded-md px-2.5 py-1 text-xs font-medium transition-all-150 cursor-pointer bg-c-raised'],
    // chip/tag button — active state
    ['btn-chip-active', 'border-c-accent text-c-accent bg-[color-mix(in_srgb,var(--c-accent)_8%,transparent)]'],
    // header glass-morphism blur
    ['header-blur', 'bg-[color-mix(in_srgb,var(--c-surface)_85%,transparent)] backdrop-blur-12'],
    // custom <select> dropdown arrow
    ['select-base', 'appearance-none bg-no-repeat'],
  ],
  presets: [
    presetWind4(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
    presetWebFonts({
      fonts: {
        sans: 'DM Sans',
        serif: 'DM Serif Display',
        mono: 'DM Mono',
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})
