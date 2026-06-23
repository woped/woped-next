import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePetriNetStore } from '@/stores/petriNet'
import { useTokenGameStore } from '@/stores/tokenGame'
import { OperatorType } from '@/types/petri-net'
import {
  isElementEnabled,
  computeFirePlan,
  effectiveInputLogic,
  effectiveOutputLogic,
  getBranchDecision,
} from '@/utils/operatorSemantics'

/**
 * Build a net of the form:  inputs -> operator -> outputs
 * Returns ids and the arcs so tests can assert/choose branches.
 */
function buildOperatorNet(
  operatorType: OperatorType,
  inputTokens: number[],
  outputCount: number
) {
  const store = usePetriNetStore()
  const inputs = inputTokens.map((tokens, i) => {
    const p = store.addPlace({ x: 0, y: i * 50 }, `In${i}`)
    if (tokens > 0) store.updatePlace(p.id, { tokens })
    return p
  })
  const op = store.addOperator({ x: 100, y: 0 }, operatorType, 'Op')
  const outputs = Array.from({ length: outputCount }, (_, i) =>
    store.addPlace({ x: 200, y: i * 50 }, `Out${i}`)
  )

  const inputArcs = inputs.map((p) => store.addArc(p.id, op.id)!)
  const outputArcs = outputs.map((p) => store.addArc(op.id, p.id)!)

  return { store, net: store.net, op, inputs, outputs, inputArcs, outputArcs }
}

function tokensOf(places: { id: string }[], marking: Record<string, number>) {
  return places.map((p) => marking[p.id] ?? 0)
}

describe('operatorSemantics — logic side detection', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('treats plain transitions as AND on both sides', () => {
    const store = usePetriNetStore()
    const p = store.addPlace({ x: 0, y: 0 }, 'P')
    const t = store.addTransition({ x: 100, y: 0 }, 'T')
    store.addArc(p.id, t.id)
    expect(effectiveInputLogic(store.net, t.id)).toBe('and')
    expect(effectiveOutputLogic(store.net, t.id)).toBe('and')
  })

  it('detects XOR split output and AND input', () => {
    const { net, op } = buildOperatorNet(OperatorType.XOR_SPLIT, [1], 2)
    expect(effectiveInputLogic(net, op.id)).toBe('and')
    expect(effectiveOutputLogic(net, op.id)).toBe('xor')
  })

  it('detects XOR join input and AND output', () => {
    const { net, op } = buildOperatorNet(OperatorType.XOR_JOIN, [1, 0], 1)
    expect(effectiveInputLogic(net, op.id)).toBe('xor')
    expect(effectiveOutputLogic(net, op.id)).toBe('and')
  })
})

describe('operatorSemantics — enabling', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('AND-join requires all inputs marked', () => {
    const { net, op } = buildOperatorNet(OperatorType.AND_JOIN, [1, 0], 1)
    expect(isElementEnabled(net, op.id, { ...markingFrom(net) })).toBe(false)
  })

  it('AND-join enabled when all inputs marked', () => {
    const { net, op } = buildOperatorNet(OperatorType.AND_JOIN, [1, 1], 1)
    expect(isElementEnabled(net, op.id, markingFrom(net))).toBe(true)
  })

  it('XOR-join enabled when only one input marked', () => {
    const { net, op } = buildOperatorNet(OperatorType.XOR_JOIN, [1, 0], 1)
    expect(isElementEnabled(net, op.id, markingFrom(net))).toBe(true)
  })

  it('XOR-join not enabled when no input marked', () => {
    const { net, op } = buildOperatorNet(OperatorType.XOR_JOIN, [0, 0], 1)
    expect(isElementEnabled(net, op.id, markingFrom(net))).toBe(false)
  })
})

describe('operatorSemantics — fire plan', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('AND-split produces to all output branches', () => {
    const { net, op, outputArcs } = buildOperatorNet(OperatorType.AND_SPLIT, [1], 2)
    const plan = computeFirePlan(net, op.id, markingFrom(net))
    expect(plan.produce.map((a) => a.id).sort()).toEqual(outputArcs.map((a) => a.id).sort())
  })

  it('XOR-split produces to exactly one branch (chosen)', () => {
    const { net, op, outputArcs } = buildOperatorNet(OperatorType.XOR_SPLIT, [1], 2)
    const plan = computeFirePlan(net, op.id, markingFrom(net), { outputArcId: outputArcs[1].id })
    expect(plan.produce).toHaveLength(1)
    expect(plan.produce[0].id).toBe(outputArcs[1].id)
  })

  it('XOR-split defaults to first branch without a choice', () => {
    const { net, op, outputArcs } = buildOperatorNet(OperatorType.XOR_SPLIT, [1], 2)
    const plan = computeFirePlan(net, op.id, markingFrom(net))
    expect(plan.produce).toHaveLength(1)
    expect(plan.produce[0].id).toBe(outputArcs[0].id)
  })

  it('XOR-join consumes from only the marked input', () => {
    const { net, op, inputArcs } = buildOperatorNet(OperatorType.XOR_JOIN, [0, 1], 1)
    const plan = computeFirePlan(net, op.id, markingFrom(net))
    expect(plan.consume).toHaveLength(1)
    expect(plan.consume[0].id).toBe(inputArcs[1].id)
  })

  it('AND-split-join consumes all inputs and produces all outputs', () => {
    const { net, op, inputArcs, outputArcs } = buildOperatorNet(
      OperatorType.AND_SPLIT_JOIN,
      [1, 1],
      2
    )
    const plan = computeFirePlan(net, op.id, markingFrom(net))
    expect(plan.consume).toHaveLength(inputArcs.length)
    expect(plan.produce).toHaveLength(outputArcs.length)
  })

  it('AND-join-XOR-split consumes all inputs but produces one output', () => {
    const { net, op } = buildOperatorNet(OperatorType.AND_JOIN_XOR_SPLIT, [1, 1], 2)
    const plan = computeFirePlan(net, op.id, markingFrom(net))
    expect(plan.consume).toHaveLength(2)
    expect(plan.produce).toHaveLength(1)
  })

  it('XOR-join-AND-split consumes one input but produces all outputs', () => {
    const { net, op } = buildOperatorNet(OperatorType.XOR_JOIN_AND_SPLIT, [1, 0], 2)
    const plan = computeFirePlan(net, op.id, markingFrom(net))
    expect(plan.consume).toHaveLength(1)
    expect(plan.produce).toHaveLength(2)
  })
})

