import type { Position } from '@/types/petri-net'

/**
 * Calculate orthogonal route between two points
 * Creates a path with 90-degree turns
 */
export function orthogonalRoute(
  source: Position,
  target: Position,
  sourceType: 'place' | 'transition' | 'subprocess',
  targetType: 'place' | 'transition' | 'subprocess'
): Position[] {
  const dx = target.x - source.x
  const dy = target.y - source.y

  // Simple orthogonal routing: go horizontal first, then vertical
  // Or vertical first if source is above/below target
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal first
    const midX = source.x + dx / 2
    return [
      source,
      { x: midX, y: source.y },
      { x: midX, y: target.y },
      target,
    ]
  } else {
    // Vertical first
    const midY = source.y + dy / 2
    return [
      source,
      { x: source.x, y: midY },
      { x: target.x, y: midY },
      target,
    ]
  }
}

/**
 * Calculate bezier control points for a curved arc
 */
export function bezierRoute(source: Position, target: Position): Position[] {
  const dx = target.x - source.x
  const dy = target.y - source.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance === 0) {
    return [source, { x: source.x, y: source.y - 30 }, target]
  }

  const curvature = 0.2
  const midX = (source.x + target.x) / 2
  const midY = (source.y + target.y) / 2

  const perpX = -dy / distance
  const perpY = dx / distance

  const offset = distance * curvature

  const cp1 = {
    x: midX + perpX * offset,
    y: midY + perpY * offset,
  }

  return [source, cp1, target]
}

/**
 * Convert bezier points to path string for SVG
 */
export function bezierToPath(points: Position[]): string {
  if (points.length < 3) {
    return `M ${points[0].x} ${points[0].y} L ${points[1]?.x || points[0].x} ${points[1]?.y || points[0].y}`
  }

  const [start, control, end] = points
  return `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`
}

/**
 * Convert orthogonal points to Konva line points array
 */
export function pointsToArray(points: Position[]): number[] {
  return points.flatMap((p) => [p.x, p.y])
}

/**
 * Calculate points along a bezier curve for rendering
 */
export function sampleBezierCurve(
  start: Position,
  control: Position,
  end: Position,
  segments: number = 20
): Position[] {
  const points: Position[] = []

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const invT = 1 - t

    // Quadratic bezier formula: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
    const x = invT * invT * start.x + 2 * invT * t * control.x + t * t * end.x
    const y = invT * invT * start.y + 2 * invT * t * control.y + t * t * end.y

    points.push({ x, y })
  }

  return points
}

/**
 * Get the last segment direction of a path (for arrow orientation)
 */
export function getPathEndDirection(points: Position[]): number {
  if (points.length < 2) return 0

  const lastPoint = points[points.length - 1]
  const prevPoint = points[points.length - 2]

  return Math.atan2(lastPoint.y - prevPoint.y, lastPoint.x - prevPoint.x)
}
