import { z } from 'zod'
import type { LLMConfig } from '@/types/chat'
import type { McpTool, McpToolResult } from '@/types/mcp'
import { jsonStringToMcpResult } from './mcpJsonResult'
import { runP2T } from './t2pP2tCore'

export const p2tArgsSchema = z
  .object({
    pnml: z.string().min(1, 'pnml is required'),
  })
  .strict()

export type P2TArgs = z.infer<typeof p2tArgsSchema>

export const p2tMcpTool: McpTool = {
  name: 'p2t_describe',
  description:
    'Convert the given Petri net model (PNML) to a natural language description using the P2T service, with LLM fallback if the service is unavailable.',
  inputSchema: {
    type: 'object',
    properties: {
      pnml: { type: 'string', description: 'The PNML XML of the model to describe' },
    },
    required: ['pnml'],
    additionalProperties: false,
  },
}

export function parseP2TArgs(raw: unknown): P2TArgs {
  return p2tArgsSchema.parse(raw ?? {})
}

export async function executeP2T(
  args: P2TArgs,
  llmConfig?: LLMConfig,
): Promise<McpToolResult> {
  const json = await runP2T(args, llmConfig)
  return jsonStringToMcpResult(json)
}
