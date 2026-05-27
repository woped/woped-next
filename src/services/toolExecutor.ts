import type { ToolCall, ToolResult, ModelCommand, LLMConfig } from '@/types/chat'
import { chatLogger } from './chatLogger'
import { t2pTool } from './tools/t2pTool'
import { p2tTool } from './tools/p2tTool'
import { analysisTool } from './tools/analysisTool'
import { modelInfoTool } from './tools/modelInfoTool'
import { modifyTool } from './tools/modifyTool'
import { helpTool } from './tools/helpTool'
import { modelSerializer } from './modelSerializer'

export const toolDefinitions = [
  t2pTool.definition,
  p2tTool.definition,
  analysisTool.definition,
  modelInfoTool.definition,
  modifyTool.definition,
  helpTool.definition,
]

export async function executeToolCall(
  toolCall: ToolCall,
  llmConfig?: LLMConfig,
): Promise<{ result: ToolResult; commands: ModelCommand[] }> {
  let content: string
  const commands: ModelCommand[] = []

  try {
    switch (toolCall.name) {
      case 't2p_convert': {
        content = await t2pTool.execute(
          toolCall.arguments as { text: string; language?: string },
          llmConfig,
        )
        try {
          const parsed = JSON.parse(content)
          if (parsed.pnml) {
            commands.push({ type: 'import_net', params: { pnml: parsed.pnml } })
          }
        } catch { /* response wasn't JSON, pass through */ }
        break
      }
      case 'p2t_describe': {
        const args = { ...toolCall.arguments } as { pnml?: string }
        if (!args.pnml) {
          args.pnml = modelSerializer.getModelPnml()
        }
        content = await p2tTool.execute(args as { pnml: string }, llmConfig)
        break
      }
      case 'analyze_model': {
        content = analysisTool.execute(toolCall.arguments as { checks?: string[] })
        break
      }
      case 'get_model_info': {
        content = modelInfoTool.execute()
        break
      }
      case 'modify_model': {
        const args = toolCall.arguments as { action: string; params: Record<string, unknown> }
        content = modifyTool.execute(args)
        try {
          const parsed = JSON.parse(content)
          if (parsed.command) {
            commands.push(parsed.command)
          }
        } catch { /* pass */ }
        break
      }
      case 'help_modeling': {
        content = helpTool.execute(toolCall.arguments as { topic: string })
        break
      }
      default:
        content = JSON.stringify({ error: `Unknown tool: ${toolCall.name}` })
    }
  } catch (error) {
    chatLogger.error(`Tool "${toolCall.name}" execution`, error)
    content = JSON.stringify({
      error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }

  return {
    result: { toolCallId: toolCall.id, content },
    commands,
  }
}
