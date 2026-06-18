import type { PetriNet } from '@/types/petri-net'
import { getOperatorCategory, OPERATOR_INFO, OperatorType } from '@/types/petri-net'

export interface ResolveContext {
  /** Element ids present before this command batch started */
  knownElementIds: Set<string>
  /** Element ids created during the current batch */
  createdInBatch: Set<string>
}

type NetElement = { id: string; name?: string; label?: string; operatorType?: OperatorType }

function collectElements(net: PetriNet): NetElement[] {
  return [
    ...net.places,
    ...net.transitions,
    ...net.operators,
    ...net.subProcesses,
  ]
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[\s_-]+/g, '')
}

function normalizeRef(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    for (const key of ['id', 'element_id', 'elementId', 'name']) {
      if (typeof obj[key] === 'string') {
        const trimmed = obj[key].trim()
        if (trimmed) return trimmed
      }
    }
  }
  const asString = String(value).trim()
  return asString || null
}

function pickBestNameMatch(
  matches: NetElement[],
  ref: string,
  context?: ResolveContext,
): string | null {
  if (matches.length === 0) return null
  if (matches.length === 1) return matches[0].id

  const lower = ref.toLowerCase()

  if (context) {
    const preExisting = matches.filter(
      (element) =>
        context.knownElementIds.has(element.id) && !context.createdInBatch.has(element.id),
    )
    if (preExisting.length === 1) return preExisting[0].id
    if (preExisting.length > 1) {
      const exactPreExisting = preExisting.filter(
        (element) => (element.name || '').toLowerCase() === lower,
      )
      if (exactPreExisting.length === 1) return exactPreExisting[0].id
      preExisting.sort((left, right) => (left.name || '').length - (right.name || '').length)
      return preExisting[0].id
    }

    const newlyCreated = matches.filter((element) => context.createdInBatch.has(element.id))
    if (newlyCreated.length === 1) return newlyCreated[0].id
    const exactNew = newlyCreated.filter((element) => (element.name || '').toLowerCase() === lower)
    if (exactNew.length === 1) return exactNew[0].id
  }

  const exact = matches.filter((element) => (element.name || '').toLowerCase() === lower)
  if (exact.length === 1) return exact[0].id

  matches.sort((left, right) => (left.name || '').length - (right.name || '').length)
  return matches[0].id
}

export function pickEndpointRef(params: Record<string, unknown>, side: 'source' | 'target'): unknown {
  const keys =
    side === 'source'
      ? [
          'source_id',
          'sourceId',
          'source_name',
          'sourceName',
          'source',
          'from',
          'from_id',
          'fromId',
          'from_name',
          'fromName',
        ]
      : [
          'target_id',
          'targetId',
          'target_name',
          'targetName',
          'target',
          'to',
          'to_id',
          'toId',
          'to_name',
          'toName',
        ]

  for (const key of keys) {
    const value = params[key]
    if (value != null && value !== '') return value
  }

  return null
}

function referencesSplit(ref: string): boolean {
  const token = normalizeToken(ref)
  return token.includes('split') || token.includes('splt') || /^spl?i?t?$/.test(token)
}

function referencesJoin(ref: string): boolean {
  const token = normalizeToken(ref)
  return token.includes('join') || /^joi?n?$/.test(token)
}

function resolveOperatorKeyword(net: PetriNet, ref: string): string | null {
  const wantSplit = referencesSplit(ref)
  const wantJoin = referencesJoin(ref)
  if (!wantSplit && !wantJoin) return null

  const candidates = net.operators.filter((operator) => {
    const category = getOperatorCategory(operator.operatorType)
    if (wantSplit && !wantJoin) {
      return category === 'split' || category === 'combined'
    }
    if (wantJoin && !wantSplit) {
      return category === 'join' || category === 'combined'
    }
    return true
  })

  if (candidates.length === 1) return candidates[0].id

  if (candidates.length > 1) {
    const refToken = normalizeToken(ref)
    const typed = candidates.filter((operator) => {
      const info = OPERATOR_INFO[operator.operatorType]
      const labelToken = normalizeToken(info.label)
      const nameToken = normalizeToken(operator.name || '')
      return labelToken.includes(refToken) || nameToken.includes(refToken) || refToken.includes(labelToken)
    })
    if (typed.length === 1) return typed[0].id
  }

  return null
}

