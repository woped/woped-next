import { describe, expect, it } from 'vitest'
import { mcpToOpenAiTools } from '@/services/mcp/mcpToOpenAiTools'
import type { McpTool } from '@/types/mcp'

describe('mcpToOpenAiTools', () => {
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
})
