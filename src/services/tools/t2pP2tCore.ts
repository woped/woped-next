import type { LLMConfig } from '@/types/chat'
import type { ServicesConfig, T2PPromptingStrategy } from '@/types/config'
import { getToolEndpoints } from '@/services/tools/toolConfig'
import { chatLogger } from '@/services/chatLogger'
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

async function readT2PServiceError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    if (data && typeof data === 'object' && 'error' in data) {
      const err = (data as { error?: { code?: string; message?: string } }).error
      if (err?.message) {
        return err.code ? `${err.code}: ${err.message}` : err.message
      }
    }
  } catch {
    // ignore non-JSON error bodies
  }
  return `HTTP ${response.status}`
}

function buildT2PRequest(
  args: { text: string },
  llmConfig: LLMConfig,
  promptingStrategy: T2PPromptingStrategy,
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
      prompting_strategy: promptingStrategy,
    }),
  }
}

async function callT2PService(
  endpoint: string,
  request: { headers: HeadersInit; body: string },
): Promise<Response> {
  return fetch(endpoint, {
    method: 'POST',
    ...request,
  })
}

async function fallbackToLlmT2P(
  llmConfig: LLMConfig,
  text: string,
  language: string,
  reason: string,
): Promise<string> {
  chatLogger.warn(`${reason} — using LLM fallback`)
  return llmFallbackT2P(llmConfig, text, language)
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

  const promptingStrategy = servicesConfig?.t2pPromptingStrategy ?? 'zero_shot'
  let request = buildT2PRequest(args, llmConfig!, promptingStrategy)

  try {
    let response = await callT2PService(endpoints.t2p, request)

    if (
      !response.ok &&
      promptingStrategy === 'few_shot'
    ) {
      const firstError = await readT2PServiceError(response.clone())
      if (firstError.includes('transform')) {
        chatLogger.warn('T2P few-shot PNML transform failed — retrying with zero-shot')
        request = buildT2PRequest(args, llmConfig!, 'zero_shot')
        response = await callT2PService(endpoints.t2p, request)
      }
    }

    if (!response.ok) {
      const serviceError = await readT2PServiceError(response)
      if (canUseLlmBypass(llmConfig)) {
        return fallbackToLlmT2P(
          llmConfig!,
          args.text,
          language,
          `T2P service failed (${serviceError})`,
        )
      }
      return JSON.stringify({
        error: `T2P service failed (${serviceError}).`,
      })
    }

    const data = await response.json()
    const pnml = extractT2PPnml(data)
    if (!pnml) {
      if (canUseLlmBypass(llmConfig)) {
        return fallbackToLlmT2P(
          llmConfig!,
          args.text,
          language,
          'T2P service returned an empty PNML result',
        )
      }
      return JSON.stringify({
        error: 'T2P service returned an empty PNML result.',
      })
    }
    return JSON.stringify({ pnml })
  } catch {
    if (canUseLlmBypass(llmConfig)) {
      return fallbackToLlmT2P(
        llmConfig!,
        args.text,
        language,
        'T2P service unreachable',
      )
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
