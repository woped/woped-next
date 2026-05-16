import { describe, it, expect } from 'vitest'
import {
  distance,
  angle,
  pointOnCircle,
  snapToGrid,
  isPointInRect,
  isPointInCircle,
  getBoundingBox,
} from '@/utils/geometry'
import {
  SeededRandom,
  mean,
  variance,
  standardDeviation,
  median,
  percentile,
  min,
  max,
} from '@/utils/random'
import { PriorityQueue } from '@/utils/priorityQueue'
import { orthogonalRoute, bezierRoute, bezierToPath } from '@/utils/routing'

describe('geometry', () => {
  describe('distance', () => {
    it('returns 0 for the same point', () => {
      expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0)
    })

    it('calculates 3-4-5 triangle hypotenuse', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    })

    it('calculates vertical distance', () => {
      expect(distance({ x: 0, y: 0 }, { x: 0, y: 7 })).toBe(7)
    })

    it('calculates horizontal distance', () => {
      expect(distance({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(10)
    })
  })

  describe('angle', () => {
    it('returns 0 for a point to the right', () => {
      expect(angle({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(0)
    })

    it('returns PI/2 for a point below', () => {
      expect(angle({ x: 0, y: 0 }, { x: 0, y: 10 })).toBeCloseTo(Math.PI / 2)
    })

    it('returns PI for a point to the left', () => {
      expect(angle({ x: 0, y: 0 }, { x: -10, y: 0 })).toBeCloseTo(Math.PI)
    })

    it('returns negative for a point above', () => {
      expect(angle({ x: 0, y: 0 }, { x: 0, y: -10 })).toBeCloseTo(-Math.PI / 2)
    })
  })

  describe('pointOnCircle', () => {
    it('returns point to the right at angle 0', () => {
      const p = pointOnCircle({ x: 10, y: 10 }, 5, 0)
      expect(p.x).toBeCloseTo(15)
      expect(p.y).toBeCloseTo(10)
    })

    it('returns point above at angle -PI/2', () => {
      const p = pointOnCircle({ x: 10, y: 10 }, 5, -Math.PI / 2)
      expect(p.x).toBeCloseTo(10)
      expect(p.y).toBeCloseTo(5)
    })
  })

  describe('snapToGrid', () => {
    it('snaps to nearest grid point', () => {
      expect(snapToGrid({ x: 14, y: 26 }, 10)).toEqual({ x: 10, y: 30 })
    })

    it('keeps position already on grid', () => {
      expect(snapToGrid({ x: 20, y: 40 }, 10)).toEqual({ x: 20, y: 40 })
    })

    it('snaps with different grid sizes', () => {
      expect(snapToGrid({ x: 7, y: 13 }, 5)).toEqual({ x: 5, y: 15 })
    })
  })

  describe('isPointInRect', () => {
    it('returns true for a point inside', () => {
      expect(isPointInRect({ x: 52, y: 52 }, { x: 50, y: 50 }, 20, 20)).toBe(true)
    })

    it('returns false for a point outside', () => {
      expect(isPointInRect({ x: 100, y: 100 }, { x: 50, y: 50 }, 20, 20)).toBe(false)
    })

    it('returns true for a point on the edge', () => {
      expect(isPointInRect({ x: 60, y: 50 }, { x: 50, y: 50 }, 20, 20)).toBe(true)
    })
  })

  describe('isPointInCircle', () => {
    it('returns true for a point inside', () => {
      expect(isPointInCircle({ x: 11, y: 11 }, { x: 10, y: 10 }, 5)).toBe(true)
    })

    it('returns false for a point outside', () => {
      expect(isPointInCircle({ x: 20, y: 20 }, { x: 10, y: 10 }, 5)).toBe(false)
    })

    it('returns true for a point on the edge', () => {
      expect(isPointInCircle({ x: 15, y: 10 }, { x: 10, y: 10 }, 5)).toBe(true)
    })
  })

  describe('getBoundingBox', () => {
    it('returns null for empty array', () => {
      expect(getBoundingBox([])).toBeNull()
    })

    it('returns box around a single point with default padding', () => {
      const box = getBoundingBox([{ x: 100, y: 100 }])
      expect(box).toEqual({ x: 50, y: 50, width: 100, height: 100 })
    })

    it('returns correct box for multiple points with custom padding', () => {
      const box = getBoundingBox(
        [{ x: 0, y: 0 }, { x: 100, y: 200 }],
        10
      )
      expect(box).toEqual({ x: -10, y: -10, width: 120, height: 220 })
    })
  })
})

describe('random', () => {
  describe('SeededRandom', () => {
    it('produces the same sequence for the same seed', () => {
      const rng1 = new SeededRandom(42)
      const rng2 = new SeededRandom(42)
      const seq1 = Array.from({ length: 5 }, () => rng1.random())
      const seq2 = Array.from({ length: 5 }, () => rng2.random())
      expect(seq1).toEqual(seq2)
    })

    it('produces different sequences for different seeds', () => {
      const rng1 = new SeededRandom(42)
      const rng2 = new SeededRandom(99)
      const seq1 = Array.from({ length: 5 }, () => rng1.random())
      const seq2 = Array.from({ length: 5 }, () => rng2.random())
      expect(seq1).not.toEqual(seq2)
    })

    it('randomInt returns values within range', () => {
      const rng = new SeededRandom(42)
      for (let i = 0; i < 100; i++) {
        const val = rng.randomInt(1, 6)
        expect(val).toBeGreaterThanOrEqual(1)
        expect(val).toBeLessThanOrEqual(6)
      }
    })

    it('sample constant returns that constant', () => {
      const rng = new SeededRandom(42)
      expect(rng.sample({ type: 'constant', params: [7] })).toBe(7)
    })

    it('sample uniform returns values within range', () => {
      const rng = new SeededRandom(42)
      for (let i = 0; i < 100; i++) {
        const val = rng.sample({ type: 'uniform', params: [10, 20] })
        expect(val).toBeGreaterThanOrEqual(10)
        expect(val).toBeLessThan(20)
      }
    })
  })

  describe('mean', () => {
    it('returns 0 for empty array', () => {
      expect(mean([])).toBe(0)
    })

    it('calculates correctly', () => {
      expect(mean([1, 2, 3])).toBe(2)
    })
  })

  describe('variance', () => {
    it('returns 0 for empty array', () => {
      expect(variance([])).toBe(0)
    })

    it('returns 0 for single element', () => {
      expect(variance([5])).toBe(0)
    })

    it('calculates sample variance', () => {
      expect(variance([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(4.571, 2)
    })
  })

  describe('standardDeviation', () => {
    it('is sqrt of variance', () => {
      const data = [2, 4, 4, 4, 5, 5, 7, 9]
      expect(standardDeviation(data)).toBeCloseTo(Math.sqrt(variance(data)))
    })
  })

  describe('median', () => {
    it('returns 0 for empty array', () => {
      expect(median([])).toBe(0)
    })

    it('returns middle for odd count', () => {
      expect(median([3, 1, 2])).toBe(2)
    })

    it('returns average of middle two for even count', () => {
      expect(median([4, 1, 3, 2])).toBe(2.5)
    })
  })

  describe('percentile', () => {
    const data = [1, 2, 3, 4, 5]

    it('p50 equals median', () => {
      expect(percentile(data, 50)).toBe(median(data))
    })

    it('p0 equals minimum', () => {
      expect(percentile(data, 0)).toBe(1)
    })

    it('p100 equals maximum', () => {
      expect(percentile(data, 100)).toBe(5)
    })
  })

  describe('min / max', () => {
    it('returns 0 for empty array', () => {
      expect(min([])).toBe(0)
      expect(max([])).toBe(0)
    })

    it('returns correct values', () => {
      expect(min([3, 1, 4, 1, 5])).toBe(1)
      expect(max([3, 1, 4, 1, 5])).toBe(5)
    })
  })
})

describe('PriorityQueue', () => {
  const numCmp = (a: number, b: number) => a - b

  it('pops elements in sorted order', () => {
    const pq = new PriorityQueue<number>(numCmp)
    pq.push(5)
    pq.push(1)
    pq.push(3)
    expect(pq.pop()).toBe(1)
    expect(pq.pop()).toBe(3)
    expect(pq.pop()).toBe(5)
  })

  it('tracks isEmpty and size', () => {
    const pq = new PriorityQueue<number>(numCmp)
    expect(pq.isEmpty).toBe(true)
    expect(pq.size).toBe(0)
    pq.push(10)
    expect(pq.isEmpty).toBe(false)
    expect(pq.size).toBe(1)
  })

  it('peek returns minimum without removing', () => {
    const pq = new PriorityQueue<number>(numCmp)
    pq.push(3)
    pq.push(1)
    expect(pq.peek()).toBe(1)
    expect(pq.size).toBe(2)
  })

  it('clear empties the queue', () => {
    const pq = new PriorityQueue<number>(numCmp)
    pq.push(1)
    pq.push(2)
    pq.clear()
    expect(pq.isEmpty).toBe(true)
    expect(pq.size).toBe(0)
  })

  it('toArray returns sorted copy', () => {
    const pq = new PriorityQueue<number>(numCmp)
    pq.push(5)
    pq.push(1)
    pq.push(3)
    expect(pq.toArray()).toEqual([1, 3, 5])
    expect(pq.size).toBe(3)
  })

  it('pop from empty returns undefined', () => {
    const pq = new PriorityQueue<number>(numCmp)
    expect(pq.pop()).toBeUndefined()
  })
})

describe('routing', () => {
  describe('orthogonalRoute', () => {
    it('creates horizontal-first route when dx > dy', () => {
      const pts = orthogonalRoute(
        { x: 0, y: 0 },
        { x: 200, y: 50 },
        'place',
        'transition'
      )
      expect(pts).toHaveLength(4)
      expect(pts[0]).toEqual({ x: 0, y: 0 })
      expect(pts[1].y).toBe(0)
      expect(pts[2].y).toBe(50)
      expect(pts[3]).toEqual({ x: 200, y: 50 })
    })

    it('creates vertical-first route when dy > dx', () => {
      const pts = orthogonalRoute(
        { x: 0, y: 0 },
        { x: 10, y: 200 },
        'place',
        'transition'
      )
      expect(pts).toHaveLength(4)
      expect(pts[1].x).toBe(0)
      expect(pts[2].x).toBe(10)
    })
  })

  describe('bezierRoute', () => {
    it('creates 3-point bezier path', () => {
      const pts = bezierRoute({ x: 0, y: 0 }, { x: 100, y: 0 })
      expect(pts).toHaveLength(3)
      expect(pts[0]).toEqual({ x: 0, y: 0 })
      expect(pts[2]).toEqual({ x: 100, y: 0 })
    })

    it('returns fallback for zero distance', () => {
      const pts = bezierRoute({ x: 50, y: 50 }, { x: 50, y: 50 })
      expect(pts).toHaveLength(3)
      expect(pts[1]).toEqual({ x: 50, y: 20 })
    })
  })

  describe('bezierToPath', () => {
    it('generates valid SVG quadratic bezier path', () => {
      const path = bezierToPath([
        { x: 0, y: 0 },
        { x: 50, y: -20 },
        { x: 100, y: 0 },
      ])
      expect(path).toBe('M 0 0 Q 50 -20 100 0')
    })

    it('falls back to line for 2 points', () => {
      const path = bezierToPath([{ x: 0, y: 0 }, { x: 10, y: 10 }])
      expect(path).toContain('M 0 0')
      expect(path).toContain('L 10 10')
    })
  })
})

// TEMPORARY — remove after CI negative-test verification (Task 1)
describe('CI negative test (intentional failure)', () => {
  it('must fail so CI turns red', () => {
    expect(true).toBe(false)
  })
})
