import type { LLMModelOption, LLMProvider } from '@/types/chat'

/** Number of models shown before the "show more" action reveals the rest. */
export const VISIBLE_MODELS_COUNT = 5

/**
 * Parse a comparable version number from a model id, e.g.
 * `gemini-2.5-flash` -> 2.5, `gpt-4.1` -> 4.1, `o3` -> 3. Used as a recency
 * heuristic when the provider does not expose a creation timestamp.
 */
function parseVersion(id: string): number {
  const match = id.match(/(\d+(?:\.\d+)?)/)
  return match ? Number.parseFloat(match[1]) : 0
}

/**
 * Sort models newest-first. Prefers the provider creation timestamp
 * (`created`, OpenAI) when both models expose it; otherwise falls back to a
 * version heuristic parsed from the model id (e.g. Gemini 2.5 before 2.0),
 * then the display name for a stable order.
 */
export function sortModelsByRecency(models: LLMModelOption[]): LLMModelOption[] {
  return [...models].sort((a, b) => {
    if (a.created != null && b.created != null && a.created !== b.created) {
      return b.created - a.created
    }

    const versionA = parseVersion(a.id)
    const versionB = parseVersion(b.id)
    if (versionA !== versionB) return versionB - versionA

    return a.name.localeCompare(b.name)
  })
}

/**
 * Static fallback list of current models per provider (newest-first), used when
 * discovery fails (provider unreachable / invalid key) so the dropdown is never
 * empty. Update these lists as providers release new model families.
 */
const FALLBACK_MODELS: Record<LLMProvider, LLMModelOption[]> = {
  openai: [
    { id: 'gpt-4.1', name: 'GPT-4.1' },
    { id: 'o4-mini', name: 'o4-mini' },
    { id: 'o3', name: 'o3' },
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
  ],
  gemini: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite' },
  ],
}

/** Static fallback list of current models for a provider (newest-first). */
export function getFallbackModels(provider: LLMProvider): LLMModelOption[] {
  return (FALLBACK_MODELS[provider] ?? []).map((model) => ({ ...model }))
}
