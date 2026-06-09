import type { McpToolResult } from '@/types/mcp'

/** Maps JSON tool output from runT2P/runP2T to an MCP tool result. */
export function jsonStringToMcpResult(json: string): McpToolResult {
  try {
    const parsed = JSON.parse(json) as { error?: string }
    if (parsed.error) {
      return {
        content: [{ type: 'text', text: json }],
        isError: true,
      }
    }
  } catch {
    // Non-JSON content is returned as successful text.
  }

  return {
    content: [{ type: 'text', text: json }],
  }
}
