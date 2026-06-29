import type { OperatorType, Position } from '@/types/petri-net'
import { OperatorType as OT } from '@/types/petri-net'

/**
 * Side of the operator rectangle on which an arrow glyph is drawn.
 * Mirrors the legacy WoPeD `Toolspecific.OperatorPosition` enum (N/E/S/W).
 */
export type OperatorGlyphPosition = 'north' | 'east' | 'south' | 'west'

/**
 * Direction of the arrow glyph.
 * - 'in'  = join (arrow points into the box, n -> 1)
 * - 'out' = split (arrow points out of the box, 1 -> n)
 * Mirrors the legacy `Toolspecific.OperatorDirection` enum (IN/OUT).
 */
export type OperatorGlyphDirection = 'in' | 'out'

/** Box dimensions used to compute glyph geometry in local coordinates. */
export interface GlyphBox {
  width: number
  height: number
  border: number
}

/** Resolved geometry of a single chevron arrow in local box coordinates. */
export interface ChevronGeometry {
  /** Flat polygon point list [x0, y0, x1, y1, ...] for the chevron outline. */
  polygon: number[]
  /** Optional divider line [x0, y0, x1, y1] drawn for split (out) glyphs. */
  line: number[] | null
}

/** A glyph to render: the side it sits on and its arrow direction. */
export interface OperatorGlyph {
  position: OperatorGlyphPosition
  direction: OperatorGlyphDirection
}

/** Orientation of an operator: which side joins inputs and which side splits outputs. */
export interface OperatorOrientation {
  joinPosition: OperatorGlyphPosition
  splitPosition: OperatorGlyphPosition
}

/**
 * Return the opposite side of the rectangle.
 */
export function oppositePosition(position: OperatorGlyphPosition): OperatorGlyphPosition {
  switch (position) {
    case 'north':
      return 'south'
    case 'south':
      return 'north'
    case 'east':
      return 'west'
    case 'west':
      return 'east'
  }
}

/** Return the opposite arrow direction (mirrors the legacy `getOperatorOppositeDirection`). */
export function oppositeDirection(direction: OperatorGlyphDirection): OperatorGlyphDirection {
  return direction === 'in' ? 'out' : 'in'
}

/**
 * Snap an arbitrary direction vector to the nearest cardinal side (N/E/S/W).
 * A zero-ish vector defaults to 'east' (left-to-right flow).
 */
export function snapToCardinal(dx: number, dy: number): OperatorGlyphPosition {
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return 'east'
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'east' : 'west'
  }
  return dy >= 0 ? 'south' : 'north'
}

/**
 * Compute the operator orientation from the positions of connected neighbours.
 *
 * The split side faces where outputs flow to; the join side is the opposite.
 * Falls back to a horizontal left-to-right layout (join=west, split=east) when
 * there is not enough connectivity information.
 *
 * @param center        operator centre position
 * @param incomingFrom  positions of source elements of incoming arcs
 * @param outgoingTo    positions of target elements of outgoing arcs
 */
export function getOperatorOrientation(
  center: Position,
  incomingFrom: Position[],
  outgoingTo: Position[],
): OperatorOrientation {
  const avg = (points: Position[]): Position | null => {
    if (points.length === 0) return null
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 })
    return { x: sum.x / points.length, y: sum.y / points.length }
  }

  const inAvg = avg(incomingFrom)
  const outAvg = avg(outgoingTo)

  // Flow vector: from where inputs come towards where outputs go.
  let flowX = 0
  let flowY = 0
  if (inAvg && outAvg) {
    flowX = outAvg.x - inAvg.x
    flowY = outAvg.y - inAvg.y
  } else if (outAvg) {
    flowX = outAvg.x - center.x
    flowY = outAvg.y - center.y
  } else if (inAvg) {
    // Only inputs known: flow points away from them.
    flowX = center.x - inAvg.x
    flowY = center.y - inAvg.y
  }

  const splitPosition = snapToCardinal(flowX, flowY)
  return {
    splitPosition,
    joinPosition: oppositePosition(splitPosition),
  }
}

/**
 * Per-type glyph specification, ported 1:1 from the legacy WoPeD
 * `OperatorTransitionModel` constructor.
 *
 * Crucially, in the original notation the AND/XOR distinction is encoded by the
 * arrow *direction* (IN vs OUT), while the split/join distinction is encoded by
 * the *side* the arrow sits on (split = flow-forward side, join = backward side):
 *
 * - AND-split = (split side, IN)   -> arrow points inwards
 * - XOR-split = (split side, OUT)  -> arrow points outwards
 * - AND-join  = (join side, IN)
 * - XOR-join  = (join side, OUT)
 *
 * Combined operators anchor a primary glyph on the join side and add a second
 * glyph on the opposite side with the opposite direction (legacy
 * `getOperatorOppositePosition` / `getOperatorOppositeDirection`).
 */
