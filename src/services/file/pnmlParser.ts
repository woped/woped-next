import { nanoid } from 'nanoid'
import type { PetriNet, Place, Transition, OperatorTransition, SubProcess, Arc, Position } from '@/types/petri-net'
import { OperatorType } from '@/types/petri-net'
import type { ImportResult, ImportError } from '@/types/file-formats'
import type { Trigger, TimeTrigger, ResourceTrigger, MessageTrigger } from '@/types/triggers'

/**
 * Result of parsing including hierarchical nets
 */
interface ParsedNets {
  mainNet: PetriNet
  subNets: Map<string, PetriNet>
}

/**
 * Parser for PNML (Petri Net Markup Language) files
 */
export class PNMLParser {
  /**
   * Parse PNML XML string to PetriNet
   */
  parse(xml: string): ImportResult {
    const errors: ImportError[] = []
    const warnings: string[] = []

    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xml, 'text/xml')

      // Check for parse errors
      const parseError = doc.querySelector('parsererror')
      if (parseError) {
        return {
          success: false,
          errors: [{ message: 'Invalid XML: ' + (parseError.textContent || 'Parse error') }],
          warnings: [],
        }
      }

      // Find net element
      const netElement = doc.querySelector('net')
      if (!netElement) {
        return {
          success: false,
          errors: [{ message: 'No <net> element found in PNML file' }],
          warnings: [],
        }
      }

      // Parse the net and all subprocesses
      const { mainNet, subNets } = this.parseNetHierarchy(netElement, errors, warnings)

