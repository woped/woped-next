import { LLMClient } from './llmClient'
import type { ChatMessage, ToolDefinition } from './llmClient'
import { toolDefinitions, executeToolCall } from './toolExecutor'
import { modelSerializer } from './modelSerializer'
import { chatLogger } from './chatLogger'
import type { LLMConfig, OrchestratorResponse, ModelCommand } from '@/types/chat'

const SYSTEM_PROMPT = `You are a helpful Petri net modeling assistant in WoPeD (Workflow Petri Net Designer). You help users with:
- Creating Petri nets from natural language descriptions (use t2p_convert)
- Describing existing models in natural language (use p2t_describe)
- Analyzing models for correctness (use analyze_model)
- Providing model information (use get_model_info)
- Modifying models via commands (use modify_model)
- Explaining Petri net concepts (use help_modeling)

Guidelines:
- Be concise and helpful
- When the user asks to create a net, use t2p_convert with their description
- When asked to describe the model, use p2t_describe with the provided PNML
- When asked about model properties (soundness, deadlocks, etc.), use analyze_model
- When asked to modify the model, use modify_model with the appropriate action
- For modify_model arcs, use element IDs from get_model_info (source_id, target_id), not display names
- When adding multiple arcs, call modify_model once per arc
- Always explain what you did after performing an action
- Respond in the same language the user writes in`

const MAX_TOOL_ITERATIONS = 5

export class ChatOrchestrator {
  private client: LLMClient
  private config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
    this.client = new LLMClient(config)
  }

  abort() {
    this.client.abort()
  }

  async sendMessage(
    userMessage: string,
    history: Array<{ role: string; content: string }>,
  ): Promise<OrchestratorResponse> {
    const modelContext = modelSerializer.getModelContext()
    const modelPnml = modelSerializer.getModelPnml()

    const pnmlContext = modelPnml
      ? `\n\nCurrent PNML (for p2t_describe if needed):\n${modelPnml.substring(0, 4000)}`
      : ''

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'system',
        content: `Current model context: ${modelContext}${pnmlContext}`,
      },
    ]

    for (const msg of history.slice(-10)) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })
    }

    messages.push({ role: 'user', content: userMessage })
    chatLogger.message('sent', userMessage)

    const allCommands: ModelCommand[] = []
    let iterations = 0

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++

      const response = await this.client.chatCompletion(
        messages,
        toolDefinitions as ToolDefinition[],
      )

      const hasToolCalls = response.message.tool_calls && response.message.tool_calls.length > 0

      if (hasToolCalls) {
        const toolCalls = this.client.parseToolCalls(response.message.tool_calls)

        messages.push({
          role: 'assistant',
          content: response.message.content,
          tool_calls: response.message.tool_calls,
        })

        for (const toolCall of toolCalls) {
          chatLogger.toolCall(toolCall.name, toolCall.arguments)
          const { result, commands } = await executeToolCall(toolCall, this.config)
          chatLogger.toolResult(toolCall.name, result.content.substring(0, 120))
          allCommands.push(...commands)

          messages.push({
            role: 'tool',
            content: result.content,
            tool_call_id: result.toolCallId,
            tool_name: toolCall.name,
          })
        }

        continue
      }

      const responseText = response.message.content || 'I could not generate a response.'
      chatLogger.message('received', responseText)
      if (allCommands.length > 0) {
        chatLogger.warn(`${allCommands.length} model command(s) generated`)
      }

      return {
        message: responseText,
        commands: allCommands,
      }
    }

    chatLogger.warn(`Max iterations (${MAX_TOOL_ITERATIONS}) reached`)
    return {
      message: 'The request required too many processing steps. Please try a simpler request.',
      commands: allCommands,
    }
  }
}