function resolveByFuzzyName(
  elements: NetElement[],
  ref: string,
  context?: ResolveContext,
): string | null {
  const refToken = normalizeToken(ref)
  if (!refToken) return null

  const exactNormalized = elements.filter((element) => {
    const nameToken = normalizeToken(element.name || '')
    const labelToken = normalizeToken(element.label || '')
    return nameToken === refToken || labelToken === refToken
  })
  if (exactNormalized.length >= 1) {
    return pickBestNameMatch(exactNormalized, ref, context)
  }

  const matches = elements.filter((element) => {
    const nameToken = normalizeToken(element.name || '')
    const labelToken = normalizeToken(element.label || '')
    if (!nameToken && !labelToken) return false

    if (nameToken === refToken || labelToken === refToken) return true

    if (refToken.length < 3) return false

    const nameContains =
      nameToken.includes(refToken) ||
      refToken.includes(nameToken) ||
      labelToken.includes(refToken) ||
      refToken.includes(labelToken)

    if (!nameContains) return false

    if (nameToken.length > refToken.length && nameToken.startsWith(refToken)) {
      const hasExactShorter = elements.some(
        (candidate) => normalizeToken(candidate.name || '') === refToken,
      )
      if (hasExactShorter) return false
    }

    return true
  })

  if (matches.length === 1) return matches[0].id
  if (matches.length > 1) return pickBestNameMatch(matches, ref, context)
  return null
}

/**
 * Resolve an LLM-provided element reference (id or display name) to a net element id.
 */
export function resolveElementId(
  net: PetriNet,
  reference: unknown,
  context?: ResolveContext,
): string | null {
  const ref = normalizeRef(reference)
  if (!ref) return null

  const elements = collectElements(net)

  const byId = elements.find((element) => element.id === ref)
  if (byId) return byId.id

  const lower = ref.toLowerCase()
  const byName = elements.filter((element) => (element.name || '').toLowerCase() === lower)
  if (byName.length >= 1) {
    return pickBestNameMatch(byName, ref, context)
  }

  const byLabel = elements.filter((element) => (element.label || '').toLowerCase() === lower)
  if (byLabel.length >= 1) {
    return pickBestNameMatch(byLabel, ref, context)
  }

  const operatorMatch = resolveOperatorKeyword(net, ref)
  if (operatorMatch) return operatorMatch

  const fuzzy = resolveByFuzzyName(elements, ref, context)
  if (fuzzy) return fuzzy

  const refToken = normalizeToken(ref)
  const byIdSuffix = elements.filter(
    (element) =>
      normalizeToken(element.id) === refToken || normalizeToken(element.id).endsWith(refToken),
  )
  if (byIdSuffix.length === 1) return byIdSuffix[0].id
  if (byIdSuffix.length > 1) return pickBestNameMatch(byIdSuffix, ref, context)

  return null
}

function pickPlaceRef(params: Record<string, unknown>): unknown {
  const keys = ['place_id', 'placeId', 'place_name', 'placeName', 'place']
  for (const key of keys) {
    const value = params[key]
    if (value != null && value !== '') return value
  }
  return null
}

function pickTransitionRef(params: Record<string, unknown>): unknown {
  const keys = [
    'transition_id',
    'transitionId',
    'transition_name',
    'transitionName',
    'transition',
  ]
  for (const key of keys) {
    const value = params[key]
    if (value != null && value !== '') return value
  }
  return null
}

