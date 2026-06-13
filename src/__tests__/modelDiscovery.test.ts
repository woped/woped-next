import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  discoverModels,
  discoverOpenAiModels,
  selectCurrentModels,
  FALLBACK_MODELS,
  MAX_MODELS,
  MIN_USE_CASES,
} from '@/services/modelDiscovery'

function modelsResponse(ids: string[]) {
  return new Response(JSON.stringify({ object: 'list', data: ids.map((id) => ({ id })) }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('selectCurrentModels', () => {
  const entry = (id: string, useCase: 'flagship' | 'balanced' | 'efficient' | 'reasoning', rank: number) =>
    ({ id, name: id, useCase, rank })

  it('returns all candidates when at or below the cap', () => {
    const candidates = [entry('a', 'flagship', 3), entry('b', 'balanced', 2)]
    const result = selectCurrentModels(candidates)
    expect(result.map((m) => m.id)).toEqual(['a', 'b'])
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
    const result = selectCurrentModels(candidates)
    expect(result).toHaveLength(MAX_MODELS)
  })

  it('guarantees at least MIN_USE_CASES distinct use cases', () => {
    // Top 5 by rank would only cover 2 use cases (flagship + reasoning).
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
    const useCases = new Set(
      result.map((m) => candidates.find((c) => c.id === m.id)!.useCase),
    )
    expect(result).toHaveLength(MAX_MODELS)
    expect(useCases.size).toBeGreaterThanOrEqual(MIN_USE_CASES)
  })

  it('prioritises newer models (higher rank first)', () => {
    const candidates = [
      entry('newest', 'flagship', 100),
      entry('mid', 'balanced', 50),
      entry('old', 'efficient', 10),
    ]
    const result = selectCurrentModels(candidates)
    expect(result[0].id).toBe('newest')
  })
})

describe('discoverOpenAiModels', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the fallback list without calling the API for an empty key', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await discoverOpenAiModels('   ')

    expect(result).toEqual(FALLBACK_MODELS)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns only current models the key has access to', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        modelsResponse([
          'gpt-4o',
          'gpt-4o-mini',
          'gpt-3.5-turbo', // outdated -> excluded
          'text-embedding-3-large', // non-chat -> excluded
          'whisper-1', // non-chat -> excluded
          'o3',
        ]),
      ),
    )

    const result = await discoverOpenAiModels('sk-test')
    const ids = result.map((m) => m.id)

    expect(ids).toContain('gpt-4o')
    expect(ids).toContain('gpt-4o-mini')
    expect(ids).toContain('o3')
    expect(ids).not.toContain('gpt-3.5-turbo')
    expect(ids).not.toContain('text-embedding-3-large')
    expect(ids).not.toContain('whisper-1')
  })

  it('never offers more than MAX_MODELS', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        modelsResponse(['gpt-4.1', 'o4-mini', 'o3', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4o-mini']),
      ),
    )

    const result = await discoverOpenAiModels('sk-test')
    expect(result.length).toBeLessThanOrEqual(MAX_MODELS)
  })

  it('falls back when the API responds non-2xx (e.g. invalid key)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 401 })))

    const result = await discoverOpenAiModels('sk-invalid')
    expect(result).toEqual(FALLBACK_MODELS)
  })

  it('falls back when the network call throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )

    const result = await discoverOpenAiModels('sk-test')
    expect(result).toEqual(FALLBACK_MODELS)
  })

  it('falls back when no known model is available', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => modelsResponse(['some-unknown-model'])))

    const result = await discoverOpenAiModels('sk-test')
    expect(result).toEqual(FALLBACK_MODELS)
  })
})

describe('discoverModels', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('delegates to OpenAI discovery by default', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => modelsResponse(['gpt-4o', 'o3', 'gpt-4o-mini'])))

    const result = await discoverModels('sk-test')
    expect(result.map((m) => m.id)).toContain('gpt-4o')
  })
})
