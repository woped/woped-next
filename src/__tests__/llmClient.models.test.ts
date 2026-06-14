import { afterEach, describe, expect, it, vi } from 'vitest'
import { LLMClient } from '@/services/llmClient'

describe('LLMClient model listing', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns no models without an API key', async () => {
    await expect(LLMClient.listModels('', 'openai')).resolves.toEqual([])
    await expect(LLMClient.listModels('   ', 'gemini')).resolves.toEqual([])
  })

  it('returns only current chat-capable OpenAI models from the provider list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          data: [
            { id: 'gpt-4o' },
            { id: 'gpt-4o-mini' },
            { id: 'gpt-4o-2024-08-06' },
            { id: 'text-embedding-3-small' },
            { id: 'whisper-1' },
            { id: 'o3-mini' },
          ],
        }),
      })),
    )

    await expect(LLMClient.listModels('sk-test', 'openai')).resolves.toEqual([
      { id: 'gpt-4o', name: 'gpt-4o' },
      { id: 'gpt-4o-mini', name: 'gpt-4o-mini' },
      { id: 'o3-mini', name: 'o3-mini' },
    ])
  })

  it('filters Gemini models to chat-capable entries only', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          models: [
            {
              name: 'models/gemini-2.5-flash',
              displayName: 'Gemini 2.5 Flash',
              supportedGenerationMethods: ['generateContent'],
            },
            {
              name: 'models/gemini-2.5-pro',
              displayName: 'Gemini 2.5 Pro',
              supportedGenerationMethods: ['generateContent'],
            },
            {
              name: 'models/gemini-embedding-001',
              displayName: 'Gemini Embedding',
              supportedGenerationMethods: ['generateContent'],
            },
            {
              name: 'models/gemini-2.0-flash-exp',
              displayName: 'Gemini 2.0 Flash Experimental',
              supportedGenerationMethods: ['generateContent'],
            },
          ],
        }),
      })),
    )

    await expect(LLMClient.listModels('gemini-key', 'gemini')).resolves.toEqual([
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    ])
  })

  it('validates API keys with a lightweight provider request', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(LLMClient.validateApiKey('sk-test', 'openai')).resolves.toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/models',
      expect.objectContaining({
        headers: { Authorization: 'Bearer sk-test' },
      }),
    )

    await expect(LLMClient.validateApiKey('gemini-key', 'gemini')).resolves.toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('generativelanguage.googleapis.com/v1beta/models?'),
    )
  })
})
