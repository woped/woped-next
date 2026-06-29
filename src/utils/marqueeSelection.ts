import type { PetriNet, Position } from '@/types/petri-net'
import { VISUAL, getTransitionSize, getSubProcessSize } from '@/types/petri-net'

export interface Bounds {
  left: number
  top: number
  right: number
  bottom: number
}

type NodeType = 'place' | 'transition' | 'operator' | 'subprocess'
type OperatorNotation = 'vanDerAalst' | 'modern'

/** Normalize two corner points into axis-aligned bounds. */
export function normalizeBounds(x1: number, y1: number, x2: number, y2: number): Bounds {
  return {
    left: Math.min(x1, x2),
    top: Math.min(y1, y2),
    right: Math.max(x1, x2),
    bottom: Math.max(y1, y2),
  }
}

/** True when two axis-aligned rectangles overlap (touching counts). */
export function boundsIntersect(a: Bounds, b: Bounds): boolean {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom)
}

/** Bounding box of a canvas node in world coordinates (shape only, not labels). */
export function getNodeBounds(
  type: NodeType,
  position: Position,
  notation: OperatorNotation = 'modern',
): Bounds {
  const { x, y } = position

  switch (type) {
    case 'place': {
      const r = VISUAL.place.radius
      return { left: x - r, top: y - r, right: x + r, bottom: y + r }
    }
    case 'transition': {
      const { width, height } = getTransitionSize(notation)
      return {
        left: x - width / 2,
        top: y - height / 2,
        right: x + width / 2,
        bottom: y + height / 2,
      }
    }
    case 'operator': {
      const half = VISUAL.operator.size / 2
      return { left: x - half, top: y - half, right: x + half, bottom: y + half }
    }
    case 'subprocess': {
      const { width, height } = getSubProcessSize(notation)
      return {
        left: x - width / 2,
        top: y - height / 2,
        right: x + width / 2,
        bottom: y + height / 2,
      }
    }
  }
}

/** Collect node ids whose bounds intersect the marquee (arcs excluded). */
export function findElementsInMarquee(
  net: PetriNet,
  marquee: Bounds,
  notation: OperatorNotation = 'modern',
): string[] {
  const ids: string[] = []

  for (const place of net.places) {
    if (boundsIntersect(marquee, getNodeBounds('place', place.position, notation))) {
      ids.push(place.id)
    }
  }
  for (const transition of net.transitions) {
    if (boundsIntersect(marquee, getNodeBounds('transition', transition.position, notation))) {
      ids.push(transition.id)
    }
  }
  for (const operator of net.operators) {
    if (boundsIntersect(marquee, getNodeBounds('operator', operator.position, notation))) {
      ids.push(operator.id)
    }
  }
  for (const subprocess of net.subProcesses || []) {
    if (boundsIntersect(marquee, getNodeBounds('subprocess', subprocess.position, notation))) {
      ids.push(subprocess.id)
    }
  }

  return ids
}

/** Convert stage pointer position to world coordinates. */
export function screenToWorld(
  screenX: number,
  screenY: number,
  viewport: { x: number; y: number; scale: number },
): Position {
  return {
    x: (screenX - viewport.x) / viewport.scale,
    y: (screenY - viewport.y) / viewport.scale,
  }
}
