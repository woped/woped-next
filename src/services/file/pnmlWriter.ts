import type { PetriNet, Place, Transition, OperatorTransition, SubProcess, Arc } from '@/types/petri-net'
import { OperatorType, isOperator } from '@/types/petri-net'
import type { ExportOptions } from '@/types/file-formats'

/**
 * Writer for PNML (Petri Net Markup Language) files
 */
export class PNMLWriter {
  /**
   * Convert PetriNet to PNML XML string
   * @param net The main net to export
   * @param options Export options
   * @param subNets Optional map of subnet IDs to their PetriNet definitions
   */
  write(net: PetriNet, options: ExportOptions, subNets?: Map<string, PetriNet>): string {
    const doc = document.implementation.createDocument(null, 'pnml', null)
    const pnml = doc.documentElement

    // Add XML declaration manually (not included by createDocument)
    const declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'

    // Create net element
    const netEl = doc.createElement('net')
    netEl.setAttribute('id', net.id)
    netEl.setAttribute('type', 'http://www.pnml.org/version-2009/grammar/pnmlcoremodel')

    // Add net name
    const nameEl = this.createNameElement(doc, net.name)
    netEl.appendChild(nameEl)

    // Add all elements
    this.addNetElements(doc, netEl, net, options, subNets)

    pnml.appendChild(netEl)

    // Serialize to string
    const serializer = new XMLSerializer()
    const xmlString = serializer.serializeToString(doc)

    // Format the XML nicely
    return declaration + this.formatXML(xmlString)
  }

  /**
   * Add all elements to a net/page element
   */
  private addNetElements(
    doc: Document,
    parentEl: Element,
    net: PetriNet,
    options: ExportOptions,
    subNets?: Map<string, PetriNet>
  ): void {
    // Add places
    for (const place of net.places) {
      parentEl.appendChild(this.createPlaceElement(doc, place, options))
    }

    // Add transitions
    for (const transition of net.transitions) {
      parentEl.appendChild(this.createTransitionElement(doc, transition, options))
    }

    // Add operators (as transitions with WoPeD toolspecific)
    for (const operator of net.operators) {
      parentEl.appendChild(this.createOperatorElement(doc, operator, options))
    }

    // Add subprocesses (as transitions with embedded page)
    if (net.subProcesses) {
      for (const subprocess of net.subProcesses) {
        parentEl.appendChild(this.createSubProcessElement(doc, subprocess, options, subNets))
      }
    }

    // Add arcs
    for (const arc of net.arcs) {
      parentEl.appendChild(this.createArcElement(doc, arc, options))
    }
  }

  /**
   * Create name element
   */
  private createNameElement(doc: Document, name: string): Element {
    const nameEl = doc.createElement('name')
    const textEl = doc.createElement('text')
    textEl.textContent = name
    nameEl.appendChild(textEl)
    return nameEl
  }

  /**
   * Create place element
   */
  private createPlaceElement(doc: Document, place: Place, options: ExportOptions): Element {
    const placeEl = doc.createElement('place')
    placeEl.setAttribute('id', place.id)

    // Name
    placeEl.appendChild(this.createNameElement(doc, place.name))

    // Initial marking (tokens)
    if (place.tokens > 0) {
      const markingEl = doc.createElement('initialMarking')
      const textEl = doc.createElement('text')
      textEl.textContent = place.tokens.toString()
      markingEl.appendChild(textEl)
      placeEl.appendChild(markingEl)
    }

    // Capacity
    if (place.capacity > 0) {
      const capacityEl = doc.createElement('capacity')
      const textEl = doc.createElement('text')
      textEl.textContent = place.capacity.toString()
      capacityEl.appendChild(textEl)
      placeEl.appendChild(capacityEl)
    }

    // Graphics (position)
    if (options.includeLayout) {
      placeEl.appendChild(this.createGraphicsElement(doc, place.position))
    }

    return placeEl
  }

  /**
   * Create transition element
   */
  private createTransitionElement(doc: Document, transition: Transition, options: ExportOptions): Element {
    const transEl = doc.createElement('transition')
    transEl.setAttribute('id', transition.id)

    // Name
    transEl.appendChild(this.createNameElement(doc, transition.name))

    // Label (if different from name)
    if (transition.label) {
      const labelEl = doc.createElement('label')
      const textEl = doc.createElement('text')
      textEl.textContent = transition.label
      labelEl.appendChild(textEl)
      transEl.appendChild(labelEl)
    }

    // Graphics (position)
    if (options.includeLayout) {
      transEl.appendChild(this.createGraphicsElement(doc, transition.position))
    }

    return transEl
  }

