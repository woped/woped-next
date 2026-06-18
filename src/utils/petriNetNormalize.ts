import type { PetriNet, Arc } from '@/types/petri-net'

export interface NormalizePetriNetResult {
  net: PetriNet
  droppedArcs: number
}

/**
 * Ensures all PetriNet arrays exist and drops arcs with unknown endpoints.
 * Prevents "Cannot read properties of undefined (reading 'length')" on legacy/partial nets.
 */
export function normalizePetriNet(net: PetriNet): NormalizePetriNetResult {
  const normalized: PetriNet = {
    ...net,
    places: Array.isArray(net.places) ? net.places : [],
    transitions: Array.isArray(net.transitions) ? net.transitions : [],
    operators: Array.isArray(net.operators) ? net.operators : [],
    subProcesses: Array.isArray(net.subProcesses) ? net.subProcesses : [],
    arcs: Array.isArray(net.arcs) ? net.arcs : [],
  }

  const nodeIds = new Set<string>()
  for (const p of normalized.places) nodeIds.add(p.id)
  for (const t of normalized.transitions) nodeIds.add(t.id)
  for (const o of normalized.operators) nodeIds.add(o.id)
  for (const s of normalized.subProcesses) nodeIds.add(s.id)

  const validArcs: Arc[] = []
  let droppedArcs = 0

  for (const arc of normalized.arcs) {
    if (!arc?.sourceId || !arc?.targetId) {
      droppedArcs++
      continue
    }
    if (!nodeIds.has(arc.sourceId) || !nodeIds.has(arc.targetId)) {
      droppedArcs++
      continue
    }
    validArcs.push({
      ...arc,
      waypoints: Array.isArray(arc.waypoints) ? arc.waypoints : [],
      weight: arc.weight ?? 1,
    })
  }

  normalized.arcs = validArcs

  return { net: normalized, droppedArcs }
}

/**
 * Extract PNML XML from raw tool/LLM output (JSON wrapper, markdown fences, etc.).
 */
export function extractPnmlContent(raw: string): string {
  let content = raw.trim()
  if (!content) return ''

  if (content.startsWith('{')) {
    try {
      const parsed = JSON.parse(content) as { pnml?: string; result?: string }
      content = (parsed.pnml || parsed.result || content).trim()
    } catch {
      /* use as-is */
    }
  }

  const fenceMatch = content.match(/```(?:xml|pnml)?\s*\n?([\s\S]*?)```/i)
  if (fenceMatch) {
    content = fenceMatch[1].trim()
  } else {
    content = content.replace(/^```(?:xml|pnml)?\s*/i, '').replace(/\s*```$/i, '').trim()
  }

  const pnmlMatch = content.match(/<pnml[\s\S]*<\/pnml>/i)
  if (pnmlMatch) {
    return pnmlMatch[0]
  }

  const start = content.indexOf('<')
  const end = content.lastIndexOf('>')
  if (start !== -1 && end > start) {
    content = content.slice(start, end + 1)
  }

  return content.trim()
}