interface GlyphSpec {
  /** Anchor side of the primary glyph. */
  side: 'split' | 'join'
  /** Arrow direction of the primary glyph. */
  direction: OperatorGlyphDirection
  /** Whether a second (opposite) glyph is added for combined operators. */
  combined: boolean
}

const OPERATOR_GLYPH_SPEC: Record<OperatorType, GlyphSpec> = {
  [OT.AND_SPLIT]: { side: 'split', direction: 'in', combined: false },
  [OT.AND_JOIN]: { side: 'join', direction: 'in', combined: false },
  [OT.XOR_SPLIT]: { side: 'split', direction: 'out', combined: false },
  [OT.XOR_JOIN]: { side: 'join', direction: 'out', combined: false },
  // Combined operators are anchored on the join side (legacy west_north).
  [OT.AND_SPLIT_JOIN]: { side: 'join', direction: 'in', combined: true },
  [OT.XOR_SPLIT_JOIN]: { side: 'join', direction: 'out', combined: true },
  [OT.AND_JOIN_XOR_SPLIT]: { side: 'join', direction: 'in', combined: true },
  [OT.XOR_JOIN_AND_SPLIT]: { side: 'join', direction: 'out', combined: true },
}

/**
 * Determine which glyphs an operator needs, replicating the legacy
 * position/direction assignment. Simple operators yield one glyph; combined
 * operators yield two (primary on the join side + opposite glyph on the split
 * side).
 *
 * Positions are resolved from the supplied orientation.
 */
export function getOperatorGlyphs(
  type: OperatorType,
  orientation: OperatorOrientation,
): OperatorGlyph[] {
  const spec = OPERATOR_GLYPH_SPEC[type]
  if (!spec) return []

  const basePosition =
    spec.side === 'split' ? orientation.splitPosition : orientation.joinPosition

  const glyphs: OperatorGlyph[] = [{ position: basePosition, direction: spec.direction }]

  if (spec.combined) {
    glyphs.push({
      position: oppositePosition(basePosition),
      direction: oppositeDirection(spec.direction),
    })
  }

  return glyphs
}

/**
 * Compute the chevron polygon (and optional divider line) for a single glyph in
 * local box coordinates (origin at the top-left of the operator rectangle).
 *
 * Ported from the legacy WoPeD `PetriNetElementView.drawOperatorArrow2` so the
 * rendering matches the original van der Aalst notation.
 */
export function chevronGeometry(
  box: GlyphBox,
  position: OperatorGlyphPosition,
  direction: OperatorGlyphDirection,
): ChevronGeometry {
  const w = box.width
  const h = box.height
  const bw = box.border
  const isIn = direction === 'in'

  switch (position) {
    case 'north':
      return isIn
        ? { polygon: [bw, bw, w / 2, h / 3, w - bw, bw, w - bw, h / 3, bw, h / 3], line: null }
        : {
            polygon: [bw, bw, w - bw, bw, w - bw, h / 3, w / 2, bw, bw, h / 3],
            line: [bw, h / 3, w - bw, h / 3],
          }
    case 'east':
      return isIn
        ? {
            polygon: [(w * 2) / 3, bw, w - bw, bw, (w * 2) / 3, h / 2, w - bw, h - bw, (w * 2) / 3, h - bw],
            line: null,
          }
        : {
            polygon: [(w * 2) / 3, bw, w - bw, bw, w - bw, h - bw, (w * 2) / 3, h - bw, w - bw, h / 2],
            line: [(w * 2) / 3, bw, (w * 2) / 3, h - bw],
          }
    case 'south':
      return isIn
        ? {
            polygon: [bw, (h * 2) / 3, w - bw, (h * 2) / 3, w - bw, h - bw, w / 2, (h * 2) / 3, bw, h - bw],
            line: null,
          }
        : {
            polygon: [bw, (h * 2) / 3, w / 2, h - bw, w - bw, (h * 2) / 3, w - bw, h - bw, bw, h - bw],
            line: [bw, (h * 2) / 3, w - bw, (h * 2) / 3],
          }
    case 'west':
      return isIn
        ? { polygon: [bw, bw, w / 3, bw, w / 3, h - bw, bw, h - bw, w / 3, h / 2], line: null }
        : {
            polygon: [bw, bw, w / 3, bw, bw, h / 2, w / 3, h - bw, bw, h - bw],
            line: [w / 3, bw, w / 3, h - bw],
          }
  }
}
