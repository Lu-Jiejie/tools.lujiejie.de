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
        'border': 'var(--c-border)',
        'border-strong': 'var(--c-border-strong)',
        'accent': 'var(--c-accent)',
        'soft': 'var(--c-accent-soft)',
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
    // sidebar nav (nav links + active state)
    ['nav-item', 'text-sm ml-2 mb-0.5 px-2 py-1.5 rounded-lg flex transition-colors duration-150 items-center justify-between op-85 hover:(bg-c-raised !op-90)'],
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
