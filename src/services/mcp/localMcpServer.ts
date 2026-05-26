import type {
  BrowserMcpServer,
  McpTool,
  McpToolCall,
  McpToolRegistration,
  McpToolResult,
} from '@/types/mcp'

function errorResult(message: string): McpToolResult {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  }
}

export class LocalMcpServer implements BrowserMcpServer {
  private readonly tools = new Map<string, McpToolRegistration>()

  registerTool(registration: McpToolRegistration): void {
    const { name } = registration.tool
    if (this.tools.has(name)) {
      throw new Error(`MCP tool "${name}" is already registered`)
    }
    this.tools.set(name, registration)
  }

  listTools(): McpTool[] {
    return Array.from(this.tools.values()).map((entry) => entry.tool)
  }

  async callTool(call: McpToolCall): Promise<McpToolResult> {
    const registration = this.tools.get(call.name)
    if (!registration) {
      return errorResult(`Unknown MCP tool: ${call.name}`)
    }

    let args: Record<string, unknown>
    try {
      args = registration.parseArguments(call.arguments ?? {})
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Invalid tool arguments'
      return errorResult(message)
    }

    try {
      return await registration.handler(args)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Tool execution failed'
      return errorResult(message)
    }
  }
}

export function createLocalMcpServer(): LocalMcpServer {
  return new LocalMcpServer()
}
