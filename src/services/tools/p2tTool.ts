import type { LLMConfig } from '@/types/chat'
import { TOOL_ENDPOINTS } from '@/services/tools/toolConfig'
import { llmFallbackP2T } from './llmFallback'

export const p2tTool = {
  definition: {
    type: 'function' as const,
    function: {
      name: 'p2t_describe',
      description:
        'Convert the current Petri net model (PNML) to a natural language description using the P2T service.',
      parameters: {
        type: 'object',
        properties: {
          pnml: {
            type: 'string',
            description: 'The PNML XML of the model to describe',
          },
        },
        required: ['pnml'],
      },
    },
  },

  async execute(args: { pnml: string }, llmConfig?: LLMConfig): Promise<string> {
    if (!TOOL_ENDPOINTS.p2t) {
      if (llmConfig?.apiKey) {
        return await llmFallbackP2T(llmConfig, args.pnml)
      }
      return JSON.stringify({
        error: 'P2T endpoint is not configured.',
      })
    }

    try {
      const response = await fetch(TOOL_ENDPOINTS.p2t, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: args.pnml,
      })

      if (!response.ok) {
        if (llmConfig) {
          return await llmFallbackP2T(llmConfig, args.pnml)
        }
        return JSON.stringify({
          error: `P2T service returned ${response.status}. The service may not be available.`,
        })
      }

      const text = await response.text()
      return JSON.stringify({ description: text })
    } catch {
      if (llmConfig) {
        return await llmFallbackP2T(llmConfig, args.pnml)
      }
      return JSON.stringify({
        error: 'P2T service unreachable and no LLM fallback available.',
      })
    }
  },
}
