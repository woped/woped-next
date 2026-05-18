const T2P_ENDPOINT = '/t2p-2.0/generate_pnml'

export const t2pTool = {
  definition: {
    type: 'function' as const,
    function: {
      name: 't2p_convert',
      description:
        'Convert natural language text to a Petri net (PNML format) using the T2P 2.0 service. Use this when the user wants to create a new Petri net from a process description.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Process description in natural language',
          },
          language: {
            type: 'string',
            enum: ['en', 'de'],
            description: 'Language of the text (defaults to en)',
          },
        },
        required: ['text'],
      },
    },
  },

  async execute(args: { text: string; language?: string }): Promise<string> {
    try {
      const response = await fetch(T2P_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: args.text,
          language: args.language || 'en',
        }),
      })

      if (!response.ok) {
        return JSON.stringify({
          error: `T2P service returned ${response.status}. The service may not be available.`,
        })
      }

      const data = await response.json()
      return JSON.stringify({ pnml: data.result || data.pnml || '' })
    } catch (error) {
      return JSON.stringify({
        error: `T2P service unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  },
}
