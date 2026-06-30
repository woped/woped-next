import type { Trigger } from './triggers'

/**
 * Position interface for 2D coordinates
 */
export interface Position {
  x: number
  y: number
}

/**
 * Place (Stelle) in a Petri net - represented as a circle
 */
export interface Place {
  id: string
  name: string
  position: Position
  tokens: number
  capacity: number // -1 means unlimited
}

/**
 * Transition in a Petri net - represented as a rectangle
 */
export interface Transition {
  id: string
  name: string
  position: Position
  label?: string
  triggers?: Trigger[]
}

/**
 * Operator types for workflow nets
 */
export enum OperatorType {
  AND_SPLIT = 'and-split',
  AND_JOIN = 'and-join',
  XOR_SPLIT = 'xor-split',
  XOR_JOIN = 'xor-join',
  AND_SPLIT_JOIN = 'and-split-join',
  XOR_SPLIT_JOIN = 'xor-split-join',
  AND_JOIN_XOR_SPLIT = 'and-join-xor-split',
  XOR_JOIN_AND_SPLIT = 'xor-join-and-split',
}

/**
 * Operator transition - special transition for workflow patterns
 */
export interface OperatorTransition extends Transition {
  operatorType: OperatorType
}

/**
 * SubProcess - a transition that contains a nested Petri net
 */
export interface SubProcess extends Transition {
  subNetId: string
  collapsed: boolean
}

/**
 * Check if a transition is an operator
 */
export function isOperator(transition: Transition): transition is OperatorTransition {
  return 'operatorType' in transition
}

/**
 * Check if a transition is a subprocess
 */
export function isSubProcess(transition: Transition): transition is SubProcess {
  return 'subNetId' in transition
}

/**
 * Get operator category (split, join, or combined)
 */
export function getOperatorCategory(type: OperatorType): 'split' | 'join' | 'combined' {
  if (type.includes('split-join') || type.includes('join-') && type.includes('-split')) {
    return 'combined'
  }
  if (type.includes('split')) return 'split'
  return 'join'
}

/**
 * Get operator logic type (AND or XOR) for input side
 */
export function getOperatorInputType(type: OperatorType): 'and' | 'xor' | null {
  switch (type) {
    case OperatorType.AND_JOIN:
    case OperatorType.AND_SPLIT_JOIN:
    case OperatorType.AND_JOIN_XOR_SPLIT:
      return 'and'
    case OperatorType.XOR_JOIN:
    case OperatorType.XOR_SPLIT_JOIN:
    case OperatorType.XOR_JOIN_AND_SPLIT:
      return 'xor'
    default:
      return null
  }
}

/**
 * Get operator logic type (AND or XOR) for output side
 */
export function getOperatorOutputType(type: OperatorType): 'and' | 'xor' | null {
  switch (type) {
    case OperatorType.AND_SPLIT:
    case OperatorType.AND_SPLIT_JOIN:
    case OperatorType.XOR_JOIN_AND_SPLIT:
      return 'and'
    case OperatorType.XOR_SPLIT:
    case OperatorType.XOR_SPLIT_JOIN:
    case OperatorType.AND_JOIN_XOR_SPLIT:
      return 'xor'
    default:
      return null
  }
}

/**
 * Arc routing mode
 */
export type ArcRoutingMode = 'direct' | 'orthogonal' | 'bezier' | 'manual'

/**
 * Arc (Kante) connecting places and transitions
 */
export interface Arc {
  id: string
  sourceId: string
  targetId: string
  weight: number
  waypoints: Position[]
  routingMode?: ArcRoutingMode
}

/**
 * Complete Petri net structure
 */
export interface PetriNet {
  id: string
  name: string
  parentId?: string  // For subprocess hierarchy
  places: Place[]
  transitions: Transition[]
  operators: OperatorTransition[]
  subProcesses: SubProcess[]
  arcs: Arc[]
}

/**
 * Available editor tools
 */
export type Tool = 'select' | 'place' | 'transition' | 'operator' | 'subprocess' | 'arc' | 'delete'

/**
 * Element types in the Petri net
 */
export type ElementType = 'place' | 'transition' | 'operator' | 'subprocess' | 'arc'

