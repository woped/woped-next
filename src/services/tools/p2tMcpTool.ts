import { z } from 'zod'
import type { McpTool, McpToolResult } from '@/types/mcp'

const P2T_ENDPOINT = '/p2t/generateText'

export const p2tArgsSchema = z
  .object({
    pnml: z.string().min(1, 'pnml is required'),
  })
  .strict()

export type P2TArgs = z.infer<typeof p2tArgsSchema>

export const p2tMcpTool: McpTool = {
  name: 'p2t_describe',
  description:
    'Describe the given Petri net model (PNML) in natural language. Uses the P2T service when configured, otherwise falls back to the configured LLM.',
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

export async function executeP2T(args: P2TArgs): Promise<McpToolResult> {
  try {
    const response = await fetch(P2T_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: args.pnml,
    })

    if (!response.ok) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: `P2T service returned ${response.status}. The service may not be available.`,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      }
    }

    const text = await response.text()
    return {
      content: [
        { type: 'text', text: JSON.stringify({ description: text }, null, 2) },
      ],
    }
  } catch {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: 'P2T service unreachable.' }, null, 2),
        },
      ],
      isError: true,
    }
  }
}

