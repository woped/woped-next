import type { LLMConfig, LLMProvider, ToolCall } from '@/types/chat'
import { chatLogger } from './chatLogger'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: ToolCallRaw[]
  tool_call_id?: string
  tool_name?: string
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
    const controller = new AbortController()
    this.abortController = controller
    chatLogger.apiRequest(
      `${this.config.provider}:${this.config.model}`,
      messages.length,
      !!(tools && tools.length > 0),
    )

    if (this.config.provider === 'gemini') {
      return this.chatCompletionGemini(messages, controller, tools)
    }
    return this.chatCompletionOpenAI(messages, controller, tools)
  }

  private async chatCompletionOpenAI(
    messages: ChatMessage[],
    controller: AbortController,
    tools?: ToolDefinition[],
  ): Promise<ChatCompletionResponse> {
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
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

  private async chatCompletionGemini(
    messages: ChatMessage[],
    controller: AbortController,
    tools?: ToolDefinition[],
  ): Promise<ChatCompletionResponse> {
    const systemMessages = messages
      .filter((m) => m.role === 'system' && m.content)
      .map((m) => m.content as string)
    const systemInstruction = systemMessages.join('\n\n').trim()

    const conversationMessages = messages.filter((m) => m.role !== 'system')
    const geminiContents = conversationMessages
      .map((message) => this.toGeminiMessage(message))
      .filter((m): m is { role: 'user' | 'model'; parts: unknown[] } => !!m)

    const body: Record<string, unknown> = {
      contents: geminiContents,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
      },
    }

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      }
    }

    if (tools && tools.length > 0) {
      body.tools = [
        {
          functionDeclarations: tools.map((tool) => ({
            name: tool.function.name,
            description: tool.function.description,
            parameters: tool.function.parameters,
          })),
        },
      ]
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${encodeURIComponent(this.config.apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      },
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      const message =
        error?.error?.message || `Gemini API Error: ${response.status} ${response.statusText}`
      chatLogger.error('API request failed', new Error(message))
      throw new Error(message)
    }

    const data = await response.json()
    const candidate = data?.candidates?.[0]
    if (!candidate?.content?.parts) {
      throw new Error('No response from Gemini API')
    }

    const parts = candidate.content.parts as Array<{
      text?: string
      functionCall?: { name: string; args?: Record<string, unknown> }
    }>
    const toolCalls: ToolCallRaw[] = []
    const textParts: string[] = []

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (part.text) {
        textParts.push(part.text)
      }
      if (part.functionCall?.name) {
        toolCalls.push({
          id: `gemini-call-${Date.now()}-${i}`,
          type: 'function',
          function: {
            name: part.functionCall.name,
            arguments: JSON.stringify(part.functionCall.args || {}),
          },
        })
      }
    }

    const content = textParts.join('\n').trim() || null
    const hasToolCalls = toolCalls.length > 0
    chatLogger.apiResponse(candidate.finishReason || 'stop', hasToolCalls)

    return {
      message: {
        role: 'assistant',
        content,
        tool_calls: hasToolCalls ? toolCalls : undefined,
      },
      finishReason: candidate.finishReason || 'stop',
    }
  }

  private toGeminiMessage(
    message: ChatMessage,
  ): { role: 'user' | 'model'; parts: unknown[] } | null {
    if (message.role === 'user') {
      return { role: 'user', parts: [{ text: message.content || '' }] }
    }

    if (message.role === 'assistant') {
      const parts: unknown[] = []
      if (message.content) {
        parts.push({ text: message.content })
      }
      if (message.tool_calls) {
        for (const toolCall of message.tool_calls) {
          let args: Record<string, unknown> = {}
          try {
            args = JSON.parse(toolCall.function.arguments)
          } catch {
            args = {}
          }
          parts.push({
            functionCall: {
              name: toolCall.function.name,
              args,
            },
          })
        }
      }
      return parts.length > 0 ? { role: 'model', parts } : null
    }

    if (message.role === 'tool') {
      const toolName = message.tool_name || 'tool_result'
      return {
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: toolName,
              response: {
                content: message.content || '',
              },
            },
          },
        ],
      }
    }

    return null
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

  static async validateApiKey(apiKey: string, provider: LLMProvider): Promise<boolean> {
    try {
      const response = provider === 'gemini'
        ? await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
          )
        : await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
          })
      return response.ok
    } catch {
      return false
    }
  }
}
