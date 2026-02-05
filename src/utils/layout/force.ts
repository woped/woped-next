import type { PetriNet, Position } from '@/types/petri-net'
import type { LayoutOptions, LayoutResult } from './index'

interface ForceNode {
  id: string
  x: number
  y: number
  vx: number
  vy: number
}

interface ForceLink {
  source: string
  target: string
}

/**
 * Simple force-directed layout
 * Uses spring-electric model with repulsion between nodes and attraction along edges
 */
export function forceDirectedLayout(net: PetriNet, options: LayoutOptions): LayoutResult {
  const positions = new Map<string, Position>()

  // Collect all elements
  const allElements = [
    ...net.places.map((p) => ({ id: p.id, position: p.position })),
    ...net.transitions.map((t) => ({ id: t.id, position: t.position })),
    ...net.operators.map((o) => ({ id: o.id, position: o.position })),
  ]

  if (allElements.length === 0) {
    return {
      positions,
      success: true,
      message: 'No elements to layout',
    }
  }

  // Initialize nodes with current or random positions
  const nodes: ForceNode[] = allElements.map((el, i) => ({
    id: el.id,
    x: el.position?.x ?? 100 + (i % 5) * 150,
    y: el.position?.y ?? 100 + Math.floor(i / 5) * 150,
    vx: 0,
    vy: 0,
  }))

  // Create node lookup
  const nodeMap = new Map<string, ForceNode>()
  nodes.forEach((n) => nodeMap.set(n.id, n))

  // Create links from arcs
  const links: ForceLink[] = net.arcs.map((arc) => ({
    source: arc.sourceId,
    target: arc.targetId,
  }))

  // Force simulation parameters
  const idealLength = options.nodeSpacing
  const repulsionStrength = 5000
  const attractionStrength = 0.05
  const damping = 0.9
  const iterations = 300
  const minDistance = 50

  // Run simulation
  for (let iter = 0; iter < iterations; iter++) {
    // Calculate repulsion forces between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i]
        const nodeB = nodes[j]

        const dx = nodeB.x - nodeA.x
        const dy = nodeB.y - nodeA.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1

        // Repulsion force (inverse square law)
        const force = repulsionStrength / (distance * distance)
        const fx = (dx / distance) * force
        const fy = (dy / distance) * force

        nodeA.vx -= fx
        nodeA.vy -= fy
        nodeB.vx += fx
        nodeB.vy += fy
      }
    }

    // Calculate attraction forces along edges
    for (const link of links) {
      const source = nodeMap.get(link.source)
      const target = nodeMap.get(link.target)

      if (!source || !target) continue

      const dx = target.x - source.x
      const dy = target.y - source.y
      const distance = Math.sqrt(dx * dx + dy * dy) || 1

      // Attraction force (Hooke's law)
      const displacement = distance - idealLength
      const force = displacement * attractionStrength
      const fx = (dx / distance) * force
      const fy = (dy / distance) * force

      source.vx += fx
      source.vy += fy
      target.vx -= fx
      target.vy -= fy
    }

    // Apply velocities and damping
    for (const node of nodes) {
      node.x += node.vx
      node.y += node.vy
      node.vx *= damping
      node.vy *= damping

      // Keep within bounds (prevent going too far negative)
      node.x = Math.max(minDistance, node.x)
      node.y = Math.max(minDistance, node.y)
    }
  }

  // Normalize positions to start from a reasonable origin
  const minX = Math.min(...nodes.map((n) => n.x))
  const minY = Math.min(...nodes.map((n) => n.y))
  const offsetX = 100 - minX
  const offsetY = 100 - minY

  // Extract final positions
  for (const node of nodes) {
    positions.set(node.id, {
      x: Math.round(node.x + offsetX),
      y: Math.round(node.y + offsetY),
    })
  }

  return {
    positions,
    success: true,
    message: `Laid out ${nodes.length} elements using force-directed algorithm`,
  }
}
