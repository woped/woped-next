import { describe, it, expect } from 'vitest'
import {
  curateModels,
  getFallbackModels,
  selectCurrentModels,
  MAX_MODELS,
  MIN_USE_CASES,
} from '@/services/modelCuration'
import type { LLMModelOption } from '@/types/chat'

type UseCase = 'flagship' | 'balanced' | 'efficient' | 'reasoning'
const entry = (id: string, useCase: UseCase, rank: number) => ({ id, name: id, useCase, rank })

describe('selectCurrentModels', () => {
  it('returns all candidates when at or below the cap', () => {
    const candidates = [entry('a', 'flagship', 3), entry('b', 'balanced', 2)]
    expect(selectCurrentModels(candidates).map((m) => m.id)).toEqual(['a', 'b'])
  })

  it('caps the selection to MAX_MODELS', () => {
    const candidates = [
      entry('a', 'flagship', 6),
      entry('b', 'reasoning', 5),
      entry('c', 'reasoning', 4),
      entry('d', 'efficient', 3),
      entry('e', 'balanced', 2),
      entry('f', 'efficient', 1),
    ]
    expect(selectCurrentModels(candidates)).toHaveLength(MAX_MODELS)
  })

  it('guarantees at least MIN_USE_CASES distinct use cases', () => {
    const candidates = [
      entry('f1', 'flagship', 10),
      entry('r1', 'reasoning', 9),
      entry('r2', 'reasoning', 8),
      entry('r3', 'reasoning', 7),
      entry('f2', 'flagship', 6),
      entry('eff', 'efficient', 5),
      entry('bal', 'balanced', 4),
    ]
    const result = selectCurrentModels(candidates)
    expect(result).toHaveLength(MAX_MODELS)
    expect(new Set(result.map((m) => m.useCase)).size).toBeGreaterThanOrEqual(MIN_USE_CASES)
  })

  it('prioritises newer models (higher rank first)', () => {
    const candidates = [
      entry('newest', 'flagship', 100),
      entry('mid', 'balanced', 50),
      entry('old', 'efficient', 10),
    ]
    expect(selectCurrentModels(candidates)[0].id).toBe('newest')
  })
})

describe('getFallbackModels', () => {
  it('returns a current, use-case-diverse list for OpenAI', () => {
    const models = getFallbackModels('openai')
    expect(models.length).toBeGreaterThanOrEqual(MIN_USE_CASES)
    expect(models.length).toBeLessThanOrEqual(MAX_MODELS)
    expect(models.map((m) => m.id)).toContain('gpt-4o')
  })

  it('returns a current list for Gemini', () => {
    const models = getFallbackModels('gemini')
    expect(models.length).toBeLessThanOrEqual(MAX_MODELS)
    expect(models.some((m) => m.id.startsWith('gemini-'))).toBe(true)
  })
})

describe('curateModels', () => {
  it('keeps only curated current models the key has access to', () => {
    const apiModels: LLMModelOption[] = [
      { id: 'gpt-4o', name: 'gpt-4o' },
      { id: 'gpt-4o-mini', name: 'gpt-4o-mini' },
      { id: 'gpt-3.5-turbo', name: 'gpt-3.5-turbo' }, // outdated, not in registry
      { id: 'o3', name: 'o3' },
      { id: 'gpt-4.1', name: 'gpt-4.1' },
    ]
    const ids = curateModels(apiModels, 'openai').map((m) => m.id)
    expect(ids).toContain('gpt-4o')
    expect(ids).toContain('o3')
    expect(ids).toContain('gpt-4.1')
    expect(ids).not.toContain('gpt-3.5-turbo')
  })

  it('never returns more than MAX_MODELS', () => {
    const apiModels: LLMModelOption[] = [
      { id: 'gpt-4.1', name: 'gpt-4.1' },
      { id: 'o4-mini', name: 'o4-mini' },
      { id: 'o3', name: 'o3' },
      { id: 'gpt-4.1-mini', name: 'gpt-4.1-mini' },
      { id: 'gpt-4o', name: 'gpt-4o' },
      { id: 'gpt-4o-mini', name: 'gpt-4o-mini' },
    ]
    expect(curateModels(apiModels, 'openai').length).toBeLessThanOrEqual(MAX_MODELS)
  })

  it('prefers the provider display name when more descriptive (Gemini)', () => {
    const apiModels: LLMModelOption[] = [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    ]
    const pro = curateModels(apiModels, 'gemini').find((m) => m.id === 'gemini-2.5-pro')
    expect(pro?.name).toBe('Gemini 2.5 Pro')
  })

  it('returns the input unchanged when no curated model matches', () => {
    const apiModels: LLMModelOption[] = [{ id: 'some-brand-new-model', name: 'Brand New' }]
    expect(curateModels(apiModels, 'openai')).toEqual(apiModels)
  })

  it('returns empty input unchanged', () => {
    expect(curateModels([], 'openai')).toEqual([])
  })
})
