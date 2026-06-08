import { describe, expect, it } from 'vitest'
import { createLocalMcpServer } from '@/services/mcp/localMcpServer'
import { registerNlpTools } from '@/services/mcp/registerNlpTools'

const expectedToolNames = [
  'help_modeling',
  'get_model_info',
  't2p_convert',
  'p2t_describe',
  'modify_model',
  'analyze_model',
]

describe('registerNlpTools', () => {
  it('registers exactly the expected tools in order', () => {
    const server = createLocalMcpServer()

    registerNlpTools(server)

    expect(server.listTools().map((tool) => tool.name)).toEqual(
      expectedToolNames,
    )
  })

  it('registers expected tool names without unexpected tools', () => {
    const server = createLocalMcpServer()

    registerNlpTools(server)

    const names = server.listTools().map((tool) => tool.name)
    expect(names).toHaveLength(expectedToolNames.length)
    expect(new Set(names)).toEqual(new Set(expectedToolNames))
  })

  it('registers tools with complete MCP metadata', () => {
    const server = createLocalMcpServer()

    registerNlpTools(server)

    for (const tool of server.listTools()) {
      expect(typeof tool.name).toBe('string')
      expect(tool.name.length).toBeGreaterThan(0)
      expect(typeof tool.description).toBe('string')
      expect(tool.description.length).toBeGreaterThan(0)
      expect(tool.inputSchema.type).toBe('object')
    }
  })

  it('throws when NLP tools are registered twice', () => {
    const server = createLocalMcpServer()

    registerNlpTools(server)

    expect(() => registerNlpTools(server)).toThrow(/already registered/)
  })
})
