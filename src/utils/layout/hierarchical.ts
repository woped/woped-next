import dagre from 'dagre'
import type { PetriNet, Position } from '@/types/petri-net'
import { VISUAL } from '@/types/petri-net'
import type { LayoutOptions, LayoutResult, LayoutDirection } from './index'

/**
 * Map our direction to dagre rankdir
 */
function directionToRankdir(direction: LayoutDirection): string {
  const mapping: Record<LayoutDirection, string> = {
    LR: 'LR',
    TB: 'TB',
    RL: 'RL',
    BT: 'BT',
  }
  return mapping[direction]
}

/**
 * Hierarchical layout using Sugiyama algorithm (via dagre)
 */
export function hierarchicalLayout(net: PetriNet, options: LayoutOptions): LayoutResult {
  const positions = new Map<string, Position>()

  // Check if there are any elements
  const totalElements = net.places.length + net.transitions.length + net.operators.length
  if (totalElements === 0) {
    return {
      positions,
      success: true,
      message: 'No elements to layout',
    }
  }

  // Create dagre graph
  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: directionToRankdir(options.direction),
    nodesep: options.nodeSpacing,
    ranksep: options.rankSpacing,
    marginx: 50,
    marginy: 50,
  })
  g.setDefaultEdgeLabel(() => ({}))

  // Add places as nodes
  for (const place of net.places) {
    g.setNode(place.id, {
      width: VISUAL.place.radius * 2,
      height: VISUAL.place.radius * 2,
      type: 'place',
    })
  }

  // Add transitions as nodes
  for (const transition of net.transitions) {
    g.setNode(transition.id, {
      width: VISUAL.transition.width,
      height: VISUAL.transition.height,
      type: 'transition',
    })
  }

  // Add operators as nodes
  for (const operator of net.operators) {
    g.setNode(operator.id, {
      width: VISUAL.operator.size,
      height: VISUAL.operator.size,
      type: 'operator',
    })
  }

  // Add arcs as edges
  for (const arc of net.arcs) {
    g.setEdge(arc.sourceId, arc.targetId)
  }

  // Run the layout algorithm
  dagre.layout(g)

  // Extract positions
  g.nodes().forEach((nodeId) => {
    const node = g.node(nodeId)
    if (node) {
      positions.set(nodeId, {
        x: node.x,
        y: node.y,
      })
    }
  })

  return {
    positions,
    success: true,
    message: `Laid out ${totalElements} elements`,
  }
}
