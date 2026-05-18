const P2T_ENDPOINT = '/p2t/generateText'

export const p2tTool = {
  definition: {
    type: 'function' as const,
    function: {
      name: 'p2t_describe',
      description:
        'Convert the current Petri net model (PNML) to a natural language description using the P2T service.',
      parameters: {
        type: 'object',
        properties: {
          pnml: {
            type: 'string',
            description: 'The PNML XML of the model to describe',
          },
        },
        required: ['pnml'],
      },
    },
  },

  async execute(args: { pnml: string }): Promise<string> {
    try {
      const response = await fetch(P2T_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: args.pnml,
      })

      if (!response.ok) {
        return JSON.stringify({
          error: `P2T service returned ${response.status}. The service may not be available.`,
        })
      }

      const text = await response.text()
      return JSON.stringify({ description: text })
    } catch (error) {
      return JSON.stringify({
        error: `P2T service unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  },
}
