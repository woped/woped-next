import { describe, expect, it } from 'vitest'
import { sanitizeSchemaForGemini } from '@/utils/geminiSchema'

describe('sanitizeSchemaForGemini', () => {
  it('removes additionalProperties from root and nested schemas', () => {
    const schema = {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'Action name' },
        params: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
          },
        },
      },
      required: ['action', 'params'],
      additionalProperties: false,
    }

    expect(sanitizeSchemaForGemini(schema)).toEqual({
      type: 'object',
      properties: {
        action: { type: 'string', description: 'Action name' },
        params: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      },
      required: ['action', 'params'],
    })
  })

  it('adds items for arrays and properties for bare objects', () => {
    const schema = {
      type: 'object',
      properties: {
        checks: {
          type: 'array',
          description: 'Checks to run',
        },
        params: {
          type: 'object',
          description: 'Action parameters',
        },
      },
    }

    expect(sanitizeSchemaForGemini(schema)).toEqual({
      type: 'object',
      properties: {
        checks: {
          type: 'array',
          description: 'Checks to run',
          items: { type: 'string' },
        },
        params: {
          type: 'object',
          description: 'Action parameters',
          properties: {},
        },
      },
    })
  })
})
