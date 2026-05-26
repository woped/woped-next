import { describe, it, expect } from 'vitest'
import { createLocalMcpServer } from '@/services/mcp/localMcpServer'
import { registerNlpTools } from '@/services/mcp/registerNlpTools'
import type { PetriNet } from '@/types/petri-net'

function createMockNet(): PetriNet {
  return {
    id: 'net-1',
    name: 'Order process',
    places: [{ id: 'p1', name: 'Start', position: { x: 0, y: 0 }, tokens: 1, capacity: -1 }],
    transitions: [
      { id: 't1', name: 'Ship', position: { x: 100, y: 0 } },
    ],
    operators: [],
    subProcesses: [],
    arcs: [
      {
        id: 'a1',
        sourceId: 'p1',
        targetId: 't1',
        weight: 1,
        routingMode: 'direct',
      },
    ],
  }
}

describe('LocalMcpServer', () => {
  it('lists registered NLP tools', () => {
    const server = createLocalMcpServer()
    registerNlpTools(server)

    const names = server.listTools().map((t) => t.name)
    expect(names).toContain('help_modeling')
    expect(names).toContain('get_model_info')
    expect(names).toHaveLength(2)
  })

  it('rejects duplicate tool registration', () => {
    const server = createLocalMcpServer()
    registerNlpTools(server)

    expect(() => registerNlpTools(server)).toThrow(/already registered/)
  })

  it('executes help_modeling', async () => {
    const server = createLocalMcpServer()
    registerNlpTools(server)

    const result = await server.callTool({
      name: 'help_modeling',
      arguments: { topic: 'parallelism' },
    })

    expect(result.isError).toBeFalsy()
    expect(result.content[0].text.toLowerCase()).toContain('and-split')
  })

  it('returns error for invalid help_modeling arguments', async () => {
    const server = createLocalMcpServer()
    registerNlpTools(server)

    const result = await server.callTool({
      name: 'help_modeling',
      arguments: { topic: '' },
    })

    expect(result.isError).toBe(true)
  })

  it('executes get_model_info with injected context', async () => {
    const server = createLocalMcpServer()
    const net = createMockNet()
    registerNlpTools(server, { getNet: () => net })

    const result = await server.callTool({
      name: 'get_model_info',
      arguments: {},
    })

    expect(result.isError).toBeFalsy()
    const summary = JSON.parse(result.content[0].text)
    expect(summary.netName).toBe('Order process')
    expect(summary.placesCount).toBe(1)
    expect(summary.transitionsCount).toBe(1)
    expect(summary.arcsCount).toBe(1)
  })

  it('returns error when no model is loaded', async () => {
    const server = createLocalMcpServer()
    registerNlpTools(server)

    const result = await server.callTool({
      name: 'get_model_info',
      arguments: {},
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('No Petri net')
  })

  it('returns error for unknown tool', async () => {
    const server = createLocalMcpServer()
    registerNlpTools(server)

    const result = await server.callTool({
      name: 'unknown_tool',
      arguments: {},
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('Unknown MCP tool')
  })
})
