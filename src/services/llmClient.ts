import type { LLMConfig, LLMProvider, ToolCall } from '@/types/chat'
import type { BrowserMcpServer } from '@/types/mcp'
import { chatLogger } from './chatLogger'
import { mcpToOpenAiTools } from './mcp/mcpToOpenAiTools'
import { mcpToolResultToChatResult, type ChatToolResult } from './mcp/mcpToolResult'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: ToolCallRaw[]
  tool_call_id?: string
}

interface ToolCallRaw {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export interface ChatCompletionResponse {
  message: {
    role: 'assistant'
    content: string | null
    tool_calls?: ToolCallRaw[]
  }
  finishReason: string
}

// Both providers use the OpenAI-compatible REST format — only the endpoint differs.
const PROVIDER_ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
}

export class LLMClient {
  private config: LLMConfig
  private mcpServer?: BrowserMcpServer
  private abortController: AbortController | null = null

  constructor(config: LLMConfig, mcpServer?: BrowserMcpServer) {
    this.config = config
    this.mcpServer = mcpServer
  }

  abort() {
    this.abortController?.abort()
  }

  async chatCompletion(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
  ): Promise<ChatCompletionResponse> {
    if (this.config.provider === 'mock') {
      return this.mockCompletion(messages)
    }

    this.abortController = new AbortController()

    const url = PROVIDER_ENDPOINTS[this.config.provider]
    const body: Record<string, unknown> = {
      model: this.config.model,
      messages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
    }

    if (tools && tools.length > 0) {
      body.tools = tools
      body.tool_choice = 'auto'
    }

    chatLogger.apiRequest(this.config.model, messages.length, !!(tools && tools.length > 0))

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: this.abortController.signal,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      const message =
        error?.error?.message || `API Error: ${response.status} ${response.statusText}`
      chatLogger.error('API request failed', new Error(message))
      throw new Error(message)
    }

    const data = await response.json()
    const choice = data.choices?.[0]

    if (!choice) {
      throw new Error('No response from API')
    }

    const hasToolCalls = !!(choice.message.tool_calls && choice.message.tool_calls.length > 0)
    chatLogger.apiResponse(choice.finish_reason, hasToolCalls)

    return {
      message: choice.message,
      finishReason: choice.finish_reason,
    }
  }

  private mockCompletion(messages: ChatMessage[]): ChatCompletionResponse {
    const last = [...messages].reverse().find((m) => m.role === 'user')
    return {
      message: {
        role: 'assistant',
        content: `[Demo] Your message: "${last?.content ?? ''}". This is a mock response — no API key required.`,
      },
      finishReason: 'stop',
    }
  }

  get hasToolCalls() {
    return (response: ChatCompletionResponse): boolean => {
      return !!(response.message.tool_calls && response.message.tool_calls.length > 0)
    }
  }

  parseToolCalls(toolCalls?: ToolCallRaw[]): ToolCall[] {
    if (!toolCalls || toolCalls.length === 0) return []

    return toolCalls.map((tc) => {
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(tc.function.arguments)
      } catch {
        args = {}
      }
      return {
        id: tc.id,
        name: tc.function.name,
        arguments: args,
      }
    })
  }

  getToolsForCompletion(): ToolDefinition[] {
    if (!this.mcpServer) return []
    return mcpToOpenAiTools(this.mcpServer.listTools())
  }

  async executeMcpToolCall(toolCall: ToolCall): Promise<ChatToolResult> {
    if (!this.mcpServer) {
      throw new Error('No MCP server configured')
    }

    const mcpResult = await this.mcpServer.callTool({
      name: toolCall.name,
      arguments: toolCall.arguments,
    })

    return mcpToolResultToChatResult(toolCall, mcpResult)
  }

  static async validateApiKey(apiKey: string, provider: LLMProvider = 'openai'): Promise<boolean> {
    if (provider === 'mock') return true
    if (provider === 'gemini') {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/openai/models`,
          { headers: { Authorization: `Bearer ${apiKey}` } },
        )
        return response.ok
      } catch {
        return false
      }
    }
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      return response.ok
    } catch {
      return false
    }
  }
}
