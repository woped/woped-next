import { describe, it, expect } from 'vitest'
import { normalizePetriNet, extractPnmlContent } from '@/utils/petriNetNormalize'
import { resolveElementId, resolveArcEndpoints } from '@/utils/chatElementResolve'
import type { PetriNet } from '@/types/petri-net'

describe('normalizePetriNet', () => {
  it('fills missing arrays and drops arcs with unknown endpoints', () => {
    const net = {
      id: 'n1',
      name: 'Test',
      places: [{ id: 'p1', name: 'Start', position: { x: 0, y: 0 }, tokens: 0, capacity: -1 }],
      transitions: [
        { id: 't1', name: 'Work', position: { x: 100, y: 0 } },
      ],
    } as PetriNet

    const { net: normalized, droppedArcs } = normalizePetriNet({
      ...net,
      arcs: [
        { id: 'a1', sourceId: 'p1', targetId: 't1', weight: 1, waypoints: [] },
        { id: 'a2', sourceId: 'p1', targetId: 'missing', weight: 1, waypoints: [] },
      ],
    } as PetriNet)

    expect(normalized.operators).toEqual([])
    expect(normalized.subProcesses).toEqual([])
    expect(normalized.arcs).toHaveLength(1)
    expect(droppedArcs).toBe(1)
  })
})

describe('extractPnmlContent', () => {
  it('strips markdown and JSON wrappers', () => {
    const raw = '```xml\n<pnml><net id="n"/></pnml>\n```'
    expect(extractPnmlContent(raw)).toContain('<pnml>')
  })
})

describe('resolveElementId', () => {
  const net: PetriNet = {
    id: 'n1',
    name: 'Test',
    places: [{ id: 'p_start', name: 'Start', position: { x: 0, y: 0 }, tokens: 1, capacity: -1 }],
    transitions: [{ id: 't_check', name: 'Check', position: { x: 100, y: 0 } }],
    operators: [],
    subProcesses: [],
    arcs: [],
  }

  it('resolves by id and by name', () => {
    expect(resolveElementId(net, 'p_start')).toBe('p_start')
    expect(resolveElementId(net, 'Check')).toBe('t_check')
  })

  it('resolves arc endpoint params with alternate keys', () => {
    const { sourceId, targetId } = resolveArcEndpoints(net, {
      source_name: 'Start',
      target_name: 'Check',
    })
    expect(sourceId).toBe('p_start')
    expect(targetId).toBe('t_check')
  })
})
