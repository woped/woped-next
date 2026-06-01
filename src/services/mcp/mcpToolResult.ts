import type { ModelCommand, ToolCall, ToolResult } from '@/types/chat'
import type { McpToolResult } from '@/types/mcp'

export interface ChatToolResult {
  result: ToolResult
  commands: ModelCommand[]
}

export function mcpToolResultToText(result: McpToolResult): string {
  const text = result.content
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n')

  if (text) return text
  return result.isError ? 'MCP tool execution failed.' : ''
}

export function mcpToolResultToChatResult(
  toolCall: ToolCall,
  mcpResult: McpToolResult,
): ChatToolResult {
  const content = mcpToolResultToText(mcpResult)
  const commands = extractModelCommands(content)

  return {
    result: {
      toolCallId: toolCall.id,
      content,
    },
    commands,
  }
}

function extractModelCommands(content: string): ModelCommand[] {
  const commands: ModelCommand[] = []

  try {
    const parsed = JSON.parse(content)
    if (parsed.pnml) {
      commands.push({ type: 'import_net', params: { pnml: parsed.pnml } })
    }
    if (parsed.command) {
      commands.push(parsed.command)
    }
  } catch {
    // Non-JSON tool output is still valid chat content.
  }

  return commands
}
