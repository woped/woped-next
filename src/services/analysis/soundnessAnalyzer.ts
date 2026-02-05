import type { PetriNet } from '@/types/petri-net'
import type { AnalysisResult, AnalysisIssue, CoverabilityGraph, CoverabilityNode, CoverabilityEdge } from '@/types/analysis'
import { IssueCodes } from '@/types/analysis'
import { computeStatistics } from './statistics'

// Maximum number of states to explore to prevent infinite loops
const MAX_STATES = 1000

/**
 * Analyzes soundness of a Petri net
 * A workflow net is sound if:
 * 1. Option to complete: For every reachable marking, the final marking is reachable
 * 2. Proper completion: When final marking is reached, only the sink place has a token
 * 3. No dead transitions: Every transition can fire in some reachable marking
 */
export function analyzeSoundness(net: PetriNet): AnalysisResult {
  const startTime = performance.now()
  const issues: AnalysisIssue[] = []
  const statistics = computeStatistics(net)

  // Check for empty net
  if (net.places.length === 0) {
    issues.push({
      severity: 'error',
      code: IssueCodes.ST001,
      message: 'Cannot analyze soundness of an empty net',
      affectedElements: [],
    })

    return {
      timestamp: Date.now(),
      type: 'soundness',
      valid: false,
      issues,
      statistics,
      duration: performance.now() - startTime,
    }
  }

  // Get initial marking
  const initialMarking = getInitialMarking(net)

  // Build coverability graph
  const graph = buildCoverabilityGraph(net, initialMarking)

  // Check for unbounded places
  const unboundedPlaces = findUnboundedPlaces(graph, net)
  if (unboundedPlaces.length > 0) {
    issues.push({
      severity: 'warning',
      code: IssueCodes.SN003,
      message: `Found ${unboundedPlaces.length} unbounded place(s). The net may produce infinite tokens.`,
      affectedElements: unboundedPlaces,
      details: 'Unbounded places are marked with ω (omega) in the coverability graph.',
    })
  }

  // Check for deadlocks
  if (graph.deadlockNodes.length > 0) {
    // Check if any deadlock is not the final marking
    const nonFinalDeadlocks = graph.nodes.filter(
      (n) => n.isDeadlock && !n.isFinal
    )

    if (nonFinalDeadlocks.length > 0) {
      issues.push({
        severity: 'error',
        code: IssueCodes.SN001,
        message: `Found ${nonFinalDeadlocks.length} deadlock state(s) that are not the final marking.`,
        affectedElements: nonFinalDeadlocks.map((n) => n.id),
        details:
          'A deadlock occurs when no transition can fire but the sink place does not have the only token.',
      })
    }
  }

  // Check for dead transitions
  const firedTransitions = new Set<string>()
  for (const edge of graph.edges) {
    firedTransitions.add(edge.transitionId)
  }

  const allTransitions = [
    ...net.transitions.map((t) => t.id),
    ...net.operators.map((o) => o.id),
  ]

  const deadTransitions = allTransitions.filter((t) => !firedTransitions.has(t))
  if (deadTransitions.length > 0) {
    issues.push({
      severity: 'error',
      code: IssueCodes.SN002,
      message: `Found ${deadTransitions.length} dead transition(s) that can never fire.`,
      affectedElements: deadTransitions,
      details:
        'Dead transitions indicate unreachable parts of the workflow or modeling errors.',
    })
  }

  // Check option to complete
  const hasOptionToComplete = checkOptionToComplete(graph, statistics.sinkPlaces)
  if (!hasOptionToComplete) {
    issues.push({
      severity: 'error',
      code: IssueCodes.SN004,
      message: 'Not all reachable states have an option to complete.',
      affectedElements: [],
      details:
        'Some execution paths cannot reach the final marking. Check for loops without exits.',
    })
  }

  // Summary info
  issues.push({
    severity: 'info',
    code: IssueCodes.ST003,
    message: `Explored ${graph.nodes.length} states and ${graph.edges.length} transitions.`,
    affectedElements: [],
  })

  if (graph.bounded) {
    issues.push({
      severity: 'info',
      code: IssueCodes.ST003,
      message: 'The net is bounded (finite state space).',
      affectedElements: [],
    })
  }

  const endTime = performance.now()
  const valid = issues.filter((i) => i.severity === 'error').length === 0

  return {
    timestamp: Date.now(),
    type: 'soundness',
    valid,
    issues,
    statistics,
    duration: endTime - startTime,
  }
}

