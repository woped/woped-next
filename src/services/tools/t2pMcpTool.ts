import { z } from 'zod'
import type { McpTool, McpToolResult } from '@/types/mcp'

const T2P_ENDPOINT = '/t2p-2.0/generate_pnml'

export const t2pArgsSchema = z
  .object({
    text: z.string().min(1, 'text is required'),
    language: z.enum(['en', 'de']).optional(),
  })
  .strict()

export type T2PArgs = z.infer<typeof t2pArgsSchema>

export const t2pMcpTool: McpTool = {
  name: 't2p_convert',
  description:
    'Convert natural language text to a Petri net (PNML format). Uses the T2P service when configured, otherwise falls back to the configured LLM.',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Process description in natural language' },
      language: {
        type: 'string',
        description: 'Language of the text (defaults to en)',
      },
    },
    required: ['text'],
    additionalProperties: false,
  },
}

export function parseT2PArgs(raw: unknown): T2PArgs {
  return t2pArgsSchema.parse(raw ?? {})
}

export async function executeT2P(args: T2PArgs): Promise<McpToolResult> {
  const language = args.language ?? 'en'

  try {
    const response = await fetch(T2P_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: args.text, language }),
    })

    if (!response.ok) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: `T2P service returned ${response.status}. The service may not be available.`,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      }
    }

    const data = await response.json()
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { pnml: data.result || data.pnml || '' },
            null,
            2
          ),
        },
      ],
    }
  } catch {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { error: 'T2P service unreachable.' },
            null,
            2
          ),
        },
      ],
      isError: true,
    }
  }
}

