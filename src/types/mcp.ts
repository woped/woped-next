/**
 * MCP-oriented types for in-browser tool registration and execution.
 * Subset aligned with Model Context Protocol tool concepts (list + call).
 */

/** JSON Schema subset for tool input (MCP tools/list). */
export interface McpJsonSchema {
  type: 'object'
  properties?: Record<string, unknown>
  required?: string[]
  additionalProperties?: boolean
}

export interface McpTool {
  name: string
  description: string
  inputSchema: McpJsonSchema
}

export interface McpToolCall {
  name: string
  arguments?: Record<string, unknown>
}

export interface McpTextContent {
  type: 'text'
  text: string
}

export interface McpToolResult {
  content: McpTextContent[]
  isError?: boolean
}

export type McpToolHandler = (
  args: Record<string, unknown>
) => McpToolResult | Promise<McpToolResult>

export interface McpToolRegistration {
  tool: McpTool
  /** Validates and parses raw arguments; throws on invalid input. */
  parseArguments: (raw: unknown) => Record<string, unknown>
  handler: McpToolHandler
}

export interface BrowserMcpServer {
  registerTool(registration: McpToolRegistration): void
  listTools(): McpTool[]
  callTool(call: McpToolCall): Promise<McpToolResult>
}
