import { z } from 'zod'
import type { McpTool, McpToolResult } from '@/types/mcp'
import { analyzeSoundness, analyzeWorkflow } from '@/services/analysis'
import type { GetModelInfoContext } from '@/services/tools/getModelInfoTool'

export const analysisArgsSchema = z
  .object({
    checks: z.array(z.enum(['workflow', 'soundness', 'all'])).optional(),
  })
  .strict()

export type AnalysisArgs = z.infer<typeof analysisArgsSchema>

export const analysisMcpTool: McpTool = {
  name: 'analyze_model',
  description:
    'Run structural and behavioral analysis on the current Petri net model. Returns information about soundness, workflow properties, dead transitions, and more.',
  inputSchema: {
    type: 'object',
    properties: {
      checks: {
        type: 'array',
        description: 'Which analyses to run. Defaults to ["all"].',
        items: {
          type: 'string',
          enum: ['workflow', 'soundness', 'all'],
        },
      },
    },
    additionalProperties: false,
  },
}

export function parseAnalysisArgs(raw: unknown): AnalysisArgs {
  return analysisArgsSchema.parse(raw ?? {})
}

export function executeAnalysis(
  args: AnalysisArgs,
  context: GetModelInfoContext
): McpToolResult {
  const net = context.getNet()
  if (!net) {
    return {
      content: [{ type: 'text', text: 'No Petri net is loaded.' }],
      isError: true,
    }
  }

  const checks = args.checks?.length ? args.checks : ['all']
  const results: Record<string, unknown> = {}

  if (checks.includes('all') || checks.includes('workflow')) {
    try {
      results.workflow = analyzeWorkflow(net)
    } catch (e) {
      results.workflow = { error: e instanceof Error ? e.message : 'Analysis failed' }
    }
  }

  if (checks.includes('all') || checks.includes('soundness')) {
    try {
      results.soundness = analyzeSoundness(net)
    } catch (e) {
      results.soundness = { error: e instanceof Error ? e.message : 'Analysis failed' }
    }
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
  }
}

