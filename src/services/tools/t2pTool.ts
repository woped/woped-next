import type { LLMConfig } from '@/types/chat'
import { TOOL_ENDPOINTS } from '@/services/tools/toolConfig'
import { llmFallbackT2P } from './llmFallback'

export const t2pTool = {
  definition: {
    type: 'function' as const,
    function: {
      name: 't2p_convert',
      description:
        'Convert natural language text to a Petri net (PNML format) using the T2P 2.0 service. Use this when the user wants to create a new Petri net from a process description.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Process description in natural language',
          },
          language: {
            type: 'string',
            enum: ['en', 'de'],
            description: 'Language of the text (defaults to en)',
          },
        },
        required: ['text'],
      },
    },
  },

  async execute(
    args: { text: string; language?: string },
    llmConfig?: LLMConfig,
  ): Promise<string> {
    const language = args.language || 'en'

    if (!TOOL_ENDPOINTS.t2p) {
      return JSON.stringify({
        error: 'T2P endpoint is not configured.',
      })
    }

    try {
      const response = await fetch(TOOL_ENDPOINTS.t2p, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: args.text, language }),
      })

      if (!response.ok) {
        if (llmConfig) {
          return await llmFallbackT2P(llmConfig, args.text, language)
        }
        return JSON.stringify({
          error: `T2P service returned ${response.status}. The service may not be available.`,
        })
      }

      const data = await response.json()
      return JSON.stringify({ pnml: data.result || data.pnml || '' })
    } catch {
      if (llmConfig) {
        return await llmFallbackT2P(llmConfig, args.text, language)
      }
      return JSON.stringify({
        error: 'T2P service unreachable and no LLM fallback available.',
      })
    }
  },
}
