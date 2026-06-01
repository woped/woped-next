import { describe, it, expect } from 'vitest'
import type { PetriNet } from '@/types/petri-net'
import {
  analysisMcpTool,
  executeAnalysis,
  parseAnalysisArgs,
} from '@/services/tools/analysisMcpTool'

function createSimpleNet(): PetriNet {
  return {
    id: 'net-1',
    name: 'Simple net',
    places: [
      { id: 'p1', name: 'Start', position: { x: 0, y: 0 }, tokens: 1, capacity: -1 },
      { id: 'p2', name: 'End', position: { x: 200, y: 0 }, tokens: 0, capacity: -1 },
    ],
    transitions: [{ id: 't1', name: 'Do', position: { x: 100, y: 0 } }],
    operators: [],
    subProcesses: [],
    arcs: [
      {
        id: 'a1',
        sourceId: 'p1',
        targetId: 't1',
        weight: 1,
        waypoints: [],
        routingMode: 'direct',
      },
      {
        id: 'a2',
        sourceId: 't1',
        targetId: 'p2',
        weight: 1,
        waypoints: [],
        routingMode: 'direct',
      },
    ],
  }
}

describe('analysisMcpTool', () => {
  it('exposes a valid MCP tool definition', () => {
    expect(analysisMcpTool.name).toBe('analyze_model')
    expect(analysisMcpTool.inputSchema.type).toBe('object')
  })

  it('parses empty arguments', () => {
    expect(parseAnalysisArgs({})).toEqual({})
  })

  it('parses explicit checks', () => {
    const parsed = parseAnalysisArgs({ checks: ['workflow'] })
    expect(parsed.checks).toEqual(['workflow'])
  })

  it('rejects unknown checks', () => {
    expect(() => parseAnalysisArgs({ checks: ['nonsense'] })).toThrow()
  })

  it('returns an error when no net is loaded', () => {
    const result = executeAnalysis({}, { getNet: () => null })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('No Petri net')
  })

  it('runs all analyses by default', () => {
    const net = createSimpleNet()
    const result = executeAnalysis({}, { getNet: () => net })

    expect(result.isError).toBeFalsy()
    const payload = JSON.parse(result.content[0].text)
    expect(payload.workflow).toBeDefined()
    expect(payload.soundness).toBeDefined()
  })

  it('runs only the requested analysis when checks is specified', () => {
    const net = createSimpleNet()
    const result = executeAnalysis(
      { checks: ['workflow'] },
      { getNet: () => net }
    )

    expect(result.isError).toBeFalsy()
    const payload = JSON.parse(result.content[0].text)
    expect(payload.workflow).toBeDefined()
    expect(payload.soundness).toBeUndefined()
  })
})
