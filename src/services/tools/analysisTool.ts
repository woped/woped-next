import { usePetriNetStore } from '@/stores/petriNet'
import { analyzeWorkflow, analyzeSoundness } from '@/services/analysis'
import { normalizePetriNet } from '@/utils/petriNetNormalize'

export const analysisTool = {
  definition: {
    type: 'function' as const,
    function: {
      name: 'analyze_model',
      description:
        'Run structural and behavioral analysis on the current Petri net model. Returns information about soundness, workflow properties, dead transitions, and more.',
      parameters: {
        type: 'object',
        properties: {
          checks: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['workflow', 'soundness', 'all'],
            },
            description: 'Which analyses to run. Defaults to "all".',
          },
        },
        required: [],
      },
    },
  },

  execute(args: { checks?: string[] }): string {
    const store = usePetriNetStore()
    const rawNet = store.net

    if (!rawNet) {
      return JSON.stringify({ error: 'No active Petri net model' })
    }

    const { net } = normalizePetriNet(rawNet)
    const checks = Array.isArray(args.checks) ? args.checks : ['all']
    const results: Record<string, unknown> = {}

    if (checks.includes('all') || checks.includes('workflow')) {
      try {
        const workflowResult = analyzeWorkflow(net)
        results.workflow = workflowResult
      } catch (e) {
        results.workflow = { error: e instanceof Error ? e.message : 'Analysis failed' }
      }
    }

    if (checks.includes('all') || checks.includes('soundness')) {
      try {
        const soundnessResult = analyzeSoundness(net)
        results.soundness = soundnessResult
      } catch (e) {
        results.soundness = { error: e instanceof Error ? e.message : 'Analysis failed' }
      }
    }

    return JSON.stringify(results)
  },
}
