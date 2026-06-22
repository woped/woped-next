import type { Position } from '@/types/petri-net'
import { VISUAL, getTransitionSize, getSubProcessSize } from '@/types/petri-net'

type OperatorNotation = 'vanDerAalst' | 'modern'

/**
 * Calculate distance between two points
 */
export function distance(p1: Position, p2: Position): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

/**
 * Calculate angle between two points in radians
 */
export function angle(from: Position, to: Position): number {
  return Math.atan2(to.y - from.y, to.x - from.x)
}

/**
 * Get point on circle edge given center, radius, and angle
 */
export function pointOnCircle(center: Position, radius: number, angle: number): Position {
  return {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  }
}

/**
 * Get point on rectangle edge given center, dimensions, and angle
 */
export function pointOnRectangle(
  center: Position,
  width: number,
  height: number,
  angle: number
): Position {
  const halfWidth = width / 2
  const halfHeight = height / 2

  // Normalize angle to [0, 2π]
  const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)

  // Calculate intersection with rectangle
  const tanAngle = Math.tan(normalizedAngle)
  const aspectRatio = halfHeight / halfWidth

  let x: number
  let y: number

  if (
    normalizedAngle < Math.atan(aspectRatio) ||
    normalizedAngle > 2 * Math.PI - Math.atan(aspectRatio)
  ) {
    // Right edge
    x = halfWidth
    y = halfWidth * tanAngle
  } else if (normalizedAngle < Math.PI - Math.atan(aspectRatio)) {
    // Bottom edge
    y = halfHeight
    x = halfHeight / tanAngle
  } else if (normalizedAngle < Math.PI + Math.atan(aspectRatio)) {
    // Left edge
    x = -halfWidth
    y = -halfWidth * tanAngle
  } else {
    // Top edge
    y = -halfHeight
    x = -halfHeight / tanAngle
  }

  return {
    x: center.x + x,
    y: center.y + y,
  }
}

/**
 * Calculate arc endpoints between elements (place, transition, subprocess)
 */
export function calculateArcEndpoints(
  sourcePos: Position,
  targetPos: Position,
  sourceType: 'place' | 'transition' | 'subprocess',
  targetType: 'place' | 'transition' | 'subprocess',
  notation: OperatorNotation = 'modern'
): { start: Position; end: Position } {
  const ang = angle(sourcePos, targetPos)
  const reverseAng = angle(targetPos, sourcePos)

  const transitionSize = getTransitionSize(notation)
  const subProcessSize = getSubProcessSize(notation)

  let start: Position
  let end: Position

  if (sourceType === 'place') {
    start = pointOnCircle(sourcePos, VISUAL.place.radius, ang)
  } else if (sourceType === 'subprocess') {
    start = pointOnRectangle(
      sourcePos,
      subProcessSize.width,
      subProcessSize.height,
      ang
    )
  } else {
    start = pointOnRectangle(
      sourcePos,
      transitionSize.width,
      transitionSize.height,
      ang
    )
  }

  if (targetType === 'place') {
    end = pointOnCircle(targetPos, VISUAL.place.radius, reverseAng)
  } else if (targetType === 'subprocess') {
    end = pointOnRectangle(
      targetPos,
      subProcessSize.width,
      subProcessSize.height,
      reverseAng
    )
  } else {
    end = pointOnRectangle(
      targetPos,
      transitionSize.width,
      transitionSize.height,
      reverseAng
    )
  }

  return { start, end }
}

/**
 * Calculate arrow head points
 */
export function calculateArrowHead(
  end: Position,
  angle: number,
  size: number = VISUAL.arc.arrowSize
): Position[] {
  const angle1 = angle + Math.PI - Math.PI / 6
  const angle2 = angle + Math.PI + Math.PI / 6

  return [
    end,
    {
      x: end.x + size * Math.cos(angle1),
      y: end.y + size * Math.sin(angle1),
    },
    {
      x: end.x + size * Math.cos(angle2),
      y: end.y + size * Math.sin(angle2),
    },
  ]
}

/**
 * Snap position to grid
 */
export function snapToGrid(position: Position, gridSize: number): Position {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  }
}

/**
 * Check if a point is inside a rectangle
 */
export function isPointInRect(
  point: Position,
  rectCenter: Position,
  width: number,
  height: number
): boolean {
  const halfWidth = width / 2
  const halfHeight = height / 2
  return (
    point.x >= rectCenter.x - halfWidth &&
    point.x <= rectCenter.x + halfWidth &&
    point.y >= rectCenter.y - halfHeight &&
    point.y <= rectCenter.y + halfHeight
  )
}

/**
 * Check if a point is inside a circle
 */
export function isPointInCircle(
  point: Position,
  center: Position,
  radius: number
): boolean {
  return distance(point, center) <= radius
}

/**
 * Get bounding box of all elements
 */
export function getBoundingBox(
  positions: Position[],
  padding: number = 50
): { x: number; y: number; width: number; height: number } | null {
  if (positions.length === 0) return null

  const xs = positions.map((p) => p.x)
  const ys = positions.map((p) => p.y)

  const minX = Math.min(...xs) - padding
  const maxX = Math.max(...xs) + padding
  const minY = Math.min(...ys) - padding
  const maxY = Math.max(...ys) + padding

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}
