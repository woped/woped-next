import { nanoid } from 'nanoid'
import type { PetriNet } from '@/types/petri-net'
import type { ImportResult, ImportError, ExportOptions } from '@/types/file-formats'

/**
 * Parser for JSON format (native format for this application)
 */
export class JSONParser {
  /**
   * Parse JSON string to PetriNet
   */
  parse(jsonString: string): ImportResult {
    const errors: ImportError[] = []
    const warnings: string[] = []

    try {
      const data = JSON.parse(jsonString)

      // Validate basic structure
      if (!data || typeof data !== 'object') {
        return {
          success: false,
          errors: [{ message: 'Invalid JSON: expected an object' }],
          warnings: [],
        }
      }

      // Check for required fields
      if (!Array.isArray(data.places)) {
        errors.push({ message: 'Missing or invalid "places" array' })
      }
      if (!Array.isArray(data.transitions)) {
        errors.push({ message: 'Missing or invalid "transitions" array' })
      }
      if (!Array.isArray(data.arcs)) {
        errors.push({ message: 'Missing or invalid "arcs" array' })
      }

      if (errors.length > 0) {
        return { success: false, errors, warnings }
      }

      // Construct PetriNet with defaults for missing optional fields
      const net: PetriNet = {
        id: data.id || nanoid(),
        name: data.name || 'Imported Net',
        parentId: data.parentId,
        places: this.validatePlaces(data.places, errors, warnings),
        transitions: this.validateTransitions(data.transitions, errors, warnings),
        operators: this.validateOperators(data.operators || [], errors, warnings),
        subProcesses: this.validateSubProcesses(data.subProcesses || [], errors, warnings),
        arcs: this.validateArcs(data.arcs, errors, warnings),
      }

      // Parse subnets if present
      const subNets = new Map<string, PetriNet>()
      if (data.subNets && typeof data.subNets === 'object') {
        for (const [id, subNetData] of Object.entries(data.subNets)) {
          const subResult = this.parseSubNet(subNetData as any, errors, warnings)
          if (subResult) {
            subNets.set(id, subResult)
          }
        }
      }

      return {
        success: errors.length === 0,
        net,
        subNets: subNets.size > 0 ? subNets : undefined,
        errors,
        warnings,
      }
    } catch (e) {
      return {
        success: false,
        errors: [{ message: `JSON parse error: ${e instanceof Error ? e.message : 'Unknown error'}` }],
        warnings: [],
      }
    }
  }

  /**
   * Parse a subnet from data
   */
  private parseSubNet(data: any, errors: ImportError[], warnings: string[]): PetriNet | null {
    if (!data || typeof data !== 'object') return null

    return {
      id: data.id || nanoid(),
      name: data.name || 'Subnet',
      parentId: data.parentId,
      places: this.validatePlaces(data.places || [], errors, warnings),
      transitions: this.validateTransitions(data.transitions || [], errors, warnings),
      operators: this.validateOperators(data.operators || [], errors, warnings),
      subProcesses: this.validateSubProcesses(data.subProcesses || [], errors, warnings),
      arcs: this.validateArcs(data.arcs || [], errors, warnings),
    }
  }

  /**
   * Validate and normalize places array
   */
  private validatePlaces(places: any[], errors: ImportError[], warnings: string[]): any[] {
    return places.map((place, index) => {
      if (!place.id) {
        place.id = nanoid()
        warnings.push(`Place at index ${index} had no id, generated one`)
      }
      if (!place.position) {
        place.position = { x: 100 + index * 100, y: 100 }
        warnings.push(`Place "${place.name || place.id}" had no position, using default`)
      }
      return {
        id: place.id,
        name: place.name || `P${index + 1}`,
        position: place.position,
        tokens: place.tokens || 0,
        capacity: place.capacity ?? -1,
      }
    })
  }

  /**
   * Validate and normalize transitions array
   */
  private validateTransitions(transitions: any[], errors: ImportError[], warnings: string[]): any[] {
    return transitions.map((trans, index) => {
      if (!trans.id) {
        trans.id = nanoid()
        warnings.push(`Transition at index ${index} had no id, generated one`)
      }
      if (!trans.position) {
        trans.position = { x: 100 + index * 100, y: 200 }
        warnings.push(`Transition "${trans.name || trans.id}" had no position, using default`)
      }
      return {
        id: trans.id,
        name: trans.name || `T${index + 1}`,
        position: trans.position,
        label: trans.label,
      }
    })
  }

