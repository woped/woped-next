import type { ModelCommand } from '@/types/chat'

export const modifyTool = {
  definition: {
    type: 'function' as const,
    function: {
      name: 'modify_model',
      description:
        'Generate a command to modify the current Petri net model. Supported actions: add_place, add_transition, add_arc, remove_element, rename_element, set_tokens.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'add_place',
              'add_transition',
              'add_arc',
              'remove_element',
              'rename_element',
              'set_tokens',
            ],
            description: 'The modification action to perform',
          },
          params: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Name for the new/renamed element' },
              element_id: { type: 'string', description: 'ID of the element to modify/remove' },
              source_id: { type: 'string', description: 'Source element ID (for arcs)' },
              target_id: { type: 'string', description: 'Target element ID (for arcs)' },
              tokens: { type: 'number', description: 'Number of tokens to set' },
              position: {
                type: 'object',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                },
                description: 'Position for the new element',
              },
            },
            description: 'Parameters for the action',
          },
        },
        required: ['action', 'params'],
      },
    },
  },

  execute(args: { action: string; params: Record<string, unknown> }): string {
    const command: ModelCommand = {
      type: args.action as ModelCommand['type'],
      params: args.params,
    }

    return JSON.stringify({
      command,
      message: `Command prepared: ${args.action}`,
    })
  },
}
