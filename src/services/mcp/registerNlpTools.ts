import type { BrowserMcpServer } from '@/types/mcp'
import type { LLMConfig } from '@/types/chat'
import {
  defaultGetModelInfoContext,
  executeGetModelInfo,
  getModelInfoTool,
  parseGetModelInfoArgs,
  type GetModelInfoContext,
} from '@/services/tools/getModelInfoTool'
import {
  executeHelpModeling,
  helpModelingTool,
  parseHelpModelingArgs,
} from '@/services/tools/helpModelingTool'
import { analysisMcpTool, executeAnalysis, parseAnalysisArgs } from '@/services/tools/analysisMcpTool'
import { executeModify, modifyMcpTool, parseModifyArgs } from '@/services/tools/modifyMcpTool'
import { executeP2T, p2tMcpTool, parseP2TArgs } from '@/services/tools/p2tMcpTool'
import { executeT2P, parseT2PArgs, t2pMcpTool } from '@/services/tools/t2pMcpTool'

export function registerNlpTools(
  server: BrowserMcpServer,
  context: GetModelInfoContext = defaultGetModelInfoContext,
  llmConfig?: LLMConfig,
): void {
  server.registerTool({
    tool: helpModelingTool,
    parseArguments: (raw) => parseHelpModelingArgs(raw),
    handler: (args) => executeHelpModeling(parseHelpModelingArgs(args)),
  })

  server.registerTool({
    tool: getModelInfoTool,
    parseArguments: (raw) => parseGetModelInfoArgs(raw),
    handler: (args) =>
      executeGetModelInfo(parseGetModelInfoArgs(args), context),
  })

  server.registerTool({
    tool: t2pMcpTool,
    parseArguments: (raw) => parseT2PArgs(raw),
    handler: (args) => executeT2P(parseT2PArgs(args), llmConfig),
  })

  server.registerTool({
    tool: p2tMcpTool,
    parseArguments: (raw) => parseP2TArgs(raw),
    handler: (args) => executeP2T(parseP2TArgs(args), llmConfig),
  })

  server.registerTool({
    tool: modifyMcpTool,
    parseArguments: (raw) => parseModifyArgs(raw),
    handler: (args) => executeModify(parseModifyArgs(args)),
  })

  server.registerTool({
    tool: analysisMcpTool,
    parseArguments: (raw) => parseAnalysisArgs(raw),
    handler: (args) =>
      executeAnalysis(parseAnalysisArgs(args), context),
  })
}
