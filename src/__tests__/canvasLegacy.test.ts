import { describe, it, expect } from 'vitest'
import {
  LEGACY_SIZE,
  centerToTopLeft,
  getLegacyInnerBoxRect,
  getLegacySubprocessRects,
  layoutLegacyPlaceTokens,
  getLegacyPlaceRadius,
  getLegacyElementColors,
} from '@/utils/canvasLegacy'

describe('canvasLegacy', () => {
  it('converts centre to top-left for 40×40 footprint', () => {
    expect(centerToTopLeft(100, 80)).toEqual({ x: 80, y: 60 })
  })

  it('computes inner transition box (38×38 inset)', () => {
    const box = getLegacyInnerBoxRect(100, 80)
    expect(box).toEqual({ x: 81, y: 61, width: 38, height: 38 })
  })

  it('computes subprocess double-border rects', () => {
    const { outer, inner } = getLegacySubprocessRects(100, 80)
    expect(outer).toEqual({ x: 80, y: 60, width: 39, height: 39 })
    expect(inner).toEqual({ x: 85, y: 65, width: 29, height: 29 })
  })

  it('uses legacy place radius', () => {
    expect(getLegacyPlaceRadius()).toBe((LEGACY_SIZE - 1) / 2)
  })

  it('lays out 1–3 tokens like PlaceView', () => {
    const cx = 100
    const cy = 80
    expect(layoutLegacyPlaceTokens(cx, cy, 1).dots).toEqual([{ x: cx, y: cy }])
    expect(layoutLegacyPlaceTokens(cx, cy, 2).dots).toHaveLength(2)
    expect(layoutLegacyPlaceTokens(cx, cy, 3).dots).toHaveLength(3)
    expect(layoutLegacyPlaceTokens(cx, cy, 4).label).toBe('4')
    expect(layoutLegacyPlaceTokens(cx, cy, 100).label).toBe('ω')
  })

  it('applies active fill and inner colour', () => {
    const c = getLegacyElementColors({ active: true })
    expect(c.fill).toBe('rgba(50,200,100,0.1)')
    expect(c.inner).toBe('#32C864')
  })

  it('uses readonly border colour', () => {
    const c = getLegacyElementColors({ readonly: true })
    expect(c.stroke).toBe('#E1E1E1')
  })
})