  /**
   * Validate and normalize operators array
   */
  private validateOperators(operators: any[], errors: ImportError[], warnings: string[]): any[] {
    return operators.map((op, index) => {
      if (!op.id) {
        op.id = nanoid()
        warnings.push(`Operator at index ${index} had no id, generated one`)
      }
      if (!op.operatorType) {
        errors.push({ message: `Operator "${op.name || op.id}" has no operatorType` })
      }
      return {
        id: op.id,
        name: op.name || `Op${index + 1}`,
        position: op.position || { x: 100 + index * 100, y: 300 },
        operatorType: op.operatorType,
        label: op.label,
      }
    })
  }

  /**
   * Validate and normalize subprocesses array
   */
  private validateSubProcesses(subProcesses: any[], errors: ImportError[], warnings: string[]): any[] {
    return subProcesses.map((sub, index) => {
      if (!sub.id) {
        sub.id = nanoid()
        warnings.push(`SubProcess at index ${index} had no id, generated one`)
      }
      if (!sub.subNetId) {
        errors.push({ message: `SubProcess "${sub.name || sub.id}" has no subNetId` })
      }
      return {
        id: sub.id,
        name: sub.name || `Sub${index + 1}`,
        position: sub.position || { x: 100 + index * 100, y: 300 },
        subNetId: sub.subNetId,
        collapsed: sub.collapsed ?? true,
        label: sub.label,
      }
    })
  }

  /**
   * Validate and normalize arcs array
   */
  private validateArcs(arcs: any[], errors: ImportError[], warnings: string[]): any[] {
    return arcs.map((arc, index) => {
      if (!arc.sourceId) {
        errors.push({ message: `Arc at index ${index} missing sourceId` })
      }
      if (!arc.targetId) {
        errors.push({ message: `Arc at index ${index} missing targetId` })
      }
      return {
        id: arc.id || nanoid(),
        sourceId: arc.sourceId,
        targetId: arc.targetId,
        weight: arc.weight || 1,
        waypoints: arc.waypoints || [],
        routingMode: arc.routingMode,
      }
    })
  }
}

/**
 * Writer for JSON format
 */
export class JSONWriter {
  /**
   * Convert PetriNet to JSON string
   * @param net The main net to export
   * @param options Export options
   * @param subNets Optional map of subnet IDs to their PetriNet definitions
   */
  write(net: PetriNet, options: ExportOptions, subNets?: Map<string, PetriNet>): string {
    const data: any = {
      id: net.id,
      name: net.name,
      parentId: net.parentId,
      places: net.places,
      transitions: net.transitions,
      operators: net.operators,
      subProcesses: net.subProcesses || [],
      arcs: net.arcs,
    }

    // Add subnets if present
    if (subNets && subNets.size > 0) {
      data.subNets = {}
      subNets.forEach((subNet, id) => {
        data.subNets[id] = {
          id: subNet.id,
          name: subNet.name,
          parentId: subNet.parentId,
          places: subNet.places,
          transitions: subNet.transitions,
          operators: subNet.operators,
          subProcesses: subNet.subProcesses || [],
          arcs: subNet.arcs,
        }
      })
    }

    // Add metadata if requested
    if (options.includeMetadata) {
      data.metadata = {
        exportedAt: new Date().toISOString(),
        format: 'woped-next',
        version: '1.0',
      }
    }

    // Remove position data if not including layout
    if (!options.includeLayout) {
      data.places = data.places.map((p: any) => ({ ...p, position: undefined }))
      data.transitions = data.transitions.map((t: any) => ({ ...t, position: undefined }))
      data.operators = data.operators.map((o: any) => ({ ...o, position: undefined }))
      data.subProcesses = data.subProcesses.map((s: any) => ({ ...s, position: undefined }))
      data.arcs = data.arcs.map((a: any) => ({ ...a, waypoints: undefined }))
      
      // Also remove positions from subnets
      if (data.subNets) {
        for (const id in data.subNets) {
          const sn = data.subNets[id]
          sn.places = sn.places.map((p: any) => ({ ...p, position: undefined }))
          sn.transitions = sn.transitions.map((t: any) => ({ ...t, position: undefined }))
          sn.operators = sn.operators.map((o: any) => ({ ...o, position: undefined }))
          sn.subProcesses = sn.subProcesses.map((s: any) => ({ ...s, position: undefined }))
          sn.arcs = sn.arcs.map((a: any) => ({ ...a, waypoints: undefined }))
        }
      }
    }

    return JSON.stringify(data, null, 2)
  }
}
