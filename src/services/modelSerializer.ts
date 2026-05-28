import { usePetriNetStore } from '@/stores/petriNet'
import type { ModelSummary } from '@/types/chat'
import { PNMLWriter } from '@/services/file/pnmlWriter'
import type { ExportOptions } from '@/types/file-formats'
import { normalizePetriNet } from '@/utils/petriNetNormalize'

export const modelSerializer = {
  getModelSummary(): ModelSummary {
    const store = usePetriNetStore()
    const rawNet = store.net

    if (!rawNet) {
      return {
        placesCount: 0,
        transitionsCount: 0,
        arcsCount: 0,
        operatorTypes: [],
        hasSubprocesses: false,
        elementNames: [],
      }
    }

    const { net } = normalizePetriNet(rawNet)

    const elementNames: string[] = []
    net.places.forEach((p) => elementNames.push(p.name || p.id))
    net.transitions.forEach((t) => elementNames.push(t.name || t.id))
    net.operators.forEach((o) => elementNames.push(o.name || o.id))

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
    const rawNet = store.net

    if (!rawNet) return ''

    const { net } = normalizePetriNet(rawNet)

    const writer = new PNMLWriter()
    const options: ExportOptions = {
      format: 'pnml',
      includeLayout: true,
      includeMetadata: false,
    }
    return writer.write(net, options)
  },

  getModelElements(): Array<{ id: string; name: string; type: string }> {
    const store = usePetriNetStore()
    const rawNet = store.net
    if (!rawNet) return []

    const { net } = normalizePetriNet(rawNet)
    const elements: Array<{ id: string; name: string; type: string }> = []
    net.places.forEach((p) => elements.push({ id: p.id, name: p.name || p.id, type: 'place' }))
    net.transitions.forEach((t) =>
      elements.push({ id: t.id, name: t.name || t.id, type: 'transition' }),
    )
    net.operators.forEach((o) =>
      elements.push({ id: o.id, name: o.name || o.id, type: 'operator' }),
    )
    net.subProcesses.forEach((s) =>
      elements.push({ id: s.id, name: s.name || s.id, type: 'subprocess' }),
    )
    return elements
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