      return {
        success: errors.length === 0,
        net: mainNet,
        subNets,
        errors,
        warnings,
      }
    } catch (e) {
      return {
        success: false,
        errors: [{ message: `Parse error: ${e instanceof Error ? e.message : 'Unknown error'}` }],
        warnings: [],
      }
    }
  }

  /**
   * Parse net hierarchy including subprocesses
   */
  private parseNetHierarchy(
    netElement: Element,
    errors: ImportError[],
    warnings: string[]
  ): ParsedNets {
    const subNets = new Map<string, PetriNet>()

    // Parse places
    const places = this.parsePlaces(netElement, errors, warnings)

    // Parse transitions, operators, and subprocesses
    const { transitions, operators, subProcesses, operatorMemberMap } = this.parseTransitions(
      netElement,
      errors,
      warnings,
      subNets
    )

    // Parse arcs, remapping legacy operator member ids onto the merged operator
    const arcs = this.parseArcs(netElement, errors, operatorMemberMap)

    const mainNet: PetriNet = {
      id: netElement.getAttribute('id') || nanoid(),
      name: this.getNetName(netElement) || 'Imported Net',
      places,
      transitions,
      operators,
      subProcesses,
      arcs,
    }

    return { mainNet, subNets }
  }

  /**
   * Get net name from various possible locations
   */
  private getNetName(netElement: Element): string {
    // Try name element
    const nameText = netElement.querySelector(':scope > name > text')
    if (nameText?.textContent) return nameText.textContent

    // Try name attribute
    const nameAttr = netElement.getAttribute('name')
    if (nameAttr) return nameAttr

    // Try id as fallback
    return netElement.getAttribute('id') || ''
  }

  /**
   * Collect child elements of a given tag directly under the container as well
   * as inside its (top-level) <page> containers. Standard PNML 2009 nests all
   * net elements inside a <page>, while WoPeD writes them directly under <net>;
   * supporting both keeps imports robust. Subprocess pages live inside a
   * <transition> and are therefore not descended into here.
   */
  private collectChildElements(container: Element, tag: string): Element[] {
    const elements: Element[] = Array.from(container.querySelectorAll(`:scope > ${tag}`))
    const pages = container.querySelectorAll(':scope > page')
    pages.forEach((page) => {
      elements.push(...this.collectChildElements(page, tag))
    })
    return elements
  }

  /**
   * Parse all place elements
   */
  private parsePlaces(
    netElement: Element,
    errors: ImportError[],
    warnings: string[]
  ): Place[] {
    const places: Place[] = []
    const placeElements = this.collectChildElements(netElement, 'place')

    placeElements.forEach((placeEl, index) => {
      const id = placeEl.getAttribute('id')
      if (!id) {
        errors.push({ message: `Place at index ${index} has no id attribute`, element: 'place' })
        return
      }

      const name = this.getTextContent(placeEl, 'name > text') || `P${index + 1}`
      const position = this.getPosition(placeEl)
      const tokens = this.getInitialMarking(placeEl)
      const capacity = this.getCapacity(placeEl)

      if (!position) {
        warnings.push(`Place "${name}" has no position, using default`)
      }

      places.push({
        id,
        name,
        position: position || { x: 100 + index * 100, y: 100 },
        tokens,
        capacity,
      })
    })

    return places
  }

  /**
   * Parse all transition elements (including WoPeD operators and subprocesses)
   */
  private parseTransitions(
    netElement: Element,
    errors: ImportError[],
    warnings: string[],
    subNets: Map<string, PetriNet>
  ): {
    transitions: Transition[]
    operators: OperatorTransition[]
    subProcesses: SubProcess[]
    operatorMemberMap: Map<string, string>
  } {
    const transitions: Transition[] = []
    const subProcesses: SubProcess[] = []
    const transitionElements = this.collectChildElements(netElement, 'transition')

    // Legacy WoPeD exports a single operator (e.g. an XOR split) as several
    // overlapping inner transitions that share one <operator id="...">.
    // Merge those members into one operator node and remember the mapping
    // (member transition id -> merged operator id) so arcs can be rewired.
    const operatorGroups = new Map<string, OperatorTransition>()
    const operatorMemberMap = new Map<string, string>()

    transitionElements.forEach((transEl, index) => {
      const id = transEl.getAttribute('id')
      if (!id) {
        errors.push({ message: `Transition at index ${index} has no id attribute`, element: 'transition' })
        return
      }

      const name = this.getTextContent(transEl, 'name > text') || `T${index + 1}`
      const position = this.getPosition(transEl)
      const label = this.getTextContent(transEl, 'label > text') || undefined

      if (!position) {
        warnings.push(`Transition "${name}" has no position, using default`)
      }

      // Check for WoPeD subprocess (page element inside transition)
      const pageEl = transEl.querySelector('page')
      if (pageEl) {
        // This is a subprocess - parse the embedded net
        const subNetId = pageEl.getAttribute('id') || nanoid()
        const subNet = this.parseSubNet(pageEl, subNetId, id, errors, warnings, subNets)
        subNets.set(subNetId, subNet)

        subProcesses.push({
          id,
          name,
          position: position || { x: 100 + index * 100, y: 100 },
          label,
          subNetId,
          collapsed: true,
        })
        return
      }

      const operatorType = this.getWoPeDOperatorType(transEl)
      const triggers = this.parseTriggers(transEl)

      if (operatorType) {
        // Use the logical operator id when present (legacy expanded form),
        // otherwise the transition is itself a standalone operator node.
        const operatorId = this.getWoPeDOperatorId(transEl) || id
        operatorMemberMap.set(id, operatorId)

        if (!operatorGroups.has(operatorId)) {
          operatorGroups.set(operatorId, {
            id: operatorId,
            name,
            position: position || { x: 100 + index * 100, y: 100 },
            label,
            operatorType,
            ...(triggers.length > 0 ? { triggers } : {}),
          })
        }
        return
      }

      transitions.push({
        id,
        name,
        position: position || { x: 100 + index * 100, y: 100 },
        label,
        ...(triggers.length > 0 ? { triggers } : {}),
      })
    })

    return {
      transitions,
      operators: Array.from(operatorGroups.values()),
      subProcesses,
      operatorMemberMap,
    }
  }

  /**
   * Parse a subprocess page element
   */
  private parseSubNet(
    pageEl: Element,
    subNetId: string,
    parentSubProcessId: string,
    errors: ImportError[],
    warnings: string[],
    subNets: Map<string, PetriNet>
  ): PetriNet {
    const places = this.parsePlaces(pageEl, errors, warnings)
    const { transitions, operators, subProcesses, operatorMemberMap } = this.parseTransitions(
      pageEl,
      errors,
      warnings,
      subNets
    )
    const arcs = this.parseArcs(pageEl, errors, operatorMemberMap)

    return {
      id: subNetId,
      name: this.getTextContent(pageEl, 'name > text') || `Subnet`,
      parentId: parentSubProcessId,
      places,
      transitions,
      operators,
      subProcesses,
      arcs,
    }
  }

  /**
   * Parse all arc elements
   */
  private parseArcs(
    netElement: Element,
    errors: ImportError[],
    operatorMemberMap?: Map<string, string>
  ): Arc[] {
    const arcs: Arc[] = []
    const arcElements = this.collectChildElements(netElement, 'arc')

    // Track source/target pairs so that arcs collapsed onto a merged operator
    // (e.g. both p2->t5_op_1 and p2->t5_op_2 becoming p2->t5) are not duplicated.
    const seenEndpoints = new Set<string>()
    const remap = (endpoint: string): string => operatorMemberMap?.get(endpoint) ?? endpoint

    arcElements.forEach((arcEl, index) => {
      const id = arcEl.getAttribute('id') || nanoid()
      const source = arcEl.getAttribute('source')
      const target = arcEl.getAttribute('target')

      if (!source || !target) {
        errors.push({
          message: `Arc "${id}" missing source or target`,
          element: 'arc',
        })
        return
      }

      const sourceId = remap(source)
      const targetId = remap(target)

      const endpointKey = `${sourceId}->${targetId}`
      if (seenEndpoints.has(endpointKey)) {
        return
      }
      seenEndpoints.add(endpointKey)

      const weight = this.getArcWeight(arcEl)
      const waypoints = this.getArcWaypoints(arcEl)

      arcs.push({
        id,
        sourceId,
        targetId,
        weight,
        waypoints,
      })
    })

    return arcs
  }

  /**
   * Get text content from a selector
   */
  private getTextContent(element: Element, selector: string): string | null {
    const el = element.querySelector(selector)
    return el?.textContent?.trim() || null
  }

  /**
   * Get position from graphics element
   */
  private getPosition(element: Element): Position | null {
    const posEl = element.querySelector('graphics > position')
    if (!posEl) return null

    const x = parseFloat(posEl.getAttribute('x') || '0')
    const y = parseFloat(posEl.getAttribute('y') || '0')

    return { x, y }
  }

  /**
   * Get initial marking (tokens) for a place
   */
  private getInitialMarking(placeEl: Element): number {
    const text = this.getTextContent(placeEl, 'initialMarking > text')
    if (text) return parseInt(text, 10) || 0

    // WoPeD format
    const wopedMarking = placeEl.querySelector('toolspecific[tool="WoPeD"] > tokens')
    if (wopedMarking?.textContent) return parseInt(wopedMarking.textContent, 10) || 0

    return 0
  }

  /**
   * Get capacity for a place
   */
  private getCapacity(placeEl: Element): number {
    const text = this.getTextContent(placeEl, 'capacity > text')
    if (text) return parseInt(text, 10) || -1
    return -1 // Unlimited by default
  }

  /**
   * Get arc weight (inscription)
   */
  private getArcWeight(arcEl: Element): number {
    const text = this.getTextContent(arcEl, 'inscription > text')
    if (text) return parseInt(text, 10) || 1
    return 1
  }

  /**
   * Get arc waypoints from graphics
   */
  private getArcWaypoints(arcEl: Element): Position[] {
    const waypoints: Position[] = []
    const positionEls = arcEl.querySelectorAll('graphics > position')

    positionEls.forEach((posEl) => {
      const x = parseFloat(posEl.getAttribute('x') || '0')
      const y = parseFloat(posEl.getAttribute('y') || '0')
      waypoints.push({ x, y })
    })

    return waypoints
  }

  /**
   * Parse trigger elements from WoPeD toolspecific data
   */
  private parseTriggers(transEl: Element): Trigger[] {
    const triggers: Trigger[] = []
    const toolspec = transEl.querySelector('toolspecific[tool="WoPeD"]')
    if (!toolspec) return triggers

    const triggerEls = toolspec.querySelectorAll('trigger')
    triggerEls.forEach((triggerEl) => {
      const type = triggerEl.getAttribute('type')
      const id = triggerEl.getAttribute('id') || nanoid()

      if (type === 'time') {
        triggers.push({
          id,
          type: 'time',
          delay: parseFloat(triggerEl.getAttribute('delay') || '0'),
          timeUnit: (triggerEl.getAttribute('timeunit') || triggerEl.getAttribute('timeUnit') || 'minutes') as any,
        } as TimeTrigger)
      } else if (type === 'resource') {
        triggers.push({
          id,
          type: 'resource',
          resourceId: triggerEl.getAttribute('resourceid') || triggerEl.getAttribute('resourceId') || '',
          quantity: parseInt(triggerEl.getAttribute('quantity') || '1', 10),
          role: triggerEl.getAttribute('role') || undefined,
        } as ResourceTrigger)
      } else if (type === 'message') {
        triggers.push({
          id,
          type: 'message',
          messageType: triggerEl.getAttribute('messagetype') || triggerEl.getAttribute('messageType') || '',
          source: triggerEl.getAttribute('source') || undefined,
        } as MessageTrigger)
      }
    })

    return triggers
  }

  /**
   * Check for WoPeD operator type in toolspecific element
   */
  private getWoPeDOperatorType(transEl: Element): OperatorType | null {
    const toolspec = transEl.querySelector('toolspecific[tool="WoPeD"]')
    if (!toolspec) return null

    const operatorEl = toolspec.querySelector('operator')
    if (!operatorEl) return null

    const type = operatorEl.getAttribute('type')
    if (!type) return null

    // Map WoPeD operator IDs to our types
    const operatorMapping: Record<string, OperatorType> = {
      '101': OperatorType.AND_SPLIT,
      '102': OperatorType.AND_JOIN,
      '104': OperatorType.XOR_SPLIT,
      '105': OperatorType.XOR_JOIN,
      '106': OperatorType.AND_SPLIT_JOIN,
      '107': OperatorType.XOR_SPLIT_JOIN,
      '108': OperatorType.AND_JOIN_XOR_SPLIT,
      '109': OperatorType.XOR_JOIN_AND_SPLIT,
    }

    return operatorMapping[type] || null
  }

  /**
   * Get the logical WoPeD operator id (shared by expanded operator members).
   * Legacy WoPeD splits one operator into several transitions whose
   * <operator> elements all carry the same id (e.g. "t5"), while the
   * transitions themselves use suffixed ids ("t5_op_1", "t5_op_2", ...).
   */
  private getWoPeDOperatorId(transEl: Element): string | null {
    const toolspec = transEl.querySelector('toolspecific[tool="WoPeD"]')
    if (!toolspec) return null

    const operatorEl = toolspec.querySelector('operator')
    if (!operatorEl) return null

    return operatorEl.getAttribute('id') || null
  }
}
