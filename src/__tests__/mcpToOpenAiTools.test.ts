import { describe, expect, it } from 'vitest'
import { mcpToOpenAiTools } from '@/services/mcp/mcpToOpenAiTools'
import type { McpTool } from '@/types/mcp'

describe('mcpToOpenAiTools', () => {
  it('maps an empty tool list to an empty OpenAI tool list', () => {
    expect(mcpToOpenAiTools([])).toEqual([])
  })

  it('maps MCP tools to OpenAI function tool definitions', () => {
    const tools: McpTool[] = [
      {
        name: 'help_modeling',
        description: 'Provide modeling help',
        inputSchema: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
          },
          required: ['topic'],
          additionalProperties: false,
        },
      },
    ]

    expect(mcpToOpenAiTools(tools)).toEqual([
      {
        type: 'function',
        function: {
          name: 'help_modeling',
          description: 'Provide modeling help',
          parameters: tools[0].inputSchema,
        },
      },
    ])
  })

  it('maps multiple MCP tools to OpenAI function tool definitions', () => {
    const tools: McpTool[] = [
      {
        name: 'help_modeling',
        description: 'Provide modeling help',
        inputSchema: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
          },
        },
      },
      {
        name: 'get_model_info',
        description: 'Get model information',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ]

    const mapped = mcpToOpenAiTools(tools)

    expect(mapped).toHaveLength(2)
    expect(mapped.map((tool) => tool.function.name)).toEqual([
      'help_modeling',
      'get_model_info',
    ])
    expect(mapped.map((tool) => tool.function.description)).toEqual([
      'Provide modeling help',
      'Get model information',
    ])
  })

  it('preserves required fields in input schemas', () => {
    const tools: McpTool[] = [
      {
        name: 'help_modeling',
        description: 'Provide modeling help',
        inputSchema: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
          },
          required: ['topic'],
        },
      },
    ]

    const mapped = mcpToOpenAiTools(tools)

    expect(mapped[0].function.parameters.required).toEqual(['topic'])
  })

  it('preserves additionalProperties in input schemas', () => {
    const tools: McpTool[] = [
      {
        name: 'help_modeling',
        description: 'Provide modeling help',
        inputSchema: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    ]

    const mapped = mcpToOpenAiTools(tools)

    expect(mapped[0].function.parameters.additionalProperties).toBe(false)
  })

  it('preserves complex properties unchanged', () => {
    const properties = {
      topic: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      options: {
        type: 'object',
        properties: {
          includeExamples: { type: 'boolean' },
        },
      },
      mode: { type: 'string', enum: ['short', 'detailed'] },
    }
    const tools: McpTool[] = [
      {
        name: 'help_modeling',
        description: 'Provide modeling help',
        inputSchema: {
          type: 'object',
          properties,
        },
      },
    ]

    const mapped = mcpToOpenAiTools(tools)

    expect(mapped[0].function.parameters.properties).toEqual(properties)
  })
})
