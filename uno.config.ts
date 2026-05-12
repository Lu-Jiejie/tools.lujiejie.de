import transformerDirectives from '@unocss/transformer-directives'
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
        'text': 'var(--c-text)',
        'muted': 'var(--c-text-muted)',
        'faint': 'var(--c-text-faint)',
        'accent': 'var(--c-accent)',
        'soft': 'var(--c-accent-soft)',
      },
    },
  },
  shortcuts: [
    ['page-container', 'mx-auto px-6 py-12 max-w-4xl md:px-12'],
    ['page-title', 'text-5xl text-c-text leading-none tracking-tight font-bold select-none'],
    ['tool-card', 'flex flex-col gap-4 p-5 rounded-2xl cursor-pointer bg-c-surface border border-c-border transition-all duration-200 hover:border-c-border-strong'],
    ['search-box', 'px-3.5 py-2 border border-c-border rounded-xl bg-c-surface flex gap-2.5 transition-colors duration-200 items-center hover:border-c-border-strong focus-within:border-c-border-strong'],
    ['category-pill', 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-c-raised text-c-faint border border-c-border'],
    ['icon-btn', 'flex items-center justify-center w-7 h-7 rounded-lg text-c-muted hover:text-c-text hover:bg-c-raised transition-colors duration-150'],
    ['btn-favorite', 'flex shrink-0 h-6 w-6 transition-colors duration-200 items-center justify-center text-c-faint hover:text-c-muted'],
    ['btn-favorite-active', 'flex shrink-0 h-6 w-6 transition-colors duration-200 items-center justify-center text-amber-500'],
    ['section-label', 'text-xs font-semibold uppercase tracking-widest select-none text-c-muted'],
    ['nav-item', 'text-sm ml-2 mb-0.5 px-2 py-1.5 rounded-lg flex transition-colors duration-150 items-center justify-between text-c-text opacity-85 hover:(bg-c-raised opacity-100)'],
    ['nav-item-active', '!bg-c-soft !text-c-accent !opacity-100'],
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
  ],
})
