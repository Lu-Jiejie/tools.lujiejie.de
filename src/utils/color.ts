/**
 * Color utility functions shared across the app.
 */

/** RGBA components: each channel 0–255, alpha 0–1. */
export interface Rgba {
  r: number
  g: number
  b: number
  a?: number
}

/** HSL components: hue 0–360, saturation 0–100, lightness 0–100. */
export interface Hsl {
  h: number
  s: number
  l: number
}

/** Parse a hex color string (3, 4, 6, or 8 digits) into RGBA. */
export function hexToRgba(hex: string): Rgba {
  let h = hex.replace(/^#/, '')
  if (h.length === 3 || h.length === 4) {
    h = h
      .split('')
      .map(c => c + c)
      .join('')
  }
  const r = Number.parseInt(h.slice(0, 2), 16)
  const g = Number.parseInt(h.slice(2, 4), 16)
  const b = Number.parseInt(h.slice(4, 6), 16)
  const a = h.length >= 8 ? Number.parseInt(h.slice(6, 8), 16) / 255 : 1
  return { r, g, b, a }
}

/**
 * Calculate relative luminance from RGB (0–255).
 * Uses the sRGB luminance formula (ITU-R BT.709 / WCAG 2.x).
 * Returns a value between 0 (darkest) and 1 (lightest).
 */
export function relativeLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/**
 * Return a readable foreground text color (#111827 or #ffffff)
 * for a given background color. Uses relative luminance with
 * a threshold of 0.58.
 */
export function readableTextColor(hex: string): string {
  const { r, g, b } = hexToRgba(hex)
  return relativeLuminance(r, g, b) > 0.58 ? '#111827' : '#ffffff'
}

/**
 * Convert RGBA (0–255) to a hex string.
 */
export function rgbaToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Convert hex to HSL. Returns { h: 0–360, s: 0–100, l: 0–100 }.
 */
export function hexToHsl(hex: string): Hsl {
  const { r, g, b } = hexToRgba(hex)
  const rr = r / 255
  const gg = g / 255
  const bb = b / 255

  const max = Math.max(rr, gg, bb)
  const min = Math.min(rr, gg, bb)
  const l = (max + min) / 2

  if (max === min)
    return { h: 0, s: 0, l: Math.round(l * 100) }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0

  switch (max) {
    case rr: h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6
      break
    case gg: h = ((bb - rr) / d + 2) / 6
      break
    case bb: h = ((rr - gg) / d + 4) / 6
      break
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}
