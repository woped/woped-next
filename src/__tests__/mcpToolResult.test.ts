import { describe, expect, it } from 'vitest'
import {
  mcpToolResultToChatResult,
  mcpToolResultToText,
} from '@/services/mcp/mcpToolResult'
import type { ModelCommand, ToolCall } from '@/types/chat'
import type { McpToolResult } from '@/types/mcp'

describe('mcpToolResult helpers', () => {
  it('extracts text content', () => {
    const result: McpToolResult = {
      content: [{ type: 'text', text: 'hello' }],
    }

    expect(mcpToolResultToText(result)).toBe('hello')
  })

  it('combines multiple text blocks', () => {
    const result: McpToolResult = {
      content: [
        { type: 'text', text: 'hello' },
        { type: 'text', text: 'world' },
      ],
    }

    expect(mcpToolResultToText(result)).toBe('hello\nworld')
  })

  it('returns fallback text for empty error results', () => {
    const result: McpToolResult = {
      content: [],
      isError: true,
    }

    expect(mcpToolResultToText(result)).toBe('MCP tool execution failed.')
  })

  it('extracts import_net commands from PNML JSON', () => {
    const toolCall: ToolCall = {
      id: 'call-1',
      name: 't2p_convert',
      arguments: {},
    }
    const content = JSON.stringify({ pnml: '<pnml/>' })

    const result = mcpToolResultToChatResult(toolCall, {
      content: [{ type: 'text', text: content }],
    })

    expect(result.result.toolCallId).toBe('call-1')
    expect(result.result.content).toContain(content)
    expect(result.commands).toEqual([
      { type: 'import_net', params: { pnml: '<pnml/>' } },
    ])
  })

  it('extracts model commands from command JSON', () => {
    const toolCall: ToolCall = {
      id: 'call-1',
      name: 'modify_model',
      arguments: {},
    }
    const command: ModelCommand = {
      type: 'add_place',
      params: { name: 'Start' },
    }

    const result = mcpToolResultToChatResult(toolCall, {
      content: [{ type: 'text', text: JSON.stringify({ command }) }],
    })

    expect(result.commands).toEqual([command])
  })

  it('keeps non-JSON content as plain tool text', () => {
    const toolCall: ToolCall = {
      id: 'call-1',
      name: 'help_modeling',
      arguments: {},
    }

    const result = mcpToolResultToChatResult(toolCall, {
      content: [{ type: 'text', text: 'plain text result' }],
    })

    expect(result.result.content).toBe('plain text result')
    expect(result.commands).toEqual([])
  })
})
