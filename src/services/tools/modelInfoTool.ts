import { modelSerializer } from '@/services/modelSerializer'

export const modelInfoTool = {
  definition: {
    type: 'function' as const,
    function: {
      name: 'get_model_info',
      description:
        'Get metadata and statistics about the current Petri net model, including number of places, transitions, arcs, operator types, and element names.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },

  execute(): string {
    const summary = modelSerializer.getModelSummary()
    const elements = modelSerializer.getModelElements()
    return JSON.stringify({ ...summary, elements })
  },
}
