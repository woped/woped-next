import { describe, it, expect } from 'vitest'
import { sortModelsByRecency, getFallbackModels, VISIBLE_MODELS_COUNT } from '@/services/modelOrdering'
import type { LLMModelOption } from '@/types/chat'

describe('sortModelsByRecency', () => {
  it('orders models newest-first by the created timestamp when available', () => {
    const models: LLMModelOption[] = [
      { id: 'gpt-4o', name: 'gpt-4o', created: 100 },
      { id: 'gpt-4.1', name: 'gpt-4.1', created: 300 },
      { id: 'gpt-4o-mini', name: 'gpt-4o-mini', created: 200 },
    ]

    expect(sortModelsByRecency(models).map((m) => m.id)).toEqual([
      'gpt-4.1',
      'gpt-4o-mini',
      'gpt-4o',
    ])
  })

  it('falls back to a version heuristic when no created timestamp is present', () => {
    const models: LLMModelOption[] = [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    ]

    expect(sortModelsByRecency(models).map((m) => m.id)).toEqual([
      'gemini-2.5-pro',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ])
  })

  it('breaks version ties by display name for a stable order', () => {
    const models: LLMModelOption[] = [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    ]

    expect(sortModelsByRecency(models).map((m) => m.id)).toEqual([
      'gemini-2.5-flash',
      'gemini-2.5-pro',
    ])
  })

  it('does not mutate the input array', () => {
    const models: LLMModelOption[] = [
      { id: 'a', name: 'a', created: 1 },
      { id: 'b', name: 'b', created: 2 },
    ]
    const original = [...models]
    sortModelsByRecency(models)
    expect(models).toEqual(original)
  })
})

describe('getFallbackModels', () => {
  it('returns a non-empty current list per provider', () => {
    expect(getFallbackModels('openai').length).toBeGreaterThan(0)
    expect(getFallbackModels('gemini').length).toBeGreaterThan(0)
  })

  it('returns the OpenAI fallback newest-first', () => {
    expect(getFallbackModels('openai')[0].id).toBe('gpt-4.1')
  })

  it('returns the Gemini fallback newest-first', () => {
    expect(getFallbackModels('gemini')[0].id).toBe('gemini-2.5-pro')
  })

  it('returns fresh copies so callers cannot mutate the registry', () => {
    const first = getFallbackModels('openai')
    first[0].name = 'mutated'
    expect(getFallbackModels('openai')[0].name).not.toBe('mutated')
  })
})

describe('VISIBLE_MODELS_COUNT', () => {
  it('shows five models before "show more"', () => {
    expect(VISIBLE_MODELS_COUNT).toBe(5)
  })
})
