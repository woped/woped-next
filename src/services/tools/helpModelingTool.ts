import { z } from 'zod'
import type { McpTool, McpToolResult } from '@/types/mcp'

export const helpModelingArgsSchema = z.object({
  topic: z.string().min(1, 'topic is required'),
})

export type HelpModelingArgs = z.infer<typeof helpModelingArgsSchema>

export const helpModelingTool: McpTool = {
  name: 'help_modeling',
  description:
    'Provide Petri net modeling guidance for a given topic (e.g. parallelism, choice, soundness).',
  inputSchema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'Modeling topic or question in natural language',
      },
    },
    required: ['topic'],
    additionalProperties: false,
  },
}

const TOPIC_HELP: Record<string, string> = {
  parallelism:
    'Model parallelism with an AND-split operator: one place feeds the split, multiple transitions run in parallel, then synchronize with an AND-join before continuing.',
  choice:
    'Model exclusive choice with an XOR-split: one outgoing branch fires. Use an XOR-join when alternative branches merge again.',
  soundness:
    'A workflow net is typically sound when every reachable marking can still reach a proper completion. Use qualitative analysis in WoPeD to check structure and dead transitions.',
  tokens:
    'Tokens mark the current state. Place one or more tokens on start places; firing moves tokens along arcs according to arc weights.',
}

function resolveHelpText(topic: string): string {
  const normalized = topic.toLowerCase()
  for (const [key, text] of Object.entries(TOPIC_HELP)) {
    if (normalized.includes(key)) {
      return text
    }
  }
  return (
    'WoPeD models workflows as Petri nets: places (circles) hold tokens, transitions (rectangles) represent activities, and arcs show flow. ' +
    'Use operators for AND/XOR routing and subprocesses for hierarchy. Ask about parallelism, choice, soundness, or tokens for more detail.'
  )
}

export function parseHelpModelingArgs(raw: unknown): HelpModelingArgs {
  return helpModelingArgsSchema.parse(raw)
}

export function executeHelpModeling(args: HelpModelingArgs): McpToolResult {
  const text = resolveHelpText(args.topic)
  return {
    content: [{ type: 'text', text }],
  }
}
