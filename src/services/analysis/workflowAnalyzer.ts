import type { PetriNet } from '@/types/petri-net'
import type { AnalysisResult, AnalysisIssue } from '@/types/analysis'
import { IssueCodes } from '@/types/analysis'
import { computeStatistics } from './statistics'

/**
 * Analyzes a Petri net to check if it's a valid workflow net
 */
export function analyzeWorkflow(net: PetriNet): AnalysisResult {
  const startTime = performance.now()
  const issues: AnalysisIssue[] = []
  const statistics = computeStatistics(net)

  // Check for empty net
  if (net.places.length === 0 && net.transitions.length === 0) {
    issues.push({
      severity: 'error',
      code: IssueCodes.ST001,
      message: 'The net is empty',
      messageKey: 'analysis.issues.wf.emptyNet',
      affectedElements: [],
    })
  }

  // Check for source places (exactly one required)
  if (statistics.sourcePlaces.length === 0) {
    issues.push({
      severity: 'error',
      code: IssueCodes.WF001,
      message: 'No source place found. A workflow net must have exactly one source place (place with no incoming arcs).',
      messageKey: 'analysis.issues.wf.noSource',
      affectedElements: [],
      details: 'Add a place with no incoming arcs as the start of your workflow.',
      detailsKey: 'analysis.issues.wf.noSourceDetails',
    })
  } else if (statistics.sourcePlaces.length > 1) {
    issues.push({
      severity: 'error',
      code: IssueCodes.WF001,
      message: `Multiple source places found (${statistics.sourcePlaces.length}). A workflow net must have exactly one source place.`,
      messageKey: 'analysis.issues.wf.multipleSource',
      messageParams: { count: statistics.sourcePlaces.length },
      affectedElements: statistics.sourcePlaces,
      details: 'Merge the source places or add a new common source.',
      detailsKey: 'analysis.issues.wf.multipleSourceDetails',
    })
  }

  // Check for sink places (exactly one required)
  if (statistics.sinkPlaces.length === 0) {
    issues.push({
      severity: 'error',
      code: IssueCodes.WF002,
      message: 'No sink place found. A workflow net must have exactly one sink place (place with no outgoing arcs).',
      messageKey: 'analysis.issues.wf.noSink',
      affectedElements: [],
      details: 'Add a place with no outgoing arcs as the end of your workflow.',
      detailsKey: 'analysis.issues.wf.noSinkDetails',
    })
  } else if (statistics.sinkPlaces.length > 1) {
    issues.push({
      severity: 'error',
      code: IssueCodes.WF002,
      message: `Multiple sink places found (${statistics.sinkPlaces.length}). A workflow net must have exactly one sink place.`,
      messageKey: 'analysis.issues.wf.multipleSink',
      messageParams: { count: statistics.sinkPlaces.length },
      affectedElements: statistics.sinkPlaces,
      details: 'Merge the sink places or add a new common sink.',
      detailsKey: 'analysis.issues.wf.multipleSinkDetails',
    })
  }

  // Check for source transitions (should be none in a proper workflow)
  if (statistics.sourceTransitions.length > 0) {
    issues.push({
      severity: 'warning',
      code: IssueCodes.WF003,
      message: `Found ${statistics.sourceTransitions.length} transition(s) with no input places.`,
      messageKey: 'analysis.issues.wf.sourceTransitions',
      messageParams: { count: statistics.sourceTransitions.length },
      affectedElements: statistics.sourceTransitions,
      details: 'All transitions should have at least one input place in a workflow net.',
      detailsKey: 'analysis.issues.wf.sourceTransitionsDetails',
    })
  }

  // Check for sink transitions (should be none in a proper workflow)
  if (statistics.sinkTransitions.length > 0) {
    issues.push({
      severity: 'warning',
      code: IssueCodes.WF003,
      message: `Found ${statistics.sinkTransitions.length} transition(s) with no output places.`,
      messageKey: 'analysis.issues.wf.sinkTransitions',
      messageParams: { count: statistics.sinkTransitions.length },
      affectedElements: statistics.sinkTransitions,
      details: 'All transitions should have at least one output place in a workflow net.',
      detailsKey: 'analysis.issues.wf.sinkTransitionsDetails',
    })
  }

  // Check connectivity
  if (!statistics.stronglyConnected && net.places.length > 0) {
    const disconnected = findDisconnectedElements(net)
    if (disconnected.length > 0) {
      issues.push({
        severity: 'error',
        code: IssueCodes.WF003,
        message: 'The net is not strongly connected. Some elements cannot be reached from the source.',
        messageKey: 'analysis.issues.wf.notStronglyConnected',
        affectedElements: disconnected,
        details:
          'Ensure all elements are connected. Add arcs or remove isolated elements.',
        detailsKey: 'analysis.issues.wf.notStronglyConnectedDetails',
      })
    }
  }

  // Check for isolated elements
  const isolated = findIsolatedElements(net)
  if (isolated.length > 0) {
    issues.push({
      severity: 'error',
      code: IssueCodes.WF004,
      message: `Found ${isolated.length} isolated element(s) with no connections.`,
      messageKey: 'analysis.issues.wf.isolated',
      messageParams: { count: isolated.length },
      affectedElements: isolated,
      details: 'Remove isolated elements or connect them to the workflow.',
      detailsKey: 'analysis.issues.wf.isolatedDetails',
    })
  }

  // Info about structural properties
  // Note: free-choice is reported under the Soundness section, not here.
  if (statistics.stateMachine) {
    issues.push({
      severity: 'info',
      code: IssueCodes.ST003,
      message: 'The net is a state machine (each transition has exactly one input and output).',
      messageKey: 'analysis.issues.wf.stateMachine',
      affectedElements: [],
    })
  }

  if (statistics.markedGraph) {
    issues.push({
      severity: 'info',
      code: IssueCodes.ST003,
      message: 'The net is a marked graph (each place has exactly one input and output).',
      messageKey: 'analysis.issues.wf.markedGraph',
      affectedElements: [],
    })
  }

  const endTime = performance.now()
  const valid = issues.filter((i) => i.severity === 'error').length === 0

  return {
    timestamp: Date.now(),
    type: 'workflow',
    valid,
    issues,
    statistics,
    duration: endTime - startTime,
  }
}