/**
 * Get initial marking from net
 */
function getInitialMarking(net: PetriNet): Record<string, number> {
  const marking: Record<string, number> = {}
  for (const place of net.places) {
    if (place.tokens > 0) {
      marking[place.id] = place.tokens
    }
  }
  return marking
}

/**
 * Build coverability graph
 */
export function buildCoverabilityGraph(
  net: PetriNet,
  initialMarking: Record<string, number>
): CoverabilityGraph {
  const nodes: CoverabilityNode[] = []
  const edges: CoverabilityEdge[] = []
  const visited = new Map<string, CoverabilityNode>()

  // Find sink places for final marking check
  const sinkPlaces = net.places.filter(
    (p) => !net.arcs.some((arc) => arc.sourceId === p.id)
  )

  // Create initial node
  const initial: CoverabilityNode = {
    id: 'M0',
    marking: { ...initialMarking },
    isDeadlock: false,
    isInitial: true,
    isFinal: checkFinalMarking(initialMarking, sinkPlaces.map((p) => p.id)),
  }

  nodes.push(initial)
  visited.set(markingKey(initial.marking), initial)

  const queue = [initial]
  let stateCount = 0

  while (queue.length > 0 && stateCount < MAX_STATES) {
    const current = queue.shift()!
    stateCount++

    // Get enabled transitions
    const enabled = getEnabledTransitions(net, current.marking)

    if (enabled.length === 0) {
      current.isDeadlock = true
    }

    for (const transitionId of enabled) {
      const newMarking = fireTransition(net, current.marking, transitionId)

      // Check for omega (unboundedness)
      checkAndApplyOmega(newMarking, nodes, current)

      const key = markingKey(newMarking)
      let targetNode = visited.get(key)

      if (!targetNode) {
        targetNode = {
          id: `M${nodes.length}`,
          marking: newMarking,
          parentId: current.id,
          firedTransition: transitionId,
          isDeadlock: false,
          isInitial: false,
          isFinal: checkFinalMarking(newMarking, sinkPlaces.map((p) => p.id)),
        }
        nodes.push(targetNode)
        visited.set(key, targetNode)
        queue.push(targetNode)
      }

      // Get transition name
      const transition =
        net.transitions.find((t) => t.id === transitionId) ||
        net.operators.find((o) => o.id === transitionId)

      edges.push({
        from: current.id,
        to: targetNode.id,
        transitionId,
        transitionName: transition?.name || transitionId,
      })
    }
  }

  return {
    nodes,
    edges,
    bounded: !hasOmega(nodes),
    deadlockNodes: nodes.filter((n) => n.isDeadlock).map((n) => n.id),
    reachableFinalStates: nodes.filter((n) => n.isFinal).length,
  }
}

/**
 * Get enabled transitions for a marking
 */
function getEnabledTransitions(
  net: PetriNet,
  marking: Record<string, number | 'omega'>
): string[] {
  const enabled: string[] = []
  const allTransitions = [...net.transitions, ...net.operators]

  for (const transition of allTransitions) {
    if (isTransitionEnabled(net, marking, transition.id)) {
      enabled.push(transition.id)
    }
  }

  return enabled
}

/**
 * Check if a transition is enabled
 */
function isTransitionEnabled(
  net: PetriNet,
  marking: Record<string, number | 'omega'>,
  transitionId: string
): boolean {
  const inputArcs = net.arcs.filter((arc) => arc.targetId === transitionId)

  // Must have at least one input arc
  if (inputArcs.length === 0) return false

  for (const arc of inputArcs) {
    const tokens = marking[arc.sourceId] ?? 0
    if (tokens === 'omega') continue // Omega means infinite
    if (tokens < arc.weight) return false
  }

  return true
}

/**
 * Fire a transition and return new marking
 */
function fireTransition(
  net: PetriNet,
  marking: Record<string, number | 'omega'>,
  transitionId: string
): Record<string, number | 'omega'> {
  const newMarking: Record<string, number | 'omega'> = { ...marking }

  const inputArcs = net.arcs.filter((arc) => arc.targetId === transitionId)
  const outputArcs = net.arcs.filter((arc) => arc.sourceId === transitionId)

  // Remove tokens from input places
  for (const arc of inputArcs) {
    const current = newMarking[arc.sourceId]
    if (current === 'omega') continue
    const newVal = (current ?? 0) - arc.weight
    if (newVal > 0) {
      newMarking[arc.sourceId] = newVal
    } else {
      delete newMarking[arc.sourceId]
    }
  }

  // Add tokens to output places
  for (const arc of outputArcs) {
    const current = newMarking[arc.targetId]
    if (current === 'omega') continue
    newMarking[arc.targetId] = ((current as number) ?? 0) + arc.weight
  }

  return newMarking
}

