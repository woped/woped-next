import { afterEach, describe, expect, it, vi } from 'vitest'
import { LLMClient } from '@/services/llmClient'
import type { LLMConfig } from '@/types/chat'

const baseConfig: LLMConfig = {
  provider: 'openai',
  apiKey: 'sk-test',
  model: 'gpt-4o-mini',
  maxTokens: 256,
  temperature: 0.2,
}

describe('LLMClient OpenAI formatting', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('strips Gemini-only fields from tool messages', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Done',
            },
            finish_reason: 'stop',
          },
        ],
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const client = new LLMClient(baseConfig)
    await client.chatCompletion([
      { role: 'user', content: 'hello' },
      {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call-1',
            type: 'function',
            function: { name: 'help_modeling', arguments: '{"topic":"parallelism"}' },
          },
        ],
      },
      {
        role: 'tool',
        content: 'Use an AND-split.',
        tool_call_id: 'call-1',
        tool_name: 'help_modeling',
      },
    ])

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body ?? '{}'))
    expect(body.messages).toEqual([
      { role: 'user', content: 'hello' },
      {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call-1',
            type: 'function',
            function: { name: 'help_modeling', arguments: '{"topic":"parallelism"}' },
          },
        ],
      },
      {
        role: 'tool',
        content: 'Use an AND-split.',
        tool_call_id: 'call-1',
      },
    ])
  })

  it('uses max_completion_tokens for reasoning models', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: { role: 'assistant', content: 'ok' },
            finish_reason: 'stop',
          },
        ],
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const client = new LLMClient({ ...baseConfig, model: 'o3-mini' })
    await client.chatCompletion([{ role: 'user', content: 'hello' }])

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body ?? '{}'))
    expect(body.max_completion_tokens).toBe(256)
    expect(body.max_tokens).toBeUndefined()
    expect(body.temperature).toBe(1)
  })
})
