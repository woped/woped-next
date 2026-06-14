import { z } from 'zod'
import type { McpTool, McpToolResult } from '@/types/mcp'
import type { ModelCommand } from '@/types/chat'

const MODIFY_ACTIONS = [
  'add_place',
  'add_transition',
  'add_arc',
  'remove_element',
  'rename_element',
  'set_tokens',
] as const

type ModifyAction = (typeof MODIFY_ACTIONS)[number]

export const modifyArgsSchema = z
  .object({
    action: z
      .string()
      .min(1, 'action is required')
      .refine((v): v is ModifyAction => (MODIFY_ACTIONS as readonly string[]).includes(v), {
        message: `action must be one of: ${MODIFY_ACTIONS.join(', ')}`,
      }),
    params: z.record(z.string(), z.unknown()),
  })
  .strict()

export type ModifyArgs = z.infer<typeof modifyArgsSchema>

export const modifyMcpTool: McpTool = {
  name: 'modify_model',
  description:
    'Generate a command to modify the current Petri net model. Supported actions: add_place, add_transition, add_arc, remove_element, rename_element, set_tokens.',
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', description: 'The modification action to perform' },
      params: {
        type: 'object',
        description: 'Parameters for the action',
        properties: {},
      },
    },
    required: ['action', 'params'],
    additionalProperties: false,
  },
}

export function parseModifyArgs(raw: unknown): ModifyArgs {
  return modifyArgsSchema.parse(raw ?? {})
}

export function executeModify(args: ModifyArgs): McpToolResult {
  const command: ModelCommand = {
    type: args.action as ModelCommand['type'],
    params: args.params,
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          { command, message: `Command prepared: ${args.action}` },
          null,
          2
        ),
      },
    ],
  }
}

