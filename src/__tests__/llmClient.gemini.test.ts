import { afterEach, describe, expect, it, vi } from 'vitest'
import { LLMClient } from '@/services/llmClient'
import type { LLMConfig } from '@/types/chat'

const geminiConfig: LLMConfig = {
  provider: 'gemini',
  apiKey: 'gemini-key',
  model: 'gemini-2.5-flash',
  maxTokens: 256,
  temperature: 0.2,
}

describe('LLMClient Gemini tool calling', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('preserves thought_signature in follow-up requests', async () => {
    const thoughtSignature = 'sig-abc-123'
    const fetchMock = vi.fn<
      (url: string, init?: RequestInit) => Promise<Response>
    >(async (_url, init) => {
      const callIndex = fetchMock.mock.calls.length - 1
      const body = JSON.parse(String(init?.body ?? '{}')) as {
        contents?: Array<{ role: string; parts: unknown[] }>
      }

      if (callIndex === 0) {
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      functionCall: {
                        name: 'default_api:p2t_describe',
                        args: { pnml: '<pnml />' },
                      },
                      thought_signature: thoughtSignature,
                    },
                  ],
                },
                finishReason: 'STOP',
              },
            ],
          }),
        } as Response
      }

      const modelTurn = body.contents?.find((entry) => entry.role === 'model')
      expect(modelTurn?.parts).toEqual([
        {
          functionCall: {
            name: 'default_api:p2t_describe',
            args: { pnml: '<pnml />' },
          },
          thought_signature: thoughtSignature,
        },
      ])

      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: { parts: [{ text: 'Your model describes parallel work.' }] },
              finishReason: 'STOP',
            },
          ],
        }),
      } as Response
    })

    vi.stubGlobal('fetch', fetchMock)

    const client = new LLMClient(geminiConfig)
    const first = await client.chatCompletion([{ role: 'user', content: 'Describe my model' }])

    expect(first.message.gemini_model_parts).toEqual([
      {
        functionCall: {
          name: 'default_api:p2t_describe',
          args: { pnml: '<pnml />' },
        },
        thought_signature: thoughtSignature,
      },
    ])

    const toolCalls = client.parseToolCalls(first.message.tool_calls)
    expect(toolCalls[0].name).toBe('p2t_describe')
    expect(toolCalls[0].providerFunctionName).toBe('default_api:p2t_describe')

    await client.chatCompletion([
      { role: 'user', content: 'Describe my model' },
      {
        role: 'assistant',
        content: first.message.content,
        tool_calls: first.message.tool_calls,
        gemini_model_parts: first.message.gemini_model_parts,
      },
      {
        role: 'tool',
        content: '{"description":"Parallel branches"}',
        tool_call_id: toolCalls[0].id,
        tool_name: toolCalls[0].providerFunctionName,
      },
    ])

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
