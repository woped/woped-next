import type { LLMConfig } from '@/types/chat'
import type { ServicesConfig } from '@/types/config'
import { getToolEndpoints } from '@/services/tools/toolConfig'
import { llmFallbackP2T, llmFallbackT2P } from './llmFallback'

/** True when we can call the LLM provider directly (bypass T2P/P2T). */
function canUseLlmBypass(llmConfig?: LLMConfig): boolean {
  return Boolean(llmConfig?.apiKey?.trim())
}

function extractT2PPnml(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const record = data as Record<string, unknown>
  const candidates = [record.result, record.pnml, record.data]
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }
  return ''
}

function buildT2PRequest(
  args: { text: string },
  llmConfig: LLMConfig,
  servicesConfig?: ServicesConfig,
): { headers: HeadersInit; body: string } {
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${llmConfig.apiKey.trim()}`,
    },
    body: JSON.stringify({
      text: args.text,
      provider: llmConfig.provider,
      model: llmConfig.model,
      prompting_strategy: servicesConfig?.t2pPromptingStrategy ?? 'zero_shot',
    }),
  }
}

/**
 * Text → PNML: try T2P 2.0 v2 service first; on failure or when disabled, bypass
 * the service and use the LLM + prompt.
 */
export async function runT2P(
  args: { text: string; language?: string },
  llmConfig?: LLMConfig,
  servicesConfig?: ServicesConfig,
): Promise<string> {
  const language = args.language || 'en'
  const endpoints = getToolEndpoints(servicesConfig)

  if (!endpoints.t2p) {
    if (canUseLlmBypass(llmConfig)) {
      return llmFallbackT2P(llmConfig!, args.text, language)
    }
    return JSON.stringify({ error: 'T2P endpoint is not configured or disabled.' })
  }

  if (!canUseLlmBypass(llmConfig)) {
    return JSON.stringify({
      error: 'T2P service requires a configured API key (Chat settings).',
    })
  }

  const request = buildT2PRequest(args, llmConfig!, servicesConfig)

  try {
    const response = await fetch(endpoints.t2p, {
      method: 'POST',
      ...request,
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
    const pnml = extractT2PPnml(data)
    if (!pnml) {
      return JSON.stringify({
        error: 'T2P service returned an empty PNML result.',
      })
    }
    return JSON.stringify({ pnml })
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
 * PNML → text: try P2T service first; on failure or when disabled, bypass the
 * service and use the LLM + prompt.
 */
export async function runP2T(
  args: { pnml: string },
  llmConfig?: LLMConfig,
  servicesConfig?: ServicesConfig,
): Promise<string> {
  const endpoints = getToolEndpoints(servicesConfig)

  if (!endpoints.p2t) {
    if (canUseLlmBypass(llmConfig)) {
      return llmFallbackP2T(llmConfig!, args.pnml)
    }
    return JSON.stringify({ error: 'P2T endpoint is not configured or disabled.' })
  }

  try {
    const response = await fetch(endpoints.p2t, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
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
