import transformerDirectives from '@unocss/transformer-directives'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetWebFonts,
  presetWind4,
} from 'unocss'

export default defineConfig({
  shortcuts: [
    ['tool-card', 'flex flex-col gap-4 p-5 rounded-2xl cursor-pointer bg-[var(--c-surface)] border border-[var(--c-border)] transition-all duration-200 hover:border-[var(--c-border-strong)]'],
    ['category-pill', 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[var(--c-surface-raised)] text-[var(--c-text-faint)] border border-[var(--c-border)]'],
    ['icon-btn', 'flex items-center justify-center w-7 h-7 rounded-lg text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-surface-raised)] transition-colors duration-150'],
    ['section-label', 'text-xs font-semibold uppercase tracking-widest select-none text-[var(--c-text-muted)]'],
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
