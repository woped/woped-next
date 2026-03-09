import { describe, it, expect } from 'vitest'
import {
  getIncomingArcs,
  getOutgoingArcs,
  validateOperatorConnections,
  validatePetriNet,
  isWorkflowNetStructurallySound,
} from '@/utils/validation'
import type { PetriNet, Arc, Place, Transition, OperatorTransition } from '@/types/petri-net'
import { OperatorType } from '@/types/petri-net'

function makePlace(id: string, name?: string): Place {
  return { id, name: name ?? id, position: { x: 0, y: 0 }, tokens: 0, capacity: -1 }
}

function makeTransition(id: string, name?: string): Transition {
  return { id, name: name ?? id, position: { x: 0, y: 0 } }
}

function makeArc(id: string, sourceId: string, targetId: string): Arc {
  return { id, sourceId, targetId, weight: 1, waypoints: [], routingMode: 'direct' }
}

function makeOperator(id: string, type: OperatorType, name?: string): OperatorTransition {
  return { id, name: name ?? id, position: { x: 0, y: 0 }, operatorType: type }
}

function makeNet(overrides: Partial<PetriNet> = {}): PetriNet {
  return {
    id: 'net1',
    name: 'Test Net',
    places: [],
    transitions: [],
    operators: [],
    arcs: [],
    subProcesses: [],
    ...overrides,
  }
}

describe('getIncomingArcs / getOutgoingArcs', () => {
  const net = makeNet({
    arcs: [
      makeArc('a1', 'p1', 't1'),
      makeArc('a2', 't1', 'p2'),
      makeArc('a3', 'p3', 't1'),
    ],
  })

  it('returns arcs targeting the element', () => {
    expect(getIncomingArcs(net, 't1')).toHaveLength(2)
  })

  it('returns arcs originating from the element', () => {
    expect(getOutgoingArcs(net, 't1')).toHaveLength(1)
    expect(getOutgoingArcs(net, 't1')[0].targetId).toBe('p2')
  })

  it('returns empty for unconnected element', () => {
    expect(getIncomingArcs(net, 'p99')).toHaveLength(0)
    expect(getOutgoingArcs(net, 'p99')).toHaveLength(0)
  })
})

describe('validateOperatorConnections', () => {
  it('validates a valid split (1 in, 2+ out)', () => {
    const op = makeOperator('op1', OperatorType.AND_SPLIT)
    const net = makeNet({
      operators: [op],
      arcs: [
        makeArc('a1', 'p1', 'op1'),
        makeArc('a2', 'op1', 'p2'),
        makeArc('a3', 'op1', 'p3'),
      ],
    })
    const result = validateOperatorConnections(net, op)
    expect(result.valid).toBe(true)
    expect(result.issues).toHaveLength(0)
  })

  it('flags split with too many inputs or too few outputs', () => {
    const op = makeOperator('op1', OperatorType.XOR_SPLIT)
    const net = makeNet({
      operators: [op],
      arcs: [
        makeArc('a1', 'p1', 'op1'),
        makeArc('a2', 'p2', 'op1'),
        makeArc('a3', 'op1', 'p3'),
      ],
    })
    const result = validateOperatorConnections(net, op)
    expect(result.valid).toBe(false)
    expect(result.issues.some((i) => i.includes('1 incoming'))).toBe(true)
    expect(result.issues.some((i) => i.includes('2 outgoing'))).toBe(true)
  })

  it('validates a valid join (2+ in, 1 out)', () => {
    const op = makeOperator('op1', OperatorType.AND_JOIN)
    const net = makeNet({
      operators: [op],
      arcs: [
        makeArc('a1', 'p1', 'op1'),
        makeArc('a2', 'p2', 'op1'),
        makeArc('a3', 'op1', 'p3'),
      ],
    })
    const result = validateOperatorConnections(net, op)
    expect(result.valid).toBe(true)
  })

  it('flags join with too few inputs', () => {
    const op = makeOperator('op1', OperatorType.XOR_JOIN)
    const net = makeNet({
      operators: [op],
      arcs: [
        makeArc('a1', 'p1', 'op1'),
        makeArc('a2', 'op1', 'p3'),
      ],
    })
    const result = validateOperatorConnections(net, op)
    expect(result.valid).toBe(false)
    expect(result.issues.some((i) => i.includes('2 incoming'))).toBe(true)
  })

  it('validates a valid combined operator (2+ in, 2+ out)', () => {
    const op = makeOperator('op1', OperatorType.AND_SPLIT_JOIN)
    const net = makeNet({
      operators: [op],
      arcs: [
        makeArc('a1', 'p1', 'op1'),
        makeArc('a2', 'p2', 'op1'),
        makeArc('a3', 'op1', 'p3'),
        makeArc('a4', 'op1', 'p4'),
      ],
    })
    const result = validateOperatorConnections(net, op)
    expect(result.valid).toBe(true)
  })

  it('flags combined operator with insufficient connections', () => {
    const op = makeOperator('op1', OperatorType.XOR_SPLIT_JOIN)
    const net = makeNet({
      operators: [op],
      arcs: [
        makeArc('a1', 'p1', 'op1'),
        makeArc('a2', 'op1', 'p3'),
      ],
    })
    const result = validateOperatorConnections(net, op)
    expect(result.valid).toBe(false)
    expect(result.issues.length).toBeGreaterThanOrEqual(2)
  })
})

