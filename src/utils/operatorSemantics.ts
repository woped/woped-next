import type { Arc, PetriNet, OperatorTransition } from '@/types/petri-net'
import { getOperatorInputType, getOperatorOutputType } from '@/types/petri-net'
import type { ConflictResolutionMode } from '@/types/token-game'

/**
 * Logic applied to the input or output side of a node when firing.
 * - `and`: consume from / produce to all connected arcs (classic Petri net rule)
 * - `xor`: consume from / produce to exactly one connected arc (exclusive choice)
 */
export type LogicSide = 'and' | 'xor'

/** Token map: placeId -> token count */
export type TokenMap = Record<string, number>

/** Selected arcs for an exclusive (XOR) firing decision */
export interface FireChoice {
  /** Chosen input arc id (only relevant for XOR-join) */
  inputArcId?: string
  /** Chosen output arc id (only relevant for XOR-split) */
  outputArcId?: string
}

/** The concrete arcs a firing will consume from and produce to */
export interface FirePlan {
  consume: Arc[]
  produce: Arc[]
}

export function getOperator(net: PetriNet, id: string): OperatorTransition | undefined {
  return net.operators.find((o) => o.id === id)
}

export function getInputArcs(net: PetriNet, id: string): Arc[] {
  return net.arcs.filter((arc) => arc.targetId === id)
}

export function getOutputArcs(net: PetriNet, id: string): Arc[] {
  return net.arcs.filter((arc) => arc.sourceId === id)
}

/**
 * Effective input-side logic for a node. Plain transitions, subprocesses and pure
 * split operators behave as AND on the input side; only XOR-join variants are XOR.
 */
export function effectiveInputLogic(net: PetriNet, id: string): LogicSide {
  const op = getOperator(net, id)
  if (!op) return 'and'
  return getOperatorInputType(op.operatorType) === 'xor' ? 'xor' : 'and'
}

/**
 * Effective output-side logic for a node. Plain transitions, subprocesses and pure
 * join operators behave as AND on the output side; only XOR-split variants are XOR.
 */
export function effectiveOutputLogic(net: PetriNet, id: string): LogicSide {
  const op = getOperator(net, id)
  if (!op) return 'and'
  return getOperatorOutputType(op.operatorType) === 'xor' ? 'xor' : 'and'
}

/** Input arcs whose source place currently holds enough tokens to fire */
export function getEnabledInputCandidates(net: PetriNet, id: string, tokens: TokenMap): Arc[] {
  return getInputArcs(net, id).filter((arc) => (tokens[arc.sourceId] ?? 0) >= arc.weight)
}

/**
 * Whether a node (transition, operator or subprocess) is enabled under a marking.
 * AND-input requires every input place to be sufficiently marked; XOR-input requires
 * at least one.
 */
export function isElementEnabled(net: PetriNet, id: string, tokens: TokenMap): boolean {
  const inputArcs = getInputArcs(net, id)
  if (inputArcs.length === 0) return false

  if (effectiveInputLogic(net, id) === 'xor') {
    return getEnabledInputCandidates(net, id, tokens).length > 0
  }
  return inputArcs.every((arc) => (tokens[arc.sourceId] ?? 0) >= arc.weight)
}

/**
 * Description of which exclusive (XOR) decisions a firing requires. Used to decide
 * whether to prompt the user (manual mode) or auto-resolve.
 */
export interface BranchDecision {
  needsInputChoice: boolean
  inputOptions: Arc[]
  needsOutputChoice: boolean
  outputOptions: Arc[]
}

export function getBranchDecision(net: PetriNet, id: string, tokens: TokenMap): BranchDecision {
  const inputCandidates =
    effectiveInputLogic(net, id) === 'xor' ? getEnabledInputCandidates(net, id, tokens) : []
  const outputArcs = effectiveOutputLogic(net, id) === 'xor' ? getOutputArcs(net, id) : []

  return {
    needsInputChoice: inputCandidates.length > 1,
    inputOptions: inputCandidates,
    needsOutputChoice: outputArcs.length > 1,
    outputOptions: outputArcs,
  }
}

/** Pick a single arc from candidates according to the conflict-resolution mode */
export function pickArc(arcs: Arc[], mode: ConflictResolutionMode): Arc | undefined {
  if (arcs.length === 0) return undefined
  if (mode === 'random') {
    return arcs[Math.floor(Math.random() * arcs.length)]
  }
  // 'priority' and 'manual' fall back to the first arc (insertion order)
  return arcs[0]
}

/**
 * Compute the arcs a firing consumes from and produces to, honouring AND/XOR logic
 * on both sides. For XOR sides the chosen arc comes from `choices`, otherwise the
 * first matching arc is used.
 */
export function computeFirePlan(
  net: PetriNet,
  id: string,
  tokens: TokenMap,
  choices: FireChoice = {}
): FirePlan {
  const inputArcs = getInputArcs(net, id)
  const outputArcs = getOutputArcs(net, id)

  let consume: Arc[]
  if (effectiveInputLogic(net, id) === 'xor') {
    const candidates = getEnabledInputCandidates(net, id, tokens)
    const chosen =
      (choices.inputArcId && candidates.find((a) => a.id === choices.inputArcId)) || candidates[0]
    consume = chosen ? [chosen] : []
  } else {
    consume = inputArcs
  }

  let produce: Arc[]
  if (effectiveOutputLogic(net, id) === 'xor') {
    const chosen =
      (choices.outputArcId && outputArcs.find((a) => a.id === choices.outputArcId)) || outputArcs[0]
    produce = chosen ? [chosen] : []
  } else {
    produce = outputArcs
  }

  return { consume, produce }
}
