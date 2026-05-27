import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  executeT2P,
  parseT2PArgs,
  t2pMcpTool,
} from '@/services/tools/t2pMcpTool'

describe('t2pMcpTool', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('exposes a valid MCP tool definition', () => {
    expect(t2pMcpTool.name).toBe('t2p_convert')
    expect(t2pMcpTool.inputSchema.required).toEqual(['text'])
  })

  it('parses valid arguments with default language', () => {
    const parsed = parseT2PArgs({ text: 'Order process' })
    expect(parsed.text).toBe('Order process')
  })

  it('parses valid arguments with explicit language', () => {
    const parsed = parseT2PArgs({ text: 'Order process', language: 'de' })
    expect(parsed.language).toBe('de')
  })

  it('rejects missing text', () => {
    expect(() => parseT2PArgs({})).toThrow()
  })

  it('rejects empty text', () => {
    expect(() => parseT2PArgs({ text: '' })).toThrow()
  })

  it('rejects unsupported language', () => {
    expect(() => parseT2PArgs({ text: 'x', language: 'fr' })).toThrow()
  })

  it('returns pnml from a successful T2P response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ result: '<pnml/>' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
      )
    )

    const result = await executeT2P({ text: 'order process' })

    expect(result.isError).toBeFalsy()
    const payload = JSON.parse(result.content[0].text)
    expect(payload.pnml).toBe('<pnml/>')
  })

  it('returns an error result when the T2P service responds non-2xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 500 }))
    )

    const result = await executeT2P({ text: 'order process' })

    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('500')
  })

  it('returns an error result when the network call throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      })
    )

    const result = await executeT2P({ text: 'order process' })

    expect(result.isError).toBe(true)
    expect(result.content[0].text.toLowerCase()).toContain('unreachable')
  })
})