describe('validatePetriNet', () => {
  it('warns about isolated places and transitions', () => {
    const net = makeNet({
      places: [makePlace('p1')],
      transitions: [makeTransition('t1')],
    })
    const result = validatePetriNet(net)
    const codes = result.warnings.map((w) => w.code)
    expect(codes).toContain('ISOLATED_PLACE')
    expect(codes).toContain('ISOLATED_TRANSITION')
  })

  it('warns when there is no source or sink place', () => {
    const net = makeNet({
      places: [makePlace('p1'), makePlace('p2')],
      transitions: [makeTransition('t1')],
      arcs: [makeArc('a1', 'p1', 't1'), makeArc('a2', 't1', 'p2'), makeArc('a3', 'p2', 'p1')],
    })
    const result = validatePetriNet(net)
    const codes = result.warnings.map((w) => w.code)
    expect(codes).toContain('NO_SOURCE_PLACE')
  })

  it('warns about dead transitions with no inputs', () => {
    const net = makeNet({
      places: [makePlace('p1')],
      transitions: [makeTransition('t1')],
      arcs: [makeArc('a1', 't1', 'p1')],
    })
    const result = validatePetriNet(net)
    const codes = result.warnings.map((w) => w.code)
    expect(codes).toContain('NO_INPUT')
  })

  it('returns valid true when there are no errors', () => {
    const net = makeNet({
      places: [makePlace('p1'), makePlace('p2')],
      transitions: [makeTransition('t1')],
      arcs: [makeArc('a1', 'p1', 't1'), makeArc('a2', 't1', 'p2')],
    })
    const result = validatePetriNet(net)
    expect(result.valid).toBe(true)
  })
})

describe('isWorkflowNetStructurallySound', () => {
  it('reports sound for valid workflow net (1 source, 1 sink)', () => {
    const net = makeNet({
      places: [makePlace('src'), makePlace('sink')],
      transitions: [makeTransition('t1')],
      arcs: [makeArc('a1', 'src', 't1'), makeArc('a2', 't1', 'sink')],
    })
    const result = isWorkflowNetStructurallySound(net)
    expect(result.isSound).toBe(true)
    expect(result.issues).toHaveLength(0)
  })

  it('flags multiple source places', () => {
    const net = makeNet({
      places: [makePlace('src1'), makePlace('src2'), makePlace('sink')],
      transitions: [makeTransition('t1'), makeTransition('t2')],
      arcs: [
        makeArc('a1', 'src1', 't1'),
        makeArc('a2', 'src2', 't2'),
        makeArc('a3', 't1', 'sink'),
        makeArc('a4', 't2', 'sink'),
      ],
    })
    const result = isWorkflowNetStructurallySound(net)
    expect(result.isSound).toBe(false)
    expect(result.issues.some((i) => i.includes('Multiple source'))).toBe(true)
  })

  it('flags multiple sink places', () => {
    const net = makeNet({
      places: [makePlace('src'), makePlace('sink1'), makePlace('sink2')],
      transitions: [makeTransition('t1'), makeTransition('t2')],
      arcs: [
        makeArc('a1', 'src', 't1'),
        makeArc('a2', 'src', 't2'),
        makeArc('a3', 't1', 'sink1'),
        makeArc('a4', 't2', 'sink2'),
      ],
    })
    const result = isWorkflowNetStructurallySound(net)
    expect(result.isSound).toBe(false)
    expect(result.issues.some((i) => i.includes('Multiple sink'))).toBe(true)
  })
})
