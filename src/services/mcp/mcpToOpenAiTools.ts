import type { McpTool } from '@/types/mcp'
import type { ToolDefinition } from '@/services/llmClient'

export function mcpToOpenAiTools(tools: McpTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema as unknown as Record<string, unknown>,
    },
  }))
}
