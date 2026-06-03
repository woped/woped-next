import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  executeP2T,
  parseP2TArgs,
  p2tMcpTool,
} from '@/services/tools/p2tMcpTool'
import type { LLMConfig } from '@/types/chat'

vi.mock('@/services/tools/toolConfig', () => ({
  TOOL_ENDPOINTS: {
    t2p: 'http://test-t2p/generate_pnml',
    p2t: 'http://test-p2t/generateText',
  },
}))

vi.mock('@/services/tools/llmFallback', () => ({
  llmFallbackT2P: vi.fn(),
  llmFallbackP2T: vi.fn(async () =>
    JSON.stringify({ description: 'LLM bypass description' }),
  ),
}))

const llmConfig: LLMConfig = {
  apiKey: 'sk-test',
  model: 'gpt-4o',
  maxTokens: 4096,
  temperature: 0.7,
}

describe('p2tMcpTool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('exposes a valid MCP tool definition', () => {
    expect(p2tMcpTool.name).toBe('p2t_describe')
    expect(p2tMcpTool.inputSchema.required).toEqual(['pnml'])
  })

  it('parses valid arguments', () => {
    const parsed = parseP2TArgs({ pnml: '<pnml/>' })
    expect(parsed.pnml).toBe('<pnml/>')
  })

  it('rejects missing pnml', () => {
    expect(() => parseP2TArgs({})).toThrow()
  })

  it('rejects empty pnml', () => {
    expect(() => parseP2TArgs({ pnml: '' })).toThrow()
  })

  it('returns the description from a successful P2T response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('A simple order process.', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
          }),
      ),
    )

    const result = await executeP2T({ pnml: '<pnml/>' })

    expect(result.isError).toBeFalsy()
    const payload = JSON.parse(result.content[0].text)
    expect(payload.description).toBe('A simple order process.')
  })

  it('returns an error result when the P2T service responds non-2xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 503 })),
    )

    const result = await executeP2T({ pnml: '<pnml/>' })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('503')
  })

  it('uses LLM fallback when the network call throws and llmConfig is set', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network down')
    }))

    const result = await executeP2T({ pnml: '<pnml/>' }, llmConfig)

    expect(result.isError).toBeFalsy()
    const payload = JSON.parse(result.content[0].text)
    expect(payload.description).toBe('LLM bypass description')
  })
})
