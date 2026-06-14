import { afterEach, describe, expect, it, vi } from 'vitest'
import { p2tTool } from '@/services/tools/p2tTool'
import type { LLMConfig } from '@/types/chat'

vi.mock('@/services/tools/toolConfig', () => ({
  TOOL_ENDPOINTS: { p2t: undefined, t2p: undefined },
}))

const llmConfig: LLMConfig = {
  provider: 'gemini',
  apiKey: 'test-key',
  model: 'gemini-2.5-flash',
  maxTokens: 256,
  temperature: 0.2,
}

describe('p2tTool LLM fallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('uses LLM fallback when the P2T endpoint is not configured', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'Parallel tasks A and B.' }],
              },
              finishReason: 'STOP',
            },
          ],
        }),
      })),
    )

    const result = await p2tTool.execute({ pnml: '<pnml />' }, llmConfig)
    const parsed = JSON.parse(result)

    expect(parsed.description).toContain('Parallel tasks')
    expect(fetch).toHaveBeenCalled()
  })
})
