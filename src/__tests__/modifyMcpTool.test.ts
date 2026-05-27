import { describe, it, expect } from 'vitest'
import {
  executeModify,
  modifyMcpTool,
  parseModifyArgs,
} from '@/services/tools/modifyMcpTool'

describe('modifyMcpTool', () => {
  it('exposes a valid MCP tool definition', () => {
    expect(modifyMcpTool.name).toBe('modify_model')
    expect(modifyMcpTool.inputSchema.required).toEqual(['action', 'params'])
  })

  it('parses a valid add_place command', () => {
    const parsed = parseModifyArgs({
      action: 'add_place',
      params: { name: 'Start', position: { x: 0, y: 0 } },
    })
    expect(parsed.action).toBe('add_place')
    expect(parsed.params.name).toBe('Start')
  })

  it('rejects an unknown action', () => {
    expect(() =>
      parseModifyArgs({ action: 'destroy_universe', params: {} })
    ).toThrow()
  })

  it('rejects missing params', () => {
    expect(() => parseModifyArgs({ action: 'add_place' })).toThrow()
  })

  it('rejects missing action', () => {
    expect(() => parseModifyArgs({ params: {} })).toThrow()
  })

  it('produces a ModelCommand payload from a parsed action', () => {
    const result = executeModify({
      action: 'rename_element',
      params: { element_id: 'p1', name: 'NewName' },
    })

    expect(result.isError).toBeFalsy()
    const payload = JSON.parse(result.content[0].text)
    expect(payload.command).toEqual({
      type: 'rename_element',
      params: { element_id: 'p1', name: 'NewName' },
    })
    expect(payload.message).toContain('rename_element')
  })

  it('supports all declared actions', () => {
    const actions = [
      'add_place',
      'add_transition',
      'add_arc',
      'remove_element',
      'rename_element',
      'set_tokens',
    ]

    for (const action of actions) {
      expect(() => parseModifyArgs({ action, params: {} })).not.toThrow()
    }
  })
})