/**
 * Find elements that cannot be reached from source places
 */
function findDisconnectedElements(net: PetriNet): string[] {
  if (net.places.length === 0) return []

  const allNodes = new Set([
    ...net.places.map((p) => p.id),
    ...net.transitions.map((t) => t.id),
    ...net.operators.map((o) => o.id),
  ])

  // Build adjacency list
  const adjacency = new Map<string, Set<string>>()
  for (const id of allNodes) {
    adjacency.set(id, new Set())
  }
  for (const arc of net.arcs) {
    adjacency.get(arc.sourceId)?.add(arc.targetId)
  }

  // Find source places
  const sourcePlaces = net.places.filter(
    (p) => !net.arcs.some((arc) => arc.targetId === p.id)
  )

  if (sourcePlaces.length === 0) return []

  // BFS from all source places
  const reachable = new Set<string>()
  const queue = sourcePlaces.map((p) => p.id)

  while (queue.length > 0) {
    const current = queue.shift()!
    if (reachable.has(current)) continue

    reachable.add(current)
    const neighbors = adjacency.get(current)
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!reachable.has(neighbor)) {
          queue.push(neighbor)
        }
      }
    }
  }

  // Return unreachable nodes
  return [...allNodes].filter((id) => !reachable.has(id))
}

/**
 * Find completely isolated elements (no incoming or outgoing arcs)
 */
function findIsolatedElements(net: PetriNet): string[] {
  const isolated: string[] = []

  for (const place of net.places) {
    const hasIncoming = net.arcs.some((arc) => arc.targetId === place.id)
    const hasOutgoing = net.arcs.some((arc) => arc.sourceId === place.id)
    if (!hasIncoming && !hasOutgoing) {
      isolated.push(place.id)
    }
  }

  for (const transition of net.transitions) {
    const hasIncoming = net.arcs.some((arc) => arc.targetId === transition.id)
    const hasOutgoing = net.arcs.some((arc) => arc.sourceId === transition.id)
    if (!hasIncoming && !hasOutgoing) {
      isolated.push(transition.id)
    }
  }

  for (const operator of net.operators) {
    const hasIncoming = net.arcs.some((arc) => arc.targetId === operator.id)
    const hasOutgoing = net.arcs.some((arc) => arc.sourceId === operator.id)
    if (!hasIncoming && !hasOutgoing) {
      isolated.push(operator.id)
    }
  }

  return isolated
}
