import { describe, it, expect } from 'vitest'
import {
  normalizeBounds,
  boundsIntersect,
  getNodeBounds,
  findElementsInMarquee,
} from '@/utils/marqueeSelection'
import type { PetriNet } from '@/types/petri-net'

describe('marqueeSelection', () => {
  it('normalizes bounds from two corners', () => {
    expect(normalizeBounds(10, 20, 30, 5)).toEqual({
      left: 10,
      top: 5,
      right: 30,
      bottom: 20,
    })
  })

  it('detects overlapping bounds', () => {
    const a = { left: 0, top: 0, right: 10, bottom: 10 }
    const b = { left: 5, top: 5, right: 15, bottom: 15 }
    const c = { left: 20, top: 20, right: 30, bottom: 30 }
    expect(boundsIntersect(a, b)).toBe(true)
    expect(boundsIntersect(a, c)).toBe(false)
  })

  it('finds nodes inside marquee', () => {
    const net: PetriNet = {
      id: 'n1',
      name: 'Test',
      places: [{ id: 'p1', name: 'P1', position: { x: 50, y: 50 }, tokens: 0, capacity: 0 }],
      transitions: [{ id: 't1', name: 'T1', position: { x: 200, y: 200 } }],
      operators: [],
      subProcesses: [],
      arcs: [],
    }

    const marquee = { left: 0, top: 0, right: 100, bottom: 100 }
    expect(findElementsInMarquee(net, marquee)).toEqual(['p1'])
  })

  it('computes place node bounds from center', () => {
    const bounds = getNodeBounds('place', { x: 100, y: 100 })
    expect(bounds.left).toBeLessThan(100)
    expect(bounds.right).toBeGreaterThan(100)
  })
})
