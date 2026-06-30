import type { Position } from '@/types/petri-net'
import { VISUAL } from '@/types/petri-net'

export type QuickConnectSource = 'place' | 'transition' | 'operator' | 'subprocess'
export type QuickConnectTarget = 'place' | 'transition' | 'operator' | 'subprocess'

export interface QuickConnectOption {
  target: QuickConnectTarget
  icon: string
  labelKey: string
}

const GAP = 36
const BRANCH_SPACING = 72

function halfExtents(type: QuickConnectSource | QuickConnectTarget): { hw: number; hh: number } {
  switch (type) {
    case 'place':
      return { hw: VISUAL.place.radius, hh: VISUAL.place.radius }
    case 'transition':
      return { hw: VISUAL.transition.width / 2, hh: VISUAL.transition.height / 2 }
    case 'operator':
      return { hw: VISUAL.operator.size / 2, hh: VISUAL.operator.size / 2 }
    case 'subprocess':
      return { hw: VISUAL.subprocess.width / 2, hh: VISUAL.subprocess.height / 2 }
  }
}

/**
 * Valid quick-connect targets for a selected element (Camunda-style forward connect).
 * Petri nets alternate place ↔ transition-side elements.
 */
export function getQuickConnectOptions(sourceType: QuickConnectSource): QuickConnectOption[] {
  if (sourceType === 'place') {
    return [
      { target: 'transition', icon: '□', labelKey: 'quickConnect.transition' },
      { target: 'operator', icon: '◇', labelKey: 'quickConnect.operator' },
      { target: 'subprocess', icon: '⊞', labelKey: 'quickConnect.subprocess' },
    ]
  }
  return [{ target: 'place', icon: '○', labelKey: 'quickConnect.place' }]
}

/**
 * Whether an arc from source to target is valid in a Petri net.
 */
export function isValidQuickConnect(
  sourceType: QuickConnectSource,
  targetType: QuickConnectTarget,
): boolean {
  if (sourceType === 'place') {
    return targetType === 'transition' || targetType === 'operator' || targetType === 'subprocess'
  }
  return targetType === 'place'
}

/**
 * Compute world position for a new element connected to the right of the source.
 * Staggers vertically when the source already has outgoing arcs (parallel branches).
 */
export function computeQuickConnectPosition(
  sourcePosition: Position,
  sourceType: QuickConnectSource,
  targetType: QuickConnectTarget,
  outgoingCount: number,
): Position {
  const source = halfExtents(sourceType)
  const target = halfExtents(targetType)
  const dx = source.hw + target.hw + GAP
  const dy = outgoingCount * BRANCH_SPACING

  return {
    x: sourcePosition.x + dx,
    y: sourcePosition.y + dy,
  }
}

/**
 * Screen coordinates for overlay UI anchored to the right of an element.
 */
export function quickConnectPadScreenPosition(
  elementPosition: Position,
  elementType: QuickConnectSource,
  viewport: { x: number; y: number; scale: number },
): { x: number; y: number } {
  const { hw } = halfExtents(elementType)
  return {
    x: viewport.x + (elementPosition.x + hw + 16) * viewport.scale,
    y: viewport.y + elementPosition.y * viewport.scale,
  }
}
