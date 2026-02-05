import type { PetriNet, Arc } from '@/types/petri-net'
import type { NetStatistics } from '@/types/analysis'

/**
 * Computes statistics about a Petri net
 */
export function computeStatistics(net: PetriNet): NetStatistics {
  // Get all node IDs
  const placeIds = net.places.map((p) => p.id)
  const transitionIds = [...net.transitions.map((t) => t.id), ...net.operators.map((o) => o.id)]

  // Find source places (no incoming arcs)
  const sourcePlaces = placeIds.filter((id) => {
    return !net.arcs.some((arc) => arc.targetId === id)
  })

  // Find sink places (no outgoing arcs)
  const sinkPlaces = placeIds.filter((id) => {
    return !net.arcs.some((arc) => arc.sourceId === id)
  })

  // Find source transitions (no incoming arcs)
  const sourceTransitions = transitionIds.filter((id) => {
    return !net.arcs.some((arc) => arc.targetId === id)
  })

  // Find sink transitions (no outgoing arcs)
  const sinkTransitions = transitionIds.filter((id) => {
    return !net.arcs.some((arc) => arc.sourceId === id)
  })

  // Calculate total tokens
  const totalTokens = net.places.reduce((sum, place) => sum + place.tokens, 0)

  // Check if strongly connected
  const stronglyConnected = checkStronglyConnected(net)

  // Check structural properties
  const freeChoice = checkFreeChoice(net)
  const stateMachine = checkStateMachine(net)
  const markedGraph = checkMarkedGraph(net)

  return {
    places: net.places.length,
    transitions: net.transitions.length + net.operators.length,
    arcs: net.arcs.length,
    operators: net.operators.length,
    totalTokens,
    sourcePlaces,
    sinkPlaces,
    sourceTransitions,
    sinkTransitions,
    stronglyConnected,
    freeChoice,
    stateMachine,
    markedGraph,
  }
}

/**
 * Check if the net is strongly connected (considering the t* closure)
 * For workflow nets, we add an arc from sink to source to check
 */
function checkStronglyConnected(net: PetriNet): boolean {
  if (net.places.length === 0 || (net.transitions.length === 0 && net.operators.length === 0)) {
    return false
  }

  // Build adjacency list
  const adjacency = buildAdjacencyList(net)
  const allNodes = [
    ...net.places.map((p) => p.id),
    ...net.transitions.map((t) => t.id),
    ...net.operators.map((o) => o.id),
  ]

  if (allNodes.length === 0) return false

  // Check if we can reach all nodes from the first node
  const reachable = bfsReachable(adjacency, allNodes[0])
  if (reachable.size !== allNodes.length) return false

  // Check if all nodes can reach the first node (reverse direction)
  const reverseAdjacency = buildReverseAdjacencyList(net)
  const reverseReachable = bfsReachable(reverseAdjacency, allNodes[0])

  return reverseReachable.size === allNodes.length
}

/**
 * Build adjacency list from arcs
 */
function buildAdjacencyList(net: PetriNet): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>()

  // Initialize all nodes
  for (const place of net.places) {
    adjacency.set(place.id, new Set())
  }
  for (const transition of net.transitions) {
    adjacency.set(transition.id, new Set())
  }
  for (const operator of net.operators) {
    adjacency.set(operator.id, new Set())
  }

  // Add edges
  for (const arc of net.arcs) {
    const neighbors = adjacency.get(arc.sourceId)
    if (neighbors) {
      neighbors.add(arc.targetId)
    }
  }

  return adjacency
}

/**
 * Build reverse adjacency list
 */
function buildReverseAdjacencyList(net: PetriNet): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>()

  // Initialize all nodes
  for (const place of net.places) {
    adjacency.set(place.id, new Set())
  }
  for (const transition of net.transitions) {
    adjacency.set(transition.id, new Set())
  }
  for (const operator of net.operators) {
    adjacency.set(operator.id, new Set())
  }

  // Add reverse edges
  for (const arc of net.arcs) {
    const neighbors = adjacency.get(arc.targetId)
    if (neighbors) {
      neighbors.add(arc.sourceId)
    }
  }

  return adjacency
}

/**
 * BFS to find all reachable nodes
 */
function bfsReachable(adjacency: Map<string, Set<string>>, start: string): Set<string> {
  const visited = new Set<string>()
  const queue = [start]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current)) continue

    visited.add(current)
    const neighbors = adjacency.get(current)
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor)
        }
      }
    }
  }

  return visited
}

/**
 * Check if the net is a free-choice net
 * A net is free-choice if for every arc (p, t), p has only one outgoing arc or t has only one incoming arc
 */
function checkFreeChoice(net: PetriNet): boolean {
  for (const arc of net.arcs) {
    // Only check arcs from places to transitions
    const isFromPlace = net.places.some((p) => p.id === arc.sourceId)
    if (!isFromPlace) continue

    const outgoingFromPlace = net.arcs.filter((a) => a.sourceId === arc.sourceId)
    const incomingToTransition = net.arcs.filter((a) => a.targetId === arc.targetId)

    if (outgoingFromPlace.length > 1 && incomingToTransition.length > 1) {
      return false
    }
  }
  return true
}

/**
 * Check if the net is a state machine
 * A net is a state machine if every transition has exactly one input and one output place
 */
function checkStateMachine(net: PetriNet): boolean {
  const allTransitions = [...net.transitions, ...net.operators]

  for (const transition of allTransitions) {
    const incoming = net.arcs.filter((a) => a.targetId === transition.id)
    const outgoing = net.arcs.filter((a) => a.sourceId === transition.id)

    if (incoming.length !== 1 || outgoing.length !== 1) {
      return false
    }
  }

  return allTransitions.length > 0
}

/**
 * Check if the net is a marked graph
 * A net is a marked graph if every place has exactly one input and one output transition
 */
function checkMarkedGraph(net: PetriNet): boolean {
  for (const place of net.places) {
    const incoming = net.arcs.filter((a) => a.targetId === place.id)
    const outgoing = net.arcs.filter((a) => a.sourceId === place.id)

    if (incoming.length !== 1 || outgoing.length !== 1) {
      return false
    }
  }

  return net.places.length > 0
}

/**
 * Get incoming arcs for a node
 */
export function getIncomingArcs(net: PetriNet, nodeId: string): Arc[] {
  return net.arcs.filter((arc) => arc.targetId === nodeId)
}

/**
 * Get outgoing arcs for a node
 */
export function getOutgoingArcs(net: PetriNet, nodeId: string): Arc[] {
  return net.arcs.filter((arc) => arc.sourceId === nodeId)
}

/**
 * Get all predecessor nodes
 */
export function getPredecessors(net: PetriNet, nodeId: string): string[] {
  return net.arcs.filter((arc) => arc.targetId === nodeId).map((arc) => arc.sourceId)
}

/**
 * Get all successor nodes
 */
export function getSuccessors(net: PetriNet, nodeId: string): string[] {
  return net.arcs.filter((arc) => arc.sourceId === nodeId).map((arc) => arc.targetId)
}
