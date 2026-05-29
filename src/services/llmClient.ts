import type { LLMConfig, ToolCall } from '@/types/chat'
import { chatLogger } from './chatLogger'

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

export class LLMClient {
  private config: LLMConfig
  private abortController: AbortController | null = null

  constructor(config: LLMConfig) {
    this.config = config
  }

  abort() {
    this.abortController?.abort()
  }

  async chatCompletion(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
  ): Promise<ChatCompletionResponse> {
    this.abortController = new AbortController()

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
      const message = error?.error?.message || `OpenAI API Error: ${response.status} ${response.statusText}`
      chatLogger.error('API request failed', new Error(message))
      throw new Error(message)
    }

    const data = await response.json()
    const choice = data.choices?.[0]

    if (!choice) {
      throw new Error('No response from OpenAI API')
    }

    const hasToolCalls = !!(choice.message.tool_calls && choice.message.tool_calls.length > 0)
    chatLogger.apiResponse(choice.finish_reason, hasToolCalls)

    return {
      message: choice.message,
      finishReason: choice.finish_reason,
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

  static async validateApiKey(apiKey: string): Promise<boolean> {
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
