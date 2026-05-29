import { usePetriNetStore } from '@/stores/petriNet'
import type { ModelSummary } from '@/types/chat'
import { PNMLWriter } from '@/services/file/pnmlWriter'
import type { ExportOptions } from '@/types/file-formats'

export const modelSerializer = {
  getModelSummary(): ModelSummary {
    const store = usePetriNetStore()
    const net = store.net

    if (!net) {
      return {
        placesCount: 0,
        transitionsCount: 0,
        arcsCount: 0,
        operatorTypes: [],
        hasSubprocesses: false,
        elementNames: [],
      }
    }

    const elementNames: string[] = []
    net.places.forEach((p) => elementNames.push(p.name || p.id))
    net.transitions.forEach((t) => elementNames.push(t.name || t.id))

    const operatorTypes = net.operators.map((op) => op.operatorType)

    return {
      placesCount: net.places.length,
      transitionsCount: net.transitions.length,
      arcsCount: net.arcs.length,
      operatorTypes: [...new Set(operatorTypes)],
      hasSubprocesses: net.subProcesses.length > 0,
      elementNames,
    }
  },

  getModelPnml(): string {
    const store = usePetriNetStore()
    const net = store.net

    if (!net) return ''

    const writer = new PNMLWriter()
    const options: ExportOptions = {
      format: 'pnml',
      includeLayout: true,
      includeMetadata: false,
    }
    return writer.write(net, options)
  },

  getModelContext(): string {
    const summary = this.getModelSummary()

    if (summary.placesCount === 0 && summary.transitionsCount === 0) {
      return 'The model is currently empty.'
    }

    return [
      `Current model: ${summary.placesCount} places, ${summary.transitionsCount} transitions, ${summary.arcsCount} arcs.`,
      summary.operatorTypes.length > 0
        ? `Operators: ${summary.operatorTypes.join(', ')}.`
        : '',
      summary.hasSubprocesses ? 'Contains subprocesses.' : '',
      `Elements: ${summary.elementNames.slice(0, 20).join(', ')}${summary.elementNames.length > 20 ? '...' : ''}.`,
    ]
      .filter(Boolean)
      .join(' ')
  },
}
