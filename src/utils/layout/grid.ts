import type { PetriNet, Position } from '@/types/petri-net'
import type { LayoutOptions, LayoutResult } from './index'

/**
 * Simple grid-based layout
 * Arranges elements in a grid pattern, alternating places and transitions
 */
export function gridLayout(net: PetriNet, options: LayoutOptions): LayoutResult {
  const positions = new Map<string, Position>()

  // Collect all elements in order: places, transitions, operators
  const places = [...net.places]
  const transitions = [...net.transitions]
  const operators = [...net.operators]

  const spacing = options.nodeSpacing
  const startX = 100
  const startY = 100

  // For horizontal layout (LR), arrange in columns
  // For vertical layout (TB), arrange in rows
  const isHorizontal = options.direction === 'LR' || options.direction === 'RL'

  if (isHorizontal) {
    // Interleave places and transitions/operators in columns
    let col = 0

    // First column: all places that are sources (no incoming arcs)
    const sourcePlaces = places.filter((p) => 
      !net.arcs.some((a) => a.targetId === p.id)
    )
    const otherPlaces = places.filter((p) => 
      net.arcs.some((a) => a.targetId === p.id)
    )

    // Place source places
    sourcePlaces.forEach((place, i) => {
      positions.set(place.id, {
        x: startX + col * spacing,
        y: startY + i * spacing,
      })
    })
    if (sourcePlaces.length > 0) col++

    // Transitions and operators
    const transAndOps = [...transitions, ...operators]
    const rowsPerCol = Math.ceil(Math.sqrt(transAndOps.length)) || 1
    
    transAndOps.forEach((el, i) => {
      const localCol = Math.floor(i / rowsPerCol)
      const row = i % rowsPerCol
      positions.set(el.id, {
        x: startX + (col + localCol * 2) * spacing,
        y: startY + row * spacing,
      })
    })

    // Calculate max col used by transitions
    const maxTransCol = col + Math.ceil(transAndOps.length / rowsPerCol) * 2

    // Place remaining places
    otherPlaces.forEach((place, i) => {
      const localCol = Math.floor(i / rowsPerCol)
      const row = i % rowsPerCol
      positions.set(place.id, {
        x: startX + (col + localCol * 2 + 1) * spacing,
        y: startY + row * spacing,
      })
    })
  } else {
    // Vertical layout - arrange in rows
    let row = 0

    // First row: all places that are sources
    const sourcePlaces = places.filter((p) => 
      !net.arcs.some((a) => a.targetId === p.id)
    )
    const otherPlaces = places.filter((p) => 
      net.arcs.some((a) => a.targetId === p.id)
    )

    // Place source places
    sourcePlaces.forEach((place, i) => {
      positions.set(place.id, {
        x: startX + i * spacing,
        y: startY + row * spacing,
      })
    })
    if (sourcePlaces.length > 0) row++

    // Transitions and operators
    const transAndOps = [...transitions, ...operators]
    const colsPerRow = Math.ceil(Math.sqrt(transAndOps.length)) || 1
    
    transAndOps.forEach((el, i) => {
      const localRow = Math.floor(i / colsPerRow)
      const col = i % colsPerRow
      positions.set(el.id, {
        x: startX + col * spacing,
        y: startY + (row + localRow * 2) * spacing,
      })
    })

    // Place remaining places
    otherPlaces.forEach((place, i) => {
      const localRow = Math.floor(i / colsPerRow)
      const col = i % colsPerRow
      positions.set(place.id, {
        x: startX + col * spacing,
        y: startY + (row + localRow * 2 + 1) * spacing,
      })
    })
  }

  const totalElements = places.length + transitions.length + operators.length

  return {
    positions,
    success: true,
    message: `Laid out ${totalElements} elements in grid`,
  }
}
