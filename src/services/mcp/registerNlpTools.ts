import type { BrowserMcpServer } from '@/types/mcp'
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

export function registerNlpTools(
  server: BrowserMcpServer,
  context: GetModelInfoContext = defaultGetModelInfoContext
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
}
