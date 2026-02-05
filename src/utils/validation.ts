import type { PetriNet, Arc, OperatorTransition } from '@/types/petri-net'
import { OperatorType, getOperatorInputType, getOperatorOutputType, getOperatorCategory } from '@/types/petri-net'

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  type: 'error'
  code: string
  message: string
  elementId?: string
}

export interface ValidationWarning {
  type: 'warning'
  code: string
  message: string
  elementId?: string
}

/**
 * Get the number of incoming arcs for an element
 */
export function getIncomingArcs(net: PetriNet, elementId: string): Arc[] {
  return net.arcs.filter((arc) => arc.targetId === elementId)
}

/**
 * Get the number of outgoing arcs for an element
 */
export function getOutgoingArcs(net: PetriNet, elementId: string): Arc[] {
  return net.arcs.filter((arc) => arc.sourceId === elementId)
}

/**
 * Validate operator connections
 * - Split operators should have 1 input and multiple outputs
 * - Join operators should have multiple inputs and 1 output
 * - Combined operators should have multiple inputs and outputs
 */
export function validateOperatorConnections(
  net: PetriNet,
  operator: OperatorTransition
): { valid: boolean; issues: string[] } {
  const incoming = getIncomingArcs(net, operator.id)
  const outgoing = getOutgoingArcs(net, operator.id)
  const issues: string[] = []
  const category = getOperatorCategory(operator.operatorType)

  switch (category) {
    case 'split':
      // Split: 1 input, multiple outputs
      if (incoming.length === 0) {
        issues.push('Split operator needs at least 1 incoming arc')
      } else if (incoming.length > 1) {
        issues.push('Split operator should have exactly 1 incoming arc')
      }
      if (outgoing.length < 2) {
        issues.push('Split operator should have at least 2 outgoing arcs')
      }
      break

    case 'join':
      // Join: multiple inputs, 1 output
      if (incoming.length < 2) {
        issues.push('Join operator should have at least 2 incoming arcs')
      }
      if (outgoing.length === 0) {
        issues.push('Join operator needs at least 1 outgoing arc')
      } else if (outgoing.length > 1) {
        issues.push('Join operator should have exactly 1 outgoing arc')
      }
      break

    case 'combined':
      // Combined: multiple inputs, multiple outputs
      if (incoming.length < 2) {
        issues.push('Combined operator should have at least 2 incoming arcs')
      }
      if (outgoing.length < 2) {
        issues.push('Combined operator should have at least 2 outgoing arcs')
      }
      break
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

/**
 * Validate the entire Petri net
 */
export function validatePetriNet(net: PetriNet): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Check for isolated elements (no connections)
  for (const place of net.places) {
    const incoming = getIncomingArcs(net, place.id)
    const outgoing = getOutgoingArcs(net, place.id)
    if (incoming.length === 0 && outgoing.length === 0) {
      warnings.push({
        type: 'warning',
        code: 'ISOLATED_PLACE',
        message: `Place "${place.name}" has no connections`,
        elementId: place.id,
      })
    }
  }

  for (const transition of net.transitions) {
    const incoming = getIncomingArcs(net, transition.id)
    const outgoing = getOutgoingArcs(net, transition.id)
    if (incoming.length === 0 && outgoing.length === 0) {
      warnings.push({
        type: 'warning',
        code: 'ISOLATED_TRANSITION',
        message: `Transition "${transition.name}" has no connections`,
        elementId: transition.id,
      })
    }
  }

  // Validate operators
  for (const operator of net.operators) {
    const validation = validateOperatorConnections(net, operator)
    if (!validation.valid) {
      for (const issue of validation.issues) {
        warnings.push({
          type: 'warning',
          code: 'OPERATOR_CONNECTION',
          message: `Operator "${operator.name}": ${issue}`,
          elementId: operator.id,
        })
      }
    }
  }

  // Check for source place (place with no incoming arcs and some outgoing)
  const sourcePlaces = net.places.filter((p) => {
    const incoming = getIncomingArcs(net, p.id)
    const outgoing = getOutgoingArcs(net, p.id)
    return incoming.length === 0 && outgoing.length > 0
  })

  if (sourcePlaces.length === 0 && net.places.length > 0) {
    warnings.push({
      type: 'warning',
      code: 'NO_SOURCE_PLACE',
      message: 'Net has no source place (starting point)',
    })
  }

  // Check for sink place (place with no outgoing arcs and some incoming)
  const sinkPlaces = net.places.filter((p) => {
    const incoming = getIncomingArcs(net, p.id)
    const outgoing = getOutgoingArcs(net, p.id)
    return outgoing.length === 0 && incoming.length > 0
  })

  if (sinkPlaces.length === 0 && net.places.length > 0) {
    warnings.push({
      type: 'warning',
      code: 'NO_SINK_PLACE',
      message: 'Net has no sink place (ending point)',
    })
  }

  // Check for dead transitions (transitions with no incoming or outgoing arcs)
  for (const transition of net.transitions) {
    const incoming = getIncomingArcs(net, transition.id)
    const outgoing = getOutgoingArcs(net, transition.id)

    if (incoming.length === 0) {
      warnings.push({
        type: 'warning',
        code: 'NO_INPUT',
        message: `Transition "${transition.name}" has no input places`,
        elementId: transition.id,
      })
    }

    if (outgoing.length === 0) {
      warnings.push({
        type: 'warning',
        code: 'NO_OUTPUT',
        message: `Transition "${transition.name}" has no output places`,
        elementId: transition.id,
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Check if a workflow net is sound (basic structural check)
 * A workflow net is sound if:
 * - It has exactly one source place and one sink place
 * - Every node is on a path from source to sink
 */
export function isWorkflowNetStructurallySound(net: PetriNet): {
  isSound: boolean
  issues: string[]
} {
  const issues: string[] = []

  // Find source places (no incoming arcs)
  const sourcePlaces = net.places.filter((p) => {
    return getIncomingArcs(net, p.id).length === 0
  })

  // Find sink places (no outgoing arcs)
  const sinkPlaces = net.places.filter((p) => {
    return getOutgoingArcs(net, p.id).length === 0
  })

  if (sourcePlaces.length === 0) {
    issues.push('No source place found')
  } else if (sourcePlaces.length > 1) {
    issues.push(`Multiple source places found: ${sourcePlaces.map((p) => p.name).join(', ')}`)
  }

  if (sinkPlaces.length === 0) {
    issues.push('No sink place found')
  } else if (sinkPlaces.length > 1) {
    issues.push(`Multiple sink places found: ${sinkPlaces.map((p) => p.name).join(', ')}`)
  }

  return {
    isSound: issues.length === 0,
    issues,
  }
}