  /**
   * Create operator element (transition with WoPeD toolspecific)
   */
  private createOperatorElement(doc: Document, operator: OperatorTransition, options: ExportOptions): Element {
    const transEl = doc.createElement('transition')
    transEl.setAttribute('id', operator.id)

    // Name
    transEl.appendChild(this.createNameElement(doc, operator.name))

    // Graphics (position)
    if (options.includeLayout) {
      transEl.appendChild(this.createGraphicsElement(doc, operator.position))
    }

    // WoPeD toolspecific for operator type
    const toolspecEl = doc.createElement('toolspecific')
    toolspecEl.setAttribute('tool', 'WoPeD')
    toolspecEl.setAttribute('version', '1.0')

    const operatorEl = doc.createElement('operator')
    operatorEl.setAttribute('type', this.getWoPeDOperatorId(operator.operatorType))
    toolspecEl.appendChild(operatorEl)

    transEl.appendChild(toolspecEl)

    return transEl
  }

  /**
   * Create subprocess element (transition with embedded page)
   */
  private createSubProcessElement(
    doc: Document,
    subprocess: SubProcess,
    options: ExportOptions,
    subNets?: Map<string, PetriNet>
  ): Element {
    const transEl = doc.createElement('transition')
    transEl.setAttribute('id', subprocess.id)

    // Name
    transEl.appendChild(this.createNameElement(doc, subprocess.name))

    // Graphics (position)
    if (options.includeLayout) {
      transEl.appendChild(this.createGraphicsElement(doc, subprocess.position))
    }

    // Embedded page with subnet content
    const subNet = subNets?.get(subprocess.subNetId)
    if (subNet) {
      const pageEl = doc.createElement('page')
      pageEl.setAttribute('id', subprocess.subNetId)
      
      // Add name to page
      pageEl.appendChild(this.createNameElement(doc, subNet.name))
      
      // Add all subnet elements recursively
      this.addNetElements(doc, pageEl, subNet, options, subNets)
      
      transEl.appendChild(pageEl)
    }

    // WoPeD toolspecific for subprocess
    const toolspecEl = doc.createElement('toolspecific')
    toolspecEl.setAttribute('tool', 'WoPeD')
    toolspecEl.setAttribute('version', '1.0')

    const subprocessEl = doc.createElement('subprocess')
    subprocessEl.setAttribute('collapsed', subprocess.collapsed ? 'true' : 'false')
    toolspecEl.appendChild(subprocessEl)

    transEl.appendChild(toolspecEl)

    return transEl
  }

  /**
   * Create arc element
   */
  private createArcElement(doc: Document, arc: Arc, options: ExportOptions): Element {
    const arcEl = doc.createElement('arc')
    arcEl.setAttribute('id', arc.id)
    arcEl.setAttribute('source', arc.sourceId)
    arcEl.setAttribute('target', arc.targetId)

    // Inscription (weight)
    if (arc.weight > 1) {
      const inscriptionEl = doc.createElement('inscription')
      const textEl = doc.createElement('text')
      textEl.textContent = arc.weight.toString()
      inscriptionEl.appendChild(textEl)
      arcEl.appendChild(inscriptionEl)
    }

    // Graphics (waypoints)
    if (options.includeLayout && arc.waypoints.length > 0) {
      const graphicsEl = doc.createElement('graphics')
      for (const waypoint of arc.waypoints) {
        const posEl = doc.createElement('position')
        posEl.setAttribute('x', waypoint.x.toString())
        posEl.setAttribute('y', waypoint.y.toString())
        graphicsEl.appendChild(posEl)
      }
      arcEl.appendChild(graphicsEl)
    }

    return arcEl
  }

  /**
   * Create graphics element with position
   */
  private createGraphicsElement(doc: Document, position: { x: number; y: number }): Element {
    const graphicsEl = doc.createElement('graphics')
    const posEl = doc.createElement('position')
    posEl.setAttribute('x', Math.round(position.x).toString())
    posEl.setAttribute('y', Math.round(position.y).toString())
    graphicsEl.appendChild(posEl)
    return graphicsEl
  }

  /**
   * Get WoPeD operator type ID
   */
  private getWoPeDOperatorId(type: OperatorType): string {
    const mapping: Record<OperatorType, string> = {
      [OperatorType.AND_SPLIT]: '101',
      [OperatorType.AND_JOIN]: '102',
      [OperatorType.XOR_SPLIT]: '104',
      [OperatorType.XOR_JOIN]: '105',
      [OperatorType.AND_SPLIT_JOIN]: '106',
      [OperatorType.XOR_SPLIT_JOIN]: '107',
      [OperatorType.AND_JOIN_XOR_SPLIT]: '108',
      [OperatorType.XOR_JOIN_AND_SPLIT]: '109',
    }
    return mapping[type] || '101'
  }

  /**
   * Format XML with proper indentation
   */
  private formatXML(xml: string): string {
    let formatted = ''
    let indent = ''
    const tab = '  '

    xml.split(/>\s*</).forEach((node) => {
      if (node.match(/^\/\w/)) {
        // Closing tag
        indent = indent.substring(tab.length)
      }
      formatted += indent + '<' + node + '>\n'
      if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith('?')) {
        // Opening tag (not self-closing)
        indent += tab
      }
    })

    return formatted.substring(1, formatted.length - 2)
  }
}
