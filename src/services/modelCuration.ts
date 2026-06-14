import type { LLMModelOption, LLMProvider } from '@/types/chat'

/**
 * Coarse use-case categories used to guarantee that the offered model
 * selection covers a range of needs rather than, say, three flagship models.
 */
export type ModelUseCase = 'flagship' | 'balanced' | 'efficient' | 'reasoning'

interface CuratedModel extends LLMModelOption {
  useCase: ModelUseCase
  /** Higher rank = newer / more current. Used to drop outdated models. */
  rank: number
}

/** Maximum number of models offered in the dropdown. */
export const MAX_MODELS = 5
/** Minimum number of distinct use cases the offered selection should cover. */
export const MIN_USE_CASES = 3

/**
 * Curated registries of *current* models per provider. Discovery from the
 * provider API can return many models (including outdated ones); intersecting
 * with this list keeps the dropdown focused on a small, current selection.
 * Update these lists as providers release new model families.
 */
const CURATED_MODELS: Record<LLMProvider, CuratedModel[]> = {
  openai: [
    { id: 'gpt-4.1', name: 'GPT-4.1', useCase: 'flagship', rank: 100 },
    { id: 'o4-mini', name: 'o4-mini', useCase: 'reasoning', rank: 95 },
    { id: 'o3', name: 'o3', useCase: 'reasoning', rank: 90 },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 mini', useCase: 'efficient', rank: 85 },
    { id: 'gpt-4o', name: 'GPT-4o', useCase: 'balanced', rank: 80 },
    { id: 'gpt-4o-mini', name: 'GPT-4o mini', useCase: 'efficient', rank: 75 },
  ],
  gemini: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', useCase: 'flagship', rank: 100 },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', useCase: 'balanced', rank: 95 },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', useCase: 'efficient', rank: 90 },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', useCase: 'balanced', rank: 80 },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite', useCase: 'efficient', rank: 75 },
  ],
}

/**
 * Select the most current models from an already recency-sorted candidate list,
 * keeping at most {@link MAX_MODELS} while guaranteeing coverage of at least
 * {@link MIN_USE_CASES} distinct use cases (when the candidates allow it).
 *
 * @param candidates Curated models sorted newest-first.
 */
export function selectCurrentModels(
  candidates: CuratedModel[],
  maxCount: number = MAX_MODELS,
  minUseCases: number = MIN_USE_CASES,
): CuratedModel[] {
  if (candidates.length <= maxCount) return [...candidates]

  const selected = candidates.slice(0, maxCount)
  const distinctUseCases = (list: CuratedModel[]) => new Set(list.map((m) => m.useCase)).size

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

  return selected
}

/**
 * Static fallback list of current models for a provider, used when discovery
 * fails (provider unreachable / invalid key) so the dropdown is never empty.
 */
export function getFallbackModels(provider: LLMProvider): LLMModelOption[] {
  const registry = CURATED_MODELS[provider] ?? []
  return selectCurrentModels(registry).map(({ id, name }) => ({ id, name }))
}

/**
 * Reduce the provider's full model list (from `LLMClient.listModels`) to a
 * small, current selection: only curated current models the API key actually
 * has access to, capped at {@link MAX_MODELS} with at least {@link MIN_USE_CASES}
 * use cases. The provider's own display name is preferred when it is more
 * descriptive than the bare id. If none of the curated models are available
 * (e.g. only brand-new models the registry does not know yet), the input list
 * is returned unchanged so valid models are never hidden.
 */
export function curateModels(
  models: LLMModelOption[],
  provider: LLMProvider,
): LLMModelOption[] {
  const registry = CURATED_MODELS[provider]
  if (!registry || models.length === 0) return models

  const nameById = new Map(models.map((m) => [m.id, m.name]))
  const candidates = registry
    .filter((entry) => nameById.has(entry.id))
    .sort((a, b) => b.rank - a.rank)

  if (candidates.length === 0) return models

  return selectCurrentModels(candidates).map(({ id, name }) => {
    const providerName = nameById.get(id)
    const displayName = providerName && providerName !== id ? providerName : name
    return { id, name: displayName }
  })
}
