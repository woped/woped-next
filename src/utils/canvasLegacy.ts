/**
 * Legacy WoPeD canvas drawing constants and helpers.
 * Ported from Java Swing PlaceView / TransSimpleView / SubProcessView /
 * PetriNetElementView (JGraph defaults).
 */

export const LEGACY_SIZE = 40
export const LEGACY_BORDER = 1
export const LEGACY_TOKEN_RADIUS = 5

/** Inset box inside the 40×40 footprint (TransSimpleView). */
export const LEGACY_INNER_SIZE = LEGACY_SIZE - LEGACY_BORDER - 1

export const LEGACY_COLORS = {
  border: '#000000',
  borderReadonly: '#E1E1E1',
  fill: 'transparent',
  inner: '#000000',
  activeInner: '#32C864',
  activeFill: 'rgba(50,200,100,0.1)',
  tokenFill: '#000000',
  selectedStroke: '#3b82f6',
  combiZoneFill: '#ffffff',
} as const

export interface LegacyElementColors {
  fill: string
  stroke: string
  inner: string
  tokenFill: string
}

export interface BoxRect {
  x: number
  y: number
  width: number
  height: number
}

export interface TokenDot {
  x: number
  y: number
}

export interface LegacyTokenDisplay {
  dots: TokenDot[]
  /** Centered label for 4+ tokens; null when dots are shown. */
  label: string | null
}

/** Convert element centre (WoPeD Next store) to legacy top-left corner. */
export function centerToTopLeft(cx: number, cy: number): { x: number; y: number } {
  const half = LEGACY_SIZE / 2
  return { x: cx - half, y: cy - half }
}

export function getLegacyBorderColor(options: { readonly?: boolean; isDark?: boolean }): string {
  if (options.readonly) return LEGACY_COLORS.borderReadonly
  if (options.isDark) return '#e5e7eb'
  return LEGACY_COLORS.border
}

export function getLegacyElementColors(options: {
  active?: boolean
  selected?: boolean
  readonly?: boolean
  isDark?: boolean
}): LegacyElementColors {
  const stroke = options.selected
    ? LEGACY_COLORS.selectedStroke
    : getLegacyBorderColor({ readonly: options.readonly, isDark: options.isDark })

  const inner = options.active
    ? LEGACY_COLORS.activeInner
    : options.isDark
      ? '#e5e7eb'
      : LEGACY_COLORS.inner

  return {
    fill: options.active ? LEGACY_COLORS.activeFill : LEGACY_COLORS.fill,
    stroke: options.active && !options.selected ? LEGACY_COLORS.activeInner : stroke,
    inner,
    tokenFill: options.isDark ? '#e5e7eb' : LEGACY_COLORS.tokenFill,
  }
}

/** Transition / operator base rectangle (TransSimpleView). */
export function getLegacyInnerBoxRect(cx: number, cy: number): BoxRect {
  const tl = centerToTopLeft(cx, cy)
  const b = LEGACY_BORDER
  return {
    x: tl.x + b,
    y: tl.y + b,
    width: LEGACY_INNER_SIZE,
    height: LEGACY_INNER_SIZE,
  }
}

/** SubProcessView outer + inner double border. */
export function getLegacySubprocessRects(cx: number, cy: number): { outer: BoxRect; inner: BoxRect } {
  const tl = centerToTopLeft(cx, cy)
  const b = LEGACY_BORDER
  return {
    outer: {
      x: tl.x + b - 1,
      y: tl.y + b - 1,
      width: LEGACY_SIZE - b,
      height: LEGACY_SIZE - b,
    },
    inner: {
      x: tl.x + 5,
      y: tl.y + 5,
      width: 29,
      height: 29,
    },
  }
}

/** Three vertical zones for combined operators (CombiOperatorView). */
export function getLegacyCombiZoneRects(cx: number, cy: number): BoxRect[] {
  const tl = centerToTopLeft(cx, cy)
  const b = LEGACY_BORDER
  const zoneW = LEGACY_SIZE / 3
  const zoneH = LEGACY_INNER_SIZE
  const y = tl.y + b
  return [
    { x: tl.x + b, y, width: zoneW, height: zoneH },
    { x: tl.x + b + zoneW, y, width: zoneW, height: zoneH },
    { x: tl.x + b + 2 * zoneW, y, width: zoneW, height: zoneH },
  ]
}

/**
 * Token layout inside a place (PlaceView.PlaceRenderer).
 * Positions are absolute canvas coordinates (element centre = cx, cy).
 */
export function layoutLegacyPlaceTokens(cx: number, cy: number, tokens: number): LegacyTokenDisplay {
  if (tokens <= 0) return { dots: [], label: null }

  const third = LEGACY_SIZE / 3
  const left = cx - LEGACY_SIZE / 2
  const top = cy - LEGACY_SIZE / 2

  if (tokens === 1) {
    return { dots: [{ x: cx, y: cy }], label: null }
  }
  if (tokens === 2) {
    return {
      dots: [
        { x: left + third, y: cy },
        { x: left + 2 * third, y: cy },
      ],
      label: null,
    }
  }
  if (tokens === 3) {
    return {
      dots: [
        { x: cx, y: top + third },
        { x: left + third, y: top + (2 * third) },
        { x: left + 2 * third, y: top + (2 * third) },
      ],
      label: null,
    }
  }

  return {
    dots: [],
    label: tokens > 99 ? 'ω' : String(tokens),
  }
}

/** Place circle radius (PlaceView). */
export function getLegacyPlaceRadius(): number {
  return (LEGACY_SIZE - LEGACY_BORDER) / 2
}

/** Faint chevron fill matching legacy arrow alpha (~10%). */
export function legacyChevronFill(innerColor: string): string {
  if (innerColor.startsWith('#')) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(innerColor)
    if (m) {
      return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, 0.1)`
    }
  }
  if (innerColor.startsWith('rgba')) return innerColor
  return 'rgba(0, 0, 0, 0.1)'
}
