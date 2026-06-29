import { describe, it, expect } from 'vitest'
import {
  oppositePosition,
  snapToCardinal,
  getOperatorOrientation,
  getOperatorGlyphs,
  chevronGeometry,
  type GlyphBox,
} from '@/utils/operatorGlyph'
import { OperatorType } from '@/types/petri-net'

const BOX: GlyphBox = { width: 40, height: 40, border: 2 }

describe('operatorGlyph — geometry helpers', () => {
  describe('oppositePosition', () => {
    it('returns the opposite cardinal side', () => {
      expect(oppositePosition('north')).toBe('south')
      expect(oppositePosition('south')).toBe('north')
      expect(oppositePosition('east')).toBe('west')
      expect(oppositePosition('west')).toBe('east')
    })
  })

  describe('snapToCardinal', () => {
    it('snaps to the dominant axis', () => {
      expect(snapToCardinal(10, 1)).toBe('east')
      expect(snapToCardinal(-10, 1)).toBe('west')
      expect(snapToCardinal(1, 10)).toBe('south')
      expect(snapToCardinal(1, -10)).toBe('north')
    })

    it('defaults to east for a zero vector (left-to-right flow)', () => {
      expect(snapToCardinal(0, 0)).toBe('east')
    })
  })

  describe('chevronGeometry', () => {
    it('produces a polygon for every side/direction', () => {
      for (const position of ['north', 'east', 'south', 'west'] as const) {
        for (const direction of ['in', 'out'] as const) {
          const geo = chevronGeometry(BOX, position, direction)
          expect(geo.polygon.length).toBeGreaterThanOrEqual(8)
          expect(geo.polygon.length % 2).toBe(0)
        }
      }
    })

    it('adds a divider line for split (out) glyphs only', () => {
      expect(chevronGeometry(BOX, 'east', 'out').line).not.toBeNull()
      expect(chevronGeometry(BOX, 'east', 'in').line).toBeNull()
      expect(chevronGeometry(BOX, 'west', 'out').line).not.toBeNull()
      expect(chevronGeometry(BOX, 'west', 'in').line).toBeNull()
    })

    it('keeps all points within the box bounds', () => {
      for (const position of ['north', 'east', 'south', 'west'] as const) {
        const geo = chevronGeometry(BOX, position, 'out')
        for (let i = 0; i < geo.polygon.length; i += 2) {
          expect(geo.polygon[i]).toBeGreaterThanOrEqual(0)
          expect(geo.polygon[i]).toBeLessThanOrEqual(BOX.width)
          expect(geo.polygon[i + 1]).toBeGreaterThanOrEqual(0)
          expect(geo.polygon[i + 1]).toBeLessThanOrEqual(BOX.height)
        }
      }
    })
  })
})

describe('operatorGlyph — orientation', () => {
  const center = { x: 100, y: 100 }

  it('defaults to horizontal (join west, split east) without arcs', () => {
    const o = getOperatorOrientation(center, [], [])
    expect(o.splitPosition).toBe('east')
    expect(o.joinPosition).toBe('west')
  })

  it('derives horizontal flow from neighbour positions', () => {
    const o = getOperatorOrientation(center, [{ x: 0, y: 100 }], [{ x: 200, y: 100 }])
    expect(o.splitPosition).toBe('east')
    expect(o.joinPosition).toBe('west')
  })

  it('derives vertical flow from neighbour positions', () => {
    const o = getOperatorOrientation(center, [{ x: 100, y: 0 }], [{ x: 100, y: 200 }])
    expect(o.splitPosition).toBe('south')
    expect(o.joinPosition).toBe('north')
  })

  it('handles reversed (right-to-left) flow', () => {
    const o = getOperatorOrientation(center, [{ x: 200, y: 100 }], [{ x: 0, y: 100 }])
    expect(o.splitPosition).toBe('west')
    expect(o.joinPosition).toBe('east')
  })

  it('infers from outputs only', () => {
    const o = getOperatorOrientation(center, [], [{ x: 100, y: 300 }])
    expect(o.splitPosition).toBe('south')
  })
})

describe('operatorGlyph — glyph selection per operator type', () => {
  const orientation = { joinPosition: 'west', splitPosition: 'east' } as const

  // In the legacy notation the AND/XOR distinction is the arrow direction
  // (AND = IN, XOR = OUT) and split/join is the side (split = east, join = west).
  it('AND-Split: arrow on the split side pointing inwards', () => {
    const g = getOperatorGlyphs(OperatorType.AND_SPLIT, orientation)
    expect(g).toHaveLength(1)
    expect(g[0]).toMatchObject({ direction: 'in', position: 'east' })
  })

  it('XOR-Split: arrow on the split side pointing outwards', () => {
    const g = getOperatorGlyphs(OperatorType.XOR_SPLIT, orientation)
    expect(g).toHaveLength(1)
    expect(g[0]).toMatchObject({ direction: 'out', position: 'east' })
  })

  it('AND-Join: arrow on the join side pointing inwards', () => {
    const g = getOperatorGlyphs(OperatorType.AND_JOIN, orientation)
    expect(g).toHaveLength(1)
    expect(g[0]).toMatchObject({ direction: 'in', position: 'west' })
  })

  it('XOR-Join: arrow on the join side pointing outwards', () => {
    const g = getOperatorGlyphs(OperatorType.XOR_JOIN, orientation)
    expect(g).toHaveLength(1)
    expect(g[0]).toMatchObject({ direction: 'out', position: 'west' })
  })

  it('AND-Split-Join: primary join glyph + opposite glyph with flipped direction', () => {
    const g = getOperatorGlyphs(OperatorType.AND_SPLIT_JOIN, orientation)
    expect(g).toHaveLength(2)
    expect(g[0]).toMatchObject({ position: 'west', direction: 'in' })
    expect(g[1]).toMatchObject({ position: 'east', direction: 'out' })
  })

  it('XOR-Split-Join: primary join glyph + opposite glyph with flipped direction', () => {
    const g = getOperatorGlyphs(OperatorType.XOR_SPLIT_JOIN, orientation)
    expect(g).toHaveLength(2)
    expect(g[0]).toMatchObject({ position: 'west', direction: 'out' })
    expect(g[1]).toMatchObject({ position: 'east', direction: 'in' })
  })
})
