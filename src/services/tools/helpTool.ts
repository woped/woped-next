export const helpTool = {
  definition: {
    type: 'function' as const,
    function: {
      name: 'help_modeling',
      description:
        'Provide expert knowledge about Petri net modeling concepts, patterns, and best practices. Use this for questions about how to model specific behaviors.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description:
              'The modeling topic to explain (e.g., "parallelism", "choice", "loops", "soundness", "deadlock")',
          },
        },
        required: ['topic'],
      },
    },
  },

  execute(args: { topic: string }): string {
    const knowledge: Record<string, string> = {
      parallelism:
        'Parallelism in Petri nets is modeled using AND-split (fork) and AND-join (synchronization). An AND-split transition produces tokens in multiple output places simultaneously. An AND-join transition requires tokens in all input places before firing. In WoPeD, use AND-Split and AND-Join operators.',
      choice:
        'Choice (conflict/decision) is modeled using XOR-split and XOR-join. An XOR-split has multiple output arcs from a place — only one transition can fire (non-deterministic). XOR-join merges paths. In WoPeD, use XOR-Split and XOR-Join operators.',
      loops:
        'Loops are modeled by creating a cycle in the net. A backward arc from a place after a transition back to a place before it creates iteration. Be careful: loops can cause unboundedness if not properly controlled with tokens.',
      soundness:
        'A workflow net is sound if: (1) it always terminates (from any reachable marking, the final marking is reachable), (2) it terminates properly (when the end place has a token, all other places are empty), (3) there are no dead transitions (every transition can potentially fire).',
      deadlock:
        'A deadlock occurs when no transition is enabled (no transition can fire). Common causes: missing tokens, incorrect synchronization (AND-join waiting for tokens that never arrive), or resource conflicts. Check the coverability graph for deadlock states.',
      tokens:
        'Tokens represent resources, data, or control flow in a Petri net. The distribution of tokens across places is called a marking. Initial marking defines the starting state. Transitions consume tokens from input places and produce tokens in output places.',
      workflow:
        'A workflow net has one source place (no incoming arcs) and one sink place (no outgoing arcs). Every node is on a path from source to sink. Workflow nets model business processes and can be checked for soundness.',
      operators:
        'WoPeD operators are special transitions: AND-Split (parallel fork), AND-Join (synchronization), XOR-Split (exclusive choice), XOR-Join (simple merge). Combined operators also exist (AND-Split-Join, XOR-Split-Join).',
    }

    const topic = args.topic.toLowerCase()
    const matchedKey = Object.keys(knowledge).find(
      (key) => topic.includes(key) || key.includes(topic),
    )

    if (matchedKey) {
      return JSON.stringify({ explanation: knowledge[matchedKey] })
    }

    return JSON.stringify({
      explanation: `Petri nets are a mathematical modeling language for describing distributed systems. Key concepts include places (circles, hold tokens), transitions (rectangles, represent activities), and arcs (connect places to transitions and vice versa). The firing rule: a transition fires when all input places have enough tokens, consuming them and producing tokens in output places.`,
      note: `Topic "${args.topic}" matched general knowledge. For specific patterns, ask about: parallelism, choice, loops, soundness, deadlock, tokens, workflow, or operators.`,
    })
  },
}
