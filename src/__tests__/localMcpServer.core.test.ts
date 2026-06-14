import { describe, expect, it, vi } from 'vitest'
import { createLocalMcpServer } from '@/services/mcp/localMcpServer'
import type { McpTool, McpToolRegistration } from '@/types/mcp'

const echoTool: McpTool = {
  name: 'echo',
  description: 'Echo test tool',
  inputSchema: {
    type: 'object',
    properties: {
      message: { type: 'string' },
    },
  },
}

function createEchoRegistration(
  overrides: Partial<McpToolRegistration> = {},
): McpToolRegistration {
  return {
    tool: echoTool,
    parseArguments: vi.fn((raw) => raw as Record<string, unknown>),
    handler: vi.fn((args) => ({
      content: [{ type: 'text' as const, text: String(args.message ?? '') }],
    })),
    ...overrides,
  }
}

describe('LocalMcpServer core behavior', () => {
  it('starts with an empty tool list', () => {
    const server = createLocalMcpServer()

    expect(server.listTools()).toEqual([])
  })

  it('lists a registered dummy tool', () => {
    const server = createLocalMcpServer()
    const registration = createEchoRegistration()

    server.registerTool(registration)

    expect(server.listTools()).toEqual([echoTool])
  })

  it('executes a dummy tool through callTool', async () => {
    const server = createLocalMcpServer()
    server.registerTool(createEchoRegistration())

    const result = await server.callTool({
      name: 'echo',
      arguments: { message: 'hello' },
    })

    expect(result.isError).toBeFalsy()
    expect(result.content[0].text).toContain('hello')
  })

  it('passes empty arguments when arguments are omitted', async () => {
    const server = createLocalMcpServer()
    const parseArguments = vi.fn((raw) => raw as Record<string, unknown>)
    const handler = vi.fn((args) => ({
      content: [{ type: 'text' as const, text: JSON.stringify(args) }],
    }))

    server.registerTool(createEchoRegistration({ parseArguments, handler }))

    await server.callTool({ name: 'echo' })

    expect(parseArguments).toHaveBeenCalledWith({})
    expect(handler).toHaveBeenCalledWith({})
  })

  it('returns parser errors as MCP error results', async () => {
    const server = createLocalMcpServer()
    server.registerTool(
      createEchoRegistration({
        parseArguments: vi.fn(() => {
          throw new Error('Bad test args')
        }),
      }),
    )

    const result = await server.callTool({
      name: 'echo',
      arguments: { message: 'hello' },
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('Bad test args')
  })

  it('returns handler errors as MCP error results', async () => {
    const server = createLocalMcpServer()
    server.registerTool(
      createEchoRegistration({
        handler: vi.fn(() => {
          throw new Error('Handler exploded')
        }),
      }),
    )

    const result = await server.callTool({
      name: 'echo',
      arguments: { message: 'hello' },
    })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('Handler exploded')
  })

  it('supports async handlers', async () => {
    const server = createLocalMcpServer()
    server.registerTool(
      createEchoRegistration({
        handler: vi.fn(async () => ({
          content: [{ type: 'text' as const, text: 'async hello' }],
        })),
      }),
    )

    const result = await server.callTool({
      name: 'echo',
      arguments: { message: 'hello' },
    })

    expect(result.isError).toBeFalsy()
    expect(result.content[0].text).toContain('async hello')
  })
})