/**
 * Check and apply omega for unboundedness
 */
function checkAndApplyOmega(
  marking: Record<string, number | 'omega'>,
  nodes: CoverabilityNode[],
  current: CoverabilityNode
): void {
  // Find ancestor with strictly smaller marking
  let ancestor: CoverabilityNode | undefined = current

  while (ancestor) {
    const ancestorMarking = ancestor.marking
    let isSmaller = false
    let allLessOrEqual = true

    for (const placeId in marking) {
      const ancestorVal = ancestorMarking[placeId] ?? 0
      const currentVal = marking[placeId] ?? 0

      if (ancestorVal === 'omega' || currentVal === 'omega') {
        continue
      }

      if (ancestorVal < currentVal) {
        isSmaller = true
      } else if (ancestorVal > currentVal) {
        allLessOrEqual = false
        break
      }
    }

    for (const placeId in ancestorMarking) {
      if (!(placeId in marking)) {
        const ancestorVal = ancestorMarking[placeId]
        if (ancestorVal !== 'omega' && ancestorVal > 0) {
          allLessOrEqual = false
          break
        }
      }
    }

    if (allLessOrEqual && isSmaller) {
      // Apply omega for places that increased
      for (const placeId in marking) {
        const ancestorVal = ancestorMarking[placeId] ?? 0
        const currentVal = marking[placeId]

        if (
          ancestorVal !== 'omega' &&
          currentVal !== 'omega' &&
          currentVal > ancestorVal
        ) {
          marking[placeId] = 'omega'
        }
      }
      return
    }

    // Move to parent
    ancestor = ancestor.parentId
      ? nodes.find((n) => n.id === ancestor!.parentId)
      : undefined
  }
}

/**
 * Check if any node has omega
 */
function hasOmega(nodes: CoverabilityNode[]): boolean {
  for (const node of nodes) {
    for (const val of Object.values(node.marking)) {
      if (val === 'omega') return true
    }
  }
  return false
}

/**
 * Find places that become unbounded
 */
function findUnboundedPlaces(
  graph: CoverabilityGraph,
  net: PetriNet
): string[] {
  const unbounded = new Set<string>()

  for (const node of graph.nodes) {
    for (const [placeId, val] of Object.entries(node.marking)) {
      if (val === 'omega') {
        unbounded.add(placeId)
      }
    }
  }

  return [...unbounded]
}

/**
 * Check if marking is a final marking
 */
function checkFinalMarking(
  marking: Record<string, number | 'omega'>,
  sinkPlaceIds: string[]
): boolean {
  if (sinkPlaceIds.length === 0) return false

  // Check if only sink places have tokens
  for (const [placeId, tokens] of Object.entries(marking)) {
    if (tokens === 'omega') return false
    if (tokens > 0 && !sinkPlaceIds.includes(placeId)) {
      return false
    }
  }

  // Check if at least one sink place has a token
  for (const sinkId of sinkPlaceIds) {
    if ((marking[sinkId] ?? 0) > 0) {
      return true
    }
  }

  return false
}

/**
 * Check option to complete
 */
function checkOptionToComplete(
  graph: CoverabilityGraph,
  sinkPlaces: string[]
): boolean {
  if (graph.nodes.length === 0) return true
  if (sinkPlaces.length === 0) return true

  // Check if all non-final deadlocks exist
  const finalNodes = graph.nodes.filter((n) => n.isFinal)
  if (finalNodes.length === 0) return false

  // Simple check: if there are deadlocks that are not final, return false
  for (const node of graph.nodes) {
    if (node.isDeadlock && !node.isFinal) {
      return false
    }
  }

  return true
}

/**
 * Create a unique key for a marking
 */
function markingKey(marking: Record<string, number | 'omega'>): string {
  const entries = Object.entries(marking)
    .filter(([_, v]) => v !== 0)
    .sort(([a], [b]) => a.localeCompare(b))
  return JSON.stringify(entries)
}
