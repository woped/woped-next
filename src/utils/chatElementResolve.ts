import type { PetriNet } from '@/types/petri-net'

type NetElement = { id: string; name?: string }

function collectElements(net: PetriNet): NetElement[] {
  return [
    ...net.places,
    ...net.transitions,
    ...net.operators,
    ...net.subProcesses,
  ]
}

/**
 * Resolve an LLM-provided element reference (id or display name) to a net element id.
 */
export function resolveElementId(net: PetriNet, reference: unknown): string | null {
  if (reference == null) return null
  const ref = String(reference).trim()
  if (!ref) return null

  const elements = collectElements(net)

  const byId = elements.find((e) => e.id === ref)
  if (byId) return byId.id

  const lower = ref.toLowerCase()
  const byName = elements.filter((e) => (e.name || '').toLowerCase() === lower)
  if (byName.length === 1) return byName[0].id

  const byIdSuffix = elements.filter((e) => e.id.toLowerCase() === lower || e.id.toLowerCase().endsWith(lower))
  if (byIdSuffix.length === 1) return byIdSuffix[0].id

  return null
}

export function resolveArcEndpoints(
  net: PetriNet,
  params: Record<string, unknown>,
): { sourceId: string | null; targetId: string | null } {
  const sourceRef =
    params.source_id ?? params.sourceId ?? params.source_name ?? params.sourceName
  const targetRef =
    params.target_id ?? params.targetId ?? params.target_name ?? params.targetName

  return {
    sourceId: resolveElementId(net, sourceRef),
    targetId: resolveElementId(net, targetRef),
  }
}
