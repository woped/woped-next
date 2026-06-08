import type { LLMConfig, LLMModelOption, LLMProvider, ToolCall } from '@/types/chat'
import type { BrowserMcpServer } from '@/types/mcp'
import { sanitizeSchemaForGemini } from '@/utils/geminiSchema'
import { chatLogger } from './chatLogger'
import { mcpToOpenAiTools } from './mcp/mcpToOpenAiTools'
import { mcpToolResultToChatResult, type ChatToolResult } from './mcp/mcpToolResult'

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

const API_REQUEST_TIMEOUT_MS = 120_000

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

  private formatOpenAiMessages(messages: ChatMessage[]): Record<string, unknown>[] {
    return messages.map((message) => {
      const formatted: Record<string, unknown> = { role: message.role }

      if (message.role === 'tool') {
        formatted.content = message.content ?? ''
        if (message.tool_call_id) {
          formatted.tool_call_id = message.tool_call_id
        }
        return formatted
      }

      if (message.role === 'assistant' && message.tool_calls?.length) {
        formatted.content = message.content ?? null
        formatted.tool_calls = message.tool_calls
        return formatted
      }

      formatted.content = message.content ?? ''
      return formatted
    })
  }

  private buildOpenAiRequestBody(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: this.config.model,
      messages: this.formatOpenAiMessages(messages),
    }

    if (this.isOpenAiReasoningModel()) {
      body.max_completion_tokens = this.config.maxTokens
      body.temperature = 1
    } else {
      body.max_tokens = this.config.maxTokens
      body.temperature = this.config.temperature
    }

    if (tools && tools.length > 0) {
      body.tools = tools
      body.tool_choice = 'auto'
    }

    return body
  }

  private isOpenAiReasoningModel(): boolean {
    return /^(o\d|gpt-5)/i.test(this.config.model)
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
    controller: AbortController,
  ): Promise<Response> {
    const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS)

    try {
      return await fetch(url, { ...init, signal: controller.signal })
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error('The request timed out. Please try again or choose a faster model.')
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private async chatCompletionOpenAI(
    messages: ChatMessage[],
    controller: AbortController,
    tools?: ToolDefinition[],
  ): Promise<ChatCompletionResponse> {
    const body = this.buildOpenAiRequestBody(messages, tools)

    const response = await this.fetchWithTimeout(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
      },
      controller,
    )

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
            parameters: sanitizeSchemaForGemini(tool.function.parameters),
          })),
        },
      ]
    }

    const response = await this.fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${encodeURIComponent(this.config.apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      controller,
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

  static async validateApiKey(apiKey: string, provider: LLMProvider): Promise<boolean> {
    if (!apiKey.trim()) return false

    try {
      if (provider === 'gemini') {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=1`,
        )
        return response.ok
      }

      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      return response.ok
    } catch {
      return false
    }
  }

  static async listModels(apiKey: string, provider: LLMProvider): Promise<LLMModelOption[]> {
    if (!apiKey.trim()) return []

    if (provider === 'gemini') {
      return LLMClient.listGeminiModels(apiKey)
    }

    return LLMClient.listOpenAIModels(apiKey)
  }

  private static isOpenAiChatModel(id: string): boolean {
    const excluded =
      /(embed|tts|whisper|dall-e|davinci|babbage|moderation|realtime|audio|transcribe|search|instruct)/i
    const chatPrefix = /^(gpt-|o\d|chatgpt-)/i
    if (!chatPrefix.test(id) || excluded.test(id)) return false
    // Skip dated snapshots (e.g. gpt-4-0613, gpt-4o-2024-08-06)
    if (/-\d{4}(-\d{2}(-\d{2})?)?$/.test(id)) return false
    return true
  }

  private static isGeminiChatModel(id: string): boolean {
    if (!/^gemini-/i.test(id)) return false
    if (/embed|aqa|imagen|veo|gemma|learnlm|nano|tts|robotics|computer-use/i.test(id)) {
      return false
    }
    if (/-exp$|-experimental|-preview$/i.test(id)) return false
    return true
  }

  private static async listOpenAIModels(apiKey: string): Promise<LLMModelOption[]> {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!response.ok) {
      throw new Error(`OpenAI models API error: ${response.status}`)
    }

    const data = await response.json() as { data?: Array<{ id: string }> }

    return (data.data || [])
      .map((model) => model.id)
      .filter((id) => LLMClient.isOpenAiChatModel(id))
      .sort((a, b) => a.localeCompare(b))
      .map((id) => ({ id, name: id }))
  }

  private static async listGeminiModels(apiKey: string): Promise<LLMModelOption[]> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
    )

    if (!response.ok) {
      throw new Error(`Gemini models API error: ${response.status}`)
    }

    const data = await response.json() as {
      models?: Array<{
        name: string
        displayName?: string
        supportedGenerationMethods?: string[]
      }>
    }

    return (data.models || [])
      .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
      .map((model) => {
        const id = model.name.replace(/^models\//, '')
        return {
          id,
          name: model.displayName?.trim() || id,
        }
      })
      .filter((model) => LLMClient.isGeminiChatModel(model.id))
      .sort((a, b) => a.name.localeCompare(b.name))
  }
}
