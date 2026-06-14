import type { LLMConfig } from '@/types/chat'
import { TOOL_ENDPOINTS } from '@/services/tools/toolConfig'
import { llmFallbackP2T, llmFallbackT2P } from './llmFallback'

/** True when we can call the LLM provider directly (bypass T2P/P2T). */
function canUseLlmBypass(llmConfig?: LLMConfig): boolean {
  return Boolean(llmConfig?.apiKey?.trim())
}

/**
 * Text → PNML: try T2P service first; on failure, bypass service and use LLM + prompt.
 */
export async function runT2P(
  args: { text: string; language?: string },
  llmConfig?: LLMConfig,
): Promise<string> {
  const language = args.language || 'en'

  if (!TOOL_ENDPOINTS.t2p) {
    if (canUseLlmBypass(llmConfig)) {
      return llmFallbackT2P(llmConfig!, args.text, language)
    }
    return JSON.stringify({ error: 'T2P endpoint is not configured.' })
  }

  try {
    const body: Record<string, string> = { text: args.text, language }
    if (llmConfig?.apiKey) {
      body.api_key = llmConfig.apiKey
    }

    const response = await fetch(TOOL_ENDPOINTS.t2p, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      if (canUseLlmBypass(llmConfig)) {
        return llmFallbackT2P(llmConfig!, args.text, language)
      }
      return JSON.stringify({
        error: `T2P service returned ${response.status}. The service may not be available.`,
      })
    }

    const data = await response.json()
    return JSON.stringify({ pnml: data.result || data.pnml || '' })
  } catch {
    if (canUseLlmBypass(llmConfig)) {
      return llmFallbackT2P(llmConfig!, args.text, language)
    }
    return JSON.stringify({
      error: 'T2P service unreachable and no LLM fallback available.',
    })
  }
}

/**
 * PNML → text: try P2T service first; on failure, bypass service and use LLM + prompt.
 */
export async function runP2T(
  args: { pnml: string },
  llmConfig?: LLMConfig,
): Promise<string> {
  if (!TOOL_ENDPOINTS.p2t) {
    if (canUseLlmBypass(llmConfig)) {
      return llmFallbackP2T(llmConfig!, args.pnml)
    }
    return JSON.stringify({ error: 'P2T endpoint is not configured.' })
  }

  try {
    const response = await fetch(TOOL_ENDPOINTS.p2t, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: args.pnml,
    })

    if (!response.ok) {
      if (canUseLlmBypass(llmConfig)) {
        return llmFallbackP2T(llmConfig!, args.pnml)
      }
      return JSON.stringify({
        error: `P2T service returned ${response.status}. The service may not be available.`,
      })
    }

    const text = await response.text()
    return JSON.stringify({ description: text })
  } catch {
    if (canUseLlmBypass(llmConfig)) {
      return llmFallbackP2T(llmConfig!, args.pnml)
    }
    return JSON.stringify({
      error: 'P2T service unreachable and no LLM fallback available.',
    })
  }
}