describe('operatorSemantics — branch decisions', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('flags an output choice for an XOR split with multiple branches', () => {
    const { net, op } = buildOperatorNet(OperatorType.XOR_SPLIT, [1], 2)
    const decision = getBranchDecision(net, op.id, markingFrom(net))
    expect(decision.needsOutputChoice).toBe(true)
    expect(decision.outputOptions).toHaveLength(2)
    expect(decision.needsInputChoice).toBe(false)
  })

  it('does not flag a choice for an AND split', () => {
    const { net, op } = buildOperatorNet(OperatorType.AND_SPLIT, [1], 2)
    const decision = getBranchDecision(net, op.id, markingFrom(net))
    expect(decision.needsOutputChoice).toBe(false)
  })
})

describe('TokenGame store — operator firing', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('XOR-split routes the token to a single chosen branch', async () => {
    const { op, outputs, outputArcs } = buildOperatorNet(OperatorType.XOR_SPLIT, [1], 2)
    const tokenStore = useTokenGameStore()
    tokenStore.start()
    tokenStore.setConflictResolution('priority')

    await tokenStore.fireTransition(op.id, { outputArcId: outputArcs[1].id })

    expect(tokensOf(outputs, tokenStore.marking.tokens)).toEqual([0, 1])
  })

  it('AND-split routes the token to all branches', async () => {
    const { op, outputs } = buildOperatorNet(OperatorType.AND_SPLIT, [1], 2)
    const tokenStore = useTokenGameStore()
    tokenStore.start()

    await tokenStore.fireTransition(op.id)

    expect(tokensOf(outputs, tokenStore.marking.tokens)).toEqual([1, 1])
  })

  it('XOR-split in manual mode defers firing and opens the branch dialog', async () => {
    const { op, outputs } = buildOperatorNet(OperatorType.XOR_SPLIT, [1], 2)
    const tokenStore = useTokenGameStore()
    tokenStore.start()
    tokenStore.setConflictResolution('manual')

    await tokenStore.fireTransition(op.id)

    expect(tokenStore.pendingBranchChoice).not.toBeNull()
    expect(tokenStore.pendingBranchChoice?.options).toHaveLength(2)
    // Nothing fired yet
    expect(tokensOf(outputs, tokenStore.marking.tokens)).toEqual([0, 0])

    // Resolving the choice fires on the selected branch
    const secondOption = tokenStore.pendingBranchChoice!.options[1]
    await tokenStore.resolveBranchChoice(secondOption.arcId)
    expect(tokenStore.pendingBranchChoice).toBeNull()
    expect(tokensOf(outputs, tokenStore.marking.tokens)).toEqual([0, 1])
  })

  it('XOR-join is enabled with a single marked input and consumes only it', async () => {
    const { op, inputs } = buildOperatorNet(OperatorType.XOR_JOIN, [1, 0], 1)
    const tokenStore = useTokenGameStore()
    tokenStore.start()

    expect(tokenStore.enabledTransitions).toContain(op.id)

    await tokenStore.fireTransition(op.id)
    expect(tokensOf(inputs, tokenStore.marking.tokens)).toEqual([0, 0])
  })

  it('AND-join is not enabled unless all inputs are marked', () => {
    const { op } = buildOperatorNet(OperatorType.AND_JOIN, [1, 0], 1)
    const tokenStore = useTokenGameStore()
    tokenStore.start()
    expect(tokenStore.enabledTransitions).not.toContain(op.id)
  })
})

/** Build a token map from the current places' token counts */
function markingFrom(net: { places: { id: string; tokens: number }[] }): Record<string, number> {
  const tokens: Record<string, number> = {}
  for (const p of net.places) {
    if (p.tokens > 0) tokens[p.id] = p.tokens
  }
  return tokens
}
