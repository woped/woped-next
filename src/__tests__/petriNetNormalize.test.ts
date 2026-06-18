import { describe, it, expect } from 'vitest'
import { normalizePetriNet, extractPnmlContent } from '@/utils/petriNetNormalize'
import { resolveElementId, resolveArcEndpoints } from '@/utils/chatElementResolve'
import type { PetriNet } from '@/types/petri-net'
import { OperatorType } from '@/types/petri-net'

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

  it('extracts PNML from multiline fenced blocks', () => {
    const raw = `Here is the net:
\`\`\`xml
<pnml>
  <net id="n1"/>
</pnml>
\`\`\`
Done.`
    expect(extractPnmlContent(raw)).toBe(`<pnml>
  <net id="n1"/>
</pnml>`)
  })

  it('extracts PNML surrounded by plain text without fences', () => {
    const raw = 'The model is <pnml><net id="n2"/></pnml> as requested.'
    expect(extractPnmlContent(raw)).toBe('<pnml><net id="n2"/></pnml>')
  })

  it('unwraps JSON wrapper with pnml field', () => {
    const raw = JSON.stringify({ pnml: '<pnml><net id="n3"/></pnml>' })
    expect(extractPnmlContent(raw)).toBe('<pnml><net id="n3"/></pnml>')
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

  it('resolves source/target shorthand params', () => {
    const { sourceId, targetId } = resolveArcEndpoints(net, {
      source: 'Start',
      target: 'Check',
    })
    expect(sourceId).toBe('p_start')
    expect(targetId).toBe('t_check')
  })

  it('supports place_id and transition_id arc params', () => {
    const { sourceId, targetId } = resolveArcEndpoints(net, {
      place_id: 'Start',
      transition_id: 'Check',
    })
    expect(sourceId).toBe('p_start')
    expect(targetId).toBe('t_check')
  })

  it('resolves Start correctly when Start neu also exists', () => {
    const netWithBoth: PetriNet = {
      ...net,
      places: [
        { id: 'p_start', name: 'Start', position: { x: 0, y: 0 }, tokens: 1, capacity: -1 },
        { id: 'p_new', name: 'Start neu', position: { x: -100, y: 0 }, tokens: 0, capacity: -1 },
      ],
    }
    const context = {
      knownElementIds: new Set(['p_start']),
      createdInBatch: new Set(['p_new']),
    }

    expect(resolveElementId(netWithBoth, 'Start', context)).toBe('p_start')
    expect(resolveElementId(netWithBoth, 'Start neu', context)).toBe('p_new')
  })

  it('resolves split operator keywords like splt', () => {
    const netWithSplit: PetriNet = {
      ...net,
      transitions: [],
      operators: [
        {
          id: 'op_split',
          name: 'Prepare',
          operatorType: OperatorType.AND_SPLIT,
          position: { x: 200, y: 0 },
        },
      ],
    }

    expect(resolveElementId(netWithSplit, 'splt')).toBe('op_split')
    expect(resolveElementId(netWithSplit, 'split')).toBe('op_split')
  })
})
