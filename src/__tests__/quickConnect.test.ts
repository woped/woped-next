import { describe, it, expect } from 'vitest'
import {
  getQuickConnectOptions,
  isValidQuickConnect,
  computeQuickConnectPosition,
} from '@/utils/quickConnect'

describe('quickConnect', () => {
  it('offers transition-side elements after a place', () => {
    const options = getQuickConnectOptions('place')
    expect(options.map((o) => o.target)).toEqual(['transition', 'operator', 'subprocess'])
  })

  it('offers a place after a transition-side element', () => {
    for (const source of ['transition', 'operator', 'subprocess'] as const) {
      expect(getQuickConnectOptions(source).map((o) => o.target)).toEqual(['place'])
    }
  })

  it('validates Petri net arc direction', () => {
    expect(isValidQuickConnect('place', 'transition')).toBe(true)
    expect(isValidQuickConnect('place', 'place')).toBe(false)
    expect(isValidQuickConnect('transition', 'place')).toBe(true)
    expect(isValidQuickConnect('transition', 'transition')).toBe(false)
  })

  it('places successor to the right with vertical stagger', () => {
    const base = { x: 100, y: 200 }
    const first = computeQuickConnectPosition(base, 'place', 'transition', 0)
    const second = computeQuickConnectPosition(base, 'place', 'transition', 1)

    expect(first.x).toBeGreaterThan(base.x)
    expect(first.y).toBe(base.y)
    expect(second.x).toBe(first.x)
    expect(second.y).toBeGreaterThan(first.y)
  })
})
