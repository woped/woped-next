import type { ModelOption } from '@/types/chat'
import { AVAILABLE_MODELS } from '@/types/chat'

/**
 * Provider for which models can be discovered. Only OpenAI is wired up today;
 * the structure is kept extensible so additional providers (e.g. Gemini) can
 * register their own discovery function without touching callers.
 */
export type LLMProvider = 'openai'

/**
 * Coarse use-case categories used to guarantee that the offered model
 * selection covers a range of needs (not just, say, three flagship models).
 */
export type ModelUseCase = 'flagship' | 'balanced' | 'efficient' | 'reasoning'

interface ModelRegistryEntry extends ModelOption {
  useCase: ModelUseCase
  /** Higher rank = newer / more current. Used to drop outdated models. */
  rank: number
}

/** Maximum number of models offered in the dropdown. */
export const MAX_MODELS = 5
/** Minimum number of distinct use cases the offered selection should cover. */
export const MIN_USE_CASES = 3

/**
 * Curated registry of *current* OpenAI chat models. The discovery service only
 * ever offers models from this list that the API key actually has access to,
 * which keeps outdated/legacy models (gpt-3.5, dated snapshots, non-chat models
 * like embeddings/whisper/tts) out of the dropdown. Update this list as the
 * provider releases new model families.
 */
const OPENAI_MODEL_REGISTRY: ModelRegistryEntry[] = [
  { id: 'gpt-4.1', name: 'GPT-4.1', useCase: 'flagship', rank: 100 },
  { id: 'o4-mini', name: 'o4-mini', useCase: 'reasoning', rank: 95 },
  { id: 'o3', name: 'o3', useCase: 'reasoning', rank: 90 },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 mini', useCase: 'efficient', rank: 85 },
  { id: 'gpt-4o', name: 'GPT-4o', useCase: 'balanced', rank: 80 },
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', useCase: 'efficient', rank: 75 },
]

/** Static fallback used when discovery is not possible. */
export const FALLBACK_MODELS: ModelOption[] = AVAILABLE_MODELS.map((m) => ({ ...m }))

interface OpenAiModelsResponse {
  data?: Array<{ id?: string }>
}

const OPENAI_MODELS_URL = 'https://api.openai.com/v1/models'

/**
 * Select the most current models from an already recency-sorted candidate list,
 * keeping at most {@link MAX_MODELS} while guaranteeing coverage of at least
 * {@link MIN_USE_CASES} distinct use cases (when the candidates allow it).
 *
 * @param candidates Registry entries sorted newest-first.
 */
export function selectCurrentModels(
  candidates: ModelRegistryEntry[],
  maxCount: number = MAX_MODELS,
  minUseCases: number = MIN_USE_CASES,
): ModelOption[] {
  if (candidates.length <= maxCount) {
    return candidates.map(({ id, name }) => ({ id, name }))
  }

  const selected = candidates.slice(0, maxCount)
  const distinctUseCases = (list: ModelRegistryEntry[]) =>
    new Set(list.map((m) => m.useCase)).size

  // If the newest `maxCount` models already cover enough use cases we are done.
  if (distinctUseCases(selected) < minUseCases) {
    const remaining = candidates.slice(maxCount)
    for (const candidate of remaining) {
      if (distinctUseCases(selected) >= minUseCases) break
      const presentUseCases = new Set(selected.map((m) => m.useCase))
      if (presentUseCases.has(candidate.useCase)) continue

      // Replace the lowest-ranked model from an over-represented use case.
      for (let i = selected.length - 1; i >= 0; i--) {
        const useCase = selected[i].useCase
        const occurrences = selected.filter((m) => m.useCase === useCase).length
        if (occurrences > 1) {
          selected.splice(i, 1)
          selected.push(candidate)
          break
        }
      }
    }
  }

  return selected.map(({ id, name }) => ({ id, name }))
}

/**
 * Fetch the chat models available for the given OpenAI API key and reduce them
 * to a current, use-case-diverse selection. Falls back to {@link FALLBACK_MODELS}
 * on any error (invalid key, network failure, unexpected payload).
 */
export async function discoverOpenAiModels(
  apiKey: string,
  signal?: AbortSignal,
): Promise<ModelOption[]> {
  if (!apiKey.trim()) return FALLBACK_MODELS

  try {
    const response = await fetch(OPENAI_MODELS_URL, {
      headers: { Authorization: `Bearer ${apiKey.trim()}` },
      signal,
    })

    if (!response.ok) return FALLBACK_MODELS

    const data = (await response.json()) as OpenAiModelsResponse
    const availableIds = new Set(
      (data.data ?? [])
        .map((m) => m.id)
        .filter((id): id is string => typeof id === 'string'),
    )

    const candidates = OPENAI_MODEL_REGISTRY.filter((entry) =>
      availableIds.has(entry.id),
    ).sort((a, b) => b.rank - a.rank)

    if (candidates.length === 0) return FALLBACK_MODELS

    return selectCurrentModels(candidates)
  } catch {
    return FALLBACK_MODELS
  }
}

/**
 * Provider-agnostic entry point for model discovery. Only OpenAI is currently
 * supported; unknown providers resolve to the static fallback list.
 */
export async function discoverModels(
  apiKey: string,
  provider: LLMProvider = 'openai',
  signal?: AbortSignal,
): Promise<ModelOption[]> {
  switch (provider) {
    case 'openai':
      return discoverOpenAiModels(apiKey, signal)
    default:
      return FALLBACK_MODELS
  }
}