function getElementKind(
  net: PetriNet,
  elementId: string,
): 'place' | 'transition' | null {
  if (net.places.some((place) => place.id === elementId)) return 'place'
  if (
    net.transitions.some((transition) => transition.id === elementId) ||
    net.operators.some((operator) => operator.id === elementId) ||
    net.subProcesses.some((subProcess) => subProcess.id === elementId)
  ) {
    return 'transition'
  }
  return null
}

function orientArcEndpoints(
  net: PetriNet,
  firstId: string,
  secondId: string,
): { sourceId: string; targetId: string } | null {
  const firstKind = getElementKind(net, firstId)
  const secondKind = getElementKind(net, secondId)
  if (!firstKind || !secondKind || firstKind === secondKind) return null

  if (firstKind === 'place') {
    return { sourceId: firstId, targetId: secondId }
  }
  return { sourceId: secondId, targetId: firstId }
}

function collectParamRefs(params: Record<string, unknown>): string[] {
  const refs: string[] = []
  for (const value of Object.values(params)) {
    const ref = normalizeRef(value)
    if (ref) refs.push(ref)
  }
  return refs
}

function resolveFromParamValues(
  net: PetriNet,
  params: Record<string, unknown>,
  context?: ResolveContext,
): { sourceId: string | null; targetId: string | null } {
  const resolvedIds = [
    ...new Set(
      collectParamRefs(params)
        .map((ref) => resolveElementId(net, ref, context))
        .filter((id): id is string => Boolean(id)),
    ),
  ]

  if (resolvedIds.length < 2) {
    return { sourceId: null, targetId: null }
  }

  for (let i = 0; i < resolvedIds.length; i++) {
    for (let j = 0; j < resolvedIds.length; j++) {
      if (i === j) continue
      const oriented = orientArcEndpoints(net, resolvedIds[i], resolvedIds[j])
      if (oriented) return oriented
    }
  }

  return { sourceId: null, targetId: null }
}

function resolvePlaceTransitionShorthand(
  net: PetriNet,
  params: Record<string, unknown>,
  context?: ResolveContext,
): { sourceId: string | null; targetId: string | null } {
  const placeId = resolveElementId(net, pickPlaceRef(params), context)
  const transitionId = resolveElementId(net, pickTransitionRef(params), context)
  if (!placeId || !transitionId) {
    return { sourceId: null, targetId: null }
  }
  const oriented = orientArcEndpoints(net, placeId, transitionId)
  return oriented ?? { sourceId: null, targetId: null }
}

export function resolveArcEndpoints(
  net: PetriNet,
  params: Record<string, unknown>,
  context?: ResolveContext,
): { sourceId: string | null; targetId: string | null } {
  const sourceId = resolveElementId(net, pickEndpointRef(params, 'source'), context)
  const targetId = resolveElementId(net, pickEndpointRef(params, 'target'), context)
  if (sourceId && targetId) {
    return { sourceId, targetId }
  }

  const shorthand = resolvePlaceTransitionShorthand(net, params, context)
  if (shorthand.sourceId && shorthand.targetId) {
    return shorthand
  }

  if (!sourceId || !targetId) {
    const fromValues = resolveFromParamValues(net, params, context)
    if (fromValues.sourceId && fromValues.targetId) {
      return fromValues
    }
  }

  return {
    sourceId: sourceId ?? null,
    targetId: targetId ?? null,
  }
}

export function pickElementRef(params: Record<string, unknown>): unknown {
  const keys = ['element_id', 'elementId', 'element_name', 'elementName', 'id']
  for (const key of keys) {
    const value = params[key]
    if (value != null && value !== '') return value
  }
  return null
}

export function createResolveContext(net: PetriNet | null): ResolveContext {
  const knownElementIds = new Set<string>()
  if (net) {
    for (const element of collectElements(net)) {
      knownElementIds.add(element.id)
    }
  }
  return { knownElementIds, createdInBatch: new Set<string>() }
}