/**
 * Union type for any selectable element
 */
export type PetriNetElement = Place | Transition | OperatorTransition | SubProcess | Arc

/**
 * Editor state for arc creation
 */
export interface ArcCreationState {
  isCreating: boolean
  sourceId: string | null
  sourceType: 'place' | 'transition' | null
  tempEndPosition: Position | null
}

/**
 * Viewport state for pan and zoom
 */
export interface ViewportState {
  x: number
  y: number
  scale: number
  rotation: number
}

/**
 * Default values for creating new elements
 */
export const DEFAULTS = {
  place: {
    tokens: 0,
    capacity: -1,
  },
  transition: {},
  arc: {
    weight: 1,
  },
  viewport: {
    x: 0,
    y: 0,
    scale: 1,
    minScale: 0.1,
    maxScale: 5,
  },
} as const

/**
 * Visual constants for rendering
 */
const OPERATOR_EDGE = 40

export const VISUAL = {
  place: {
    // Place diameter matches the operator square edge length
    radius: OPERATOR_EDGE / 2,
    strokeWidth: 2,
    tokenRadius: 5,
    tokenFontSize: 18,
  },
  transition: {
    width: 40,
    height: 30,
    strokeWidth: 2,
  },
  operator: {
    size: OPERATOR_EDGE,
    strokeWidth: 2,
    innerOffset: 8, // Offset for inner shape in combined operators
  },
  subprocess: {
    width: 80,
    height: 50,
    strokeWidth: 2,
    innerOffset: 4, // Offset for double border (modern notation)
    cornerRadius: 6,
    /** van der Aalst footprint matches operator square (40×40) */
    legacySize: OPERATOR_EDGE,
  },
  arc: {
    strokeWidth: 2,
    arrowSize: 10,
  },
  grid: {
    size: 20,
    color: '#e0e0e0',
  },
} as const

/**
 * Effective transition box size for a given operator notation.
 * The authentic van der Aalst (WoPeD) notation renders transitions as squares,
 * while the modern notation keeps the wider rectangle.
 */
export function getTransitionSize(
  notation: 'vanDerAalst' | 'modern'
): { width: number; height: number } {
  if (notation === 'vanDerAalst') {
    return { width: VISUAL.transition.width, height: VISUAL.transition.width }
  }
  return { width: VISUAL.transition.width, height: VISUAL.transition.height }
}

/**
 * Effective subprocess box size for a given operator notation.
 * Square in the van der Aalst notation, wider rectangle in the modern notation.
 */
export function getSubProcessSize(
  notation: 'vanDerAalst' | 'modern'
): { width: number; height: number } {
  if (notation === 'vanDerAalst') {
    const s = VISUAL.subprocess.legacySize
    return { width: s, height: s }
  }
  return { width: VISUAL.subprocess.width, height: VISUAL.subprocess.height }
}

/**
 * Operator display info
 */
export const OPERATOR_INFO: Record<OperatorType, { label: string; symbol: string; color: string }> = {
  [OperatorType.AND_SPLIT]: { label: 'AND-Split', symbol: '◇', color: '#4CAF50' },
  [OperatorType.AND_JOIN]: { label: 'AND-Join', symbol: '◇', color: '#4CAF50' },
  [OperatorType.XOR_SPLIT]: { label: 'XOR-Split', symbol: '⊗', color: '#FF9800' },
  [OperatorType.XOR_JOIN]: { label: 'XOR-Join', symbol: '⊗', color: '#FF9800' },
  [OperatorType.AND_SPLIT_JOIN]: { label: 'AND-Split-Join', symbol: '◇◇', color: '#4CAF50' },
  [OperatorType.XOR_SPLIT_JOIN]: { label: 'XOR-Split-Join', symbol: '⊗⊗', color: '#FF9800' },
  [OperatorType.AND_JOIN_XOR_SPLIT]: { label: 'AND-Join/XOR-Split', symbol: '◇⊗', color: '#9C27B0' },
  [OperatorType.XOR_JOIN_AND_SPLIT]: { label: 'XOR-Join/AND-Split', symbol: '⊗◇', color: '#9C27B0' },
}
