import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import { normalizePetriNet } from '@/utils/petriNetNormalize'
import type {
  PetriNet,
  Place,
  Transition,
  OperatorTransition,
  SubProcess,
  Arc,
  Position,
  Tool,
  ArcCreationState,
  ViewportState,
  PetriNetElement,
} from '@/types/petri-net'
import { DEFAULTS, OperatorType } from '@/types/petri-net'
import {
  computeQuickConnectPosition,
  isValidQuickConnect,
  type QuickConnectTarget,
} from '@/utils/quickConnect'
import { snapToGrid } from '@/utils/geometry'
import { useConfigStore } from '@/stores/config'

interface PetriNetState {
  // Multi-net support
  nets: Record<string, PetriNet>
  activeNetId: string
  breadcrumb: string[]
  // Legacy single net getter (computed from activeNetId)
  selectedIds: string[]
  tool: Tool
  selectedOperatorType: OperatorType
  arcCreation: ArcCreationState
  viewport: ViewportState
  history: Record<string, PetriNet>[]
  historyIndex: number
  maxHistorySize: number
}

const createEmptyNet = (id?: string, name?: string, parentId?: string): PetriNet => ({
  id: id || nanoid(),
  name: name || (parentId ? 'Subprocess' : 'Main'),
  parentId,
  places: [],
  transitions: [],
  operators: [],
  subProcesses: [],
  arcs: [],
})

export const usePetriNetStore = defineStore('petriNet', {
  state: (): PetriNetState => {
    const mainNetId = nanoid()
    return {
      nets: {
        [mainNetId]: createEmptyNet(mainNetId, 'Main'),
      },
      activeNetId: mainNetId,
      breadcrumb: [mainNetId],
      selectedIds: [],
      tool: 'select',
      selectedOperatorType: OperatorType.AND_SPLIT,
      arcCreation: {
        isCreating: false,
        sourceId: null,
        sourceType: null,
        tempEndPosition: null,
      },
      viewport: {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
      },
      history: [],
      historyIndex: -1,
      maxHistorySize: 50,
    }
  },

  getters: {
    /**
     * Get the active/current net
     */
    net: (state): PetriNet => state.nets[state.activeNetId],

    /**
     * Get all places in active net
     */
    places(): Place[] {
      return this.net.places
    },

    /**
     * Get all transitions in active net
     */
    transitions(): Transition[] {
      return this.net.transitions
    },

    /**
     * Get all operators in active net
     */
    operators(): OperatorTransition[] {
      return this.net.operators
    },

    /**
     * Get all subprocesses in active net
     */
    subProcesses(): SubProcess[] {
      return this.net.subProcesses || []
    },

    /**
     * Get all arcs in active net
     */
    arcs(): Arc[] {
      return this.net.arcs
    },

    /**
     * Get selected elements
     */
    selectedElements(state): PetriNetElement[] {
      const net = this.net
      const elements: PetriNetElement[] = []
      for (const id of state.selectedIds) {
        const place = net.places.find((p) => p.id === id)
        if (place) {
          elements.push(place)
          continue
        }
        const transition = net.transitions.find((t) => t.id === id)
        if (transition) {
          elements.push(transition)
          continue
        }
        const operator = net.operators.find((o) => o.id === id)
        if (operator) {
          elements.push(operator)
          continue
        }
        const subprocess = (net.subProcesses || []).find((s) => s.id === id)
        if (subprocess) {
          elements.push(subprocess)
          continue
        }
        const arc = net.arcs.find((a) => a.id === id)
        if (arc) {
          elements.push(arc)
        }
      }
      return elements
    },

    /**
     * Check if an element is selected
     */
    isSelected:
      (state) =>
      (id: string): boolean =>
        state.selectedIds.includes(id),

    /**
     * Get element by ID
     */
    getElementById() {
      const net = this.net
      return (id: string): PetriNetElement | undefined => {
        return (
          net.places.find((p) => p.id === id) ||
          net.transitions.find((t) => t.id === id) ||
          net.operators.find((o) => o.id === id) ||
          (net.subProcesses || []).find((s) => s.id === id) ||
          net.arcs.find((a) => a.id === id)
        )
      }
    },

    /**
     * Get element type by ID
     */
    getElementType() {
      const net = this.net
      return (id: string): 'place' | 'transition' | 'operator' | 'subprocess' | 'arc' | null => {
        if (net.places.find((p) => p.id === id)) return 'place'
        if (net.transitions.find((t) => t.id === id)) return 'transition'
        if (net.operators.find((o) => o.id === id)) return 'operator'
        if ((net.subProcesses || []).find((s) => s.id === id)) return 'subprocess'
        if (net.arcs.find((a) => a.id === id)) return 'arc'
        return null
      }
    },

    /**
     * Check if undo is available
     */
    canUndo: (state): boolean => state.historyIndex > 0,

    /**
     * Check if redo is available
     */
    canRedo: (state): boolean => state.historyIndex < state.history.length - 1,

    /**
     * Get arcs connected to an element
     */
    getConnectedArcs() {
      const net = this.net
      return (elementId: string): Arc[] => {
        return net.arcs.filter(
          (arc) => arc.sourceId === elementId || arc.targetId === elementId
        )
      }
    },

    /**
     * Check if we can navigate back (in subprocess hierarchy)
     */
    canGoBack: (state): boolean => state.breadcrumb.length > 1,

    /**
     * Get the current navigation path as net names
     */
    currentPath(state): string[] {
      return state.breadcrumb.map((id) => state.nets[id]?.name || 'Unknown')
    },

    /**
     * Get breadcrumb items for navigation
     */
    breadcrumbItems(state): Array<{ id: string; name: string }> {
      return state.breadcrumb.map((id) => ({
        id,
        name: state.nets[id]?.name || 'Unknown',
      }))
    },

    /**
     * Check if currently viewing a subprocess
     */
    isInSubProcess: (state): boolean => state.breadcrumb.length > 1,
  },

  actions: {
    // ========== History Management ==========

    /**
     * Save current state to history
     */
    saveToHistory() {
      // Remove any future states if we're not at the end
      if (this.historyIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.historyIndex + 1)
      }

      // Deep clone all nets
      const snapshot = JSON.parse(JSON.stringify(this.nets))
      this.history.push(snapshot)

      // Limit history size
      if (this.history.length > this.maxHistorySize) {
        this.history.shift()
      } else {
        this.historyIndex++
      }
    },

    /**
     * Undo last action
     */
    undo() {
      if (this.canUndo) {
        this.historyIndex--
        this.nets = JSON.parse(JSON.stringify(this.history[this.historyIndex]))
        this.clearSelection()
      }
    },

    /**
     * Redo last undone action
     */
    redo() {
      if (this.canRedo) {
        this.historyIndex++
        this.nets = JSON.parse(JSON.stringify(this.history[this.historyIndex]))
        this.clearSelection()
      }
    },

    // ========== Place Operations ==========

    /**
     * Add a new place
     */
    addPlace(position: Position, name?: string): Place {
      this.saveToHistory()
      const net = this.nets[this.activeNetId]

      const place: Place = {
        id: nanoid(),
        name: name || `P${net.places.length + 1}`,
        position,
        tokens: DEFAULTS.place.tokens,
        capacity: DEFAULTS.place.capacity,
      }

      net.places.push(place)
      return place
    },

    /**
     * Update a place
     */
    updatePlace(id: string, updates: Partial<Omit<Place, 'id'>>) {
      const net = this.nets[this.activeNetId]
      const place = net.places.find((p) => p.id === id)
      if (place) {
        this.saveToHistory()
        Object.assign(place, updates)
      }
    },

    // ========== Transition Operations ==========

    /**
     * Add a new transition
     */
    addTransition(position: Position, name?: string): Transition {
      this.saveToHistory()
      const net = this.nets[this.activeNetId]

      const transition: Transition = {
        id: nanoid(),
        name: name || `T${net.transitions.length + 1}`,
        position,
      }

      net.transitions.push(transition)
      return transition
    },

    /**
     * Update a transition
     */
    updateTransition(id: string, updates: Partial<Omit<Transition, 'id'>>) {
      const net = this.nets[this.activeNetId]
      const transition = net.transitions.find((t) => t.id === id)
      if (transition) {
        this.saveToHistory()
        Object.assign(transition, updates)
      }
    },

    // ========== Operator Operations ==========

    /**
     * Set the selected operator type for the operator tool
     */
    setSelectedOperatorType(type: OperatorType) {
      this.selectedOperatorType = type
    },

    /**
     * Add a new operator
     */
    addOperator(position: Position, operatorType?: OperatorType, name?: string): OperatorTransition {
      this.saveToHistory()
      const net = this.nets[this.activeNetId]

      const type = operatorType || this.selectedOperatorType
      const operator: OperatorTransition = {
        id: nanoid(),
        name: name || `Op${net.operators.length + 1}`,
        position,
        operatorType: type,
      }

      net.operators.push(operator)
      return operator
    },

    /**
     * Update an operator
     */
    updateOperator(id: string, updates: Partial<Omit<OperatorTransition, 'id'>>) {
      const net = this.nets[this.activeNetId]
      const operator = net.operators.find((o) => o.id === id)
      if (operator) {
        this.saveToHistory()
        Object.assign(operator, updates)
      }
    },

    // ========== SubProcess Operations ==========

    /**
     * Add a new subprocess
     */
    addSubProcess(position: Position, name?: string): SubProcess {
      this.saveToHistory()
      const net = this.nets[this.activeNetId]

      // Ensure subProcesses array exists
      if (!net.subProcesses) {
        net.subProcesses = []
      }

      // Generate default name
      const defaultName = name || `Sub ${net.subProcesses.length + 1}`

      // Create the sub-net with the same name
      const subNetId = nanoid()
      const subNet = createEmptyNet(subNetId, defaultName, this.activeNetId)
      this.nets[subNetId] = subNet

      // Create the subprocess element
      const subprocess: SubProcess = {
        id: nanoid(),
        name: defaultName,
        position,
        subNetId,
        collapsed: true,
      }

      net.subProcesses.push(subprocess)
      return subprocess
    },

    /**
     * Update a subprocess
     */
    updateSubProcess(id: string, updates: Partial<Omit<SubProcess, 'id'>>) {
      const net = this.nets[this.activeNetId]
      const subprocess = (net.subProcesses || []).find((s) => s.id === id)
      if (subprocess) {
        this.saveToHistory()
        Object.assign(subprocess, updates)
        
        // Sync name to subnet if name was updated
        if (updates.name && this.nets[subprocess.subNetId]) {
          this.nets[subprocess.subNetId].name = updates.name
        }
      }
    },

    /**
     * Open a subprocess (navigate into it)
     */
    openSubProcess(subProcessId: string) {
      const net = this.nets[this.activeNetId]
      const subprocess = (net.subProcesses || []).find((s) => s.id === subProcessId)
      if (subprocess && this.nets[subprocess.subNetId]) {
        // Add the subprocess's subnet to the breadcrumb path
        this.breadcrumb.push(subprocess.subNetId)
        this.activeNetId = subprocess.subNetId
        this.clearSelection()
        // Reset viewport for new net
        this.viewport = { x: 0, y: 0, scale: 1, rotation: 0 }
      }
    },

    /**
     * Navigate back to parent net
     */
    goBack() {
      if (this.breadcrumb.length > 1) {
        // Remove current net from breadcrumb
        this.breadcrumb.pop()
        // Set active to the new last item (parent)
        this.activeNetId = this.breadcrumb[this.breadcrumb.length - 1]
        this.clearSelection()
      }
    },

    /**
     * Navigate to a specific net in the breadcrumb
     */
    navigateTo(netId: string) {
      const index = this.breadcrumb.indexOf(netId)
      if (index !== -1) {
        // Remove all entries after this one
        this.breadcrumb = this.breadcrumb.slice(0, index + 1)
        this.activeNetId = netId
        this.clearSelection()
      }
    },

    // ========== Arc Operations ==========

    /**
     * Add a new arc
     */
    addArc(sourceId: string, targetId: string): Arc | null {
      const net = this.nets[this.activeNetId]
      
      // Validate: source and target must be different types
      const sourceType = this.getElementType(sourceId)
      const targetType = this.getElementType(targetId)

      if (!sourceType || !targetType) return null
      if (sourceType === 'arc' || targetType === 'arc') return null

      // Normalize types: operators and subprocesses behave like transitions
      const normalizedSource = (sourceType === 'operator' || sourceType === 'subprocess') ? 'transition' : sourceType
      const normalizedTarget = (targetType === 'operator' || targetType === 'subprocess') ? 'transition' : targetType

      // Source and target must be different types (place <-> transition/operator/subprocess)
      if (normalizedSource === normalizedTarget) return null

      // Check if arc already exists
      const exists = net.arcs.some(
        (a) => a.sourceId === sourceId && a.targetId === targetId
      )
      if (exists) return null

      this.saveToHistory()

      const arc: Arc = {
        id: nanoid(),
        sourceId,
        targetId,
        weight: DEFAULTS.arc.weight,
        waypoints: [],
      }

      net.arcs.push(arc)
      return arc
    },

    /**
     * Add a successor element and connect it with an arc (Camunda-style quick connect).
     * Single undo step for element + arc creation.
     */
    quickConnectAdd(
      sourceId: string,
      targetKind: QuickConnectTarget,
      operatorType?: OperatorType,
    ): string | null {
      const net = this.nets[this.activeNetId]
      const getType = this.getElementType
      const sourceType = getType(sourceId)
      if (!sourceType || sourceType === 'arc') return null
      if (!isValidQuickConnect(sourceType, targetKind)) return null

      const sourceEl = this.getElementById(sourceId)
      if (!sourceEl || !('position' in sourceEl)) return null

      const outgoingCount = net.arcs.filter((a) => a.sourceId === sourceId).length
      let position = computeQuickConnectPosition(
        sourceEl.position,
        sourceType,
        targetKind,
        outgoingCount,
      )

      const configStore = useConfigStore()
      if (configStore.$state.editor.snapToGrid) {
        position = snapToGrid(position, configStore.$state.editor.gridSize)
      }

      this.saveToHistory()

      let newId: string

      switch (targetKind) {
        case 'place': {
          const place: Place = {
            id: nanoid(),
            name: `P${net.places.length + 1}`,
            position,
            tokens: DEFAULTS.place.tokens,
            capacity: DEFAULTS.place.capacity,
          }
          net.places.push(place)
          newId = place.id
          break
        }
        case 'transition': {
          const transition: Transition = {
            id: nanoid(),
            name: `T${net.transitions.length + 1}`,
            position,
          }
          net.transitions.push(transition)
          newId = transition.id
          break
        }
        case 'operator': {
          const operator: OperatorTransition = {
            id: nanoid(),
            name: `Op${net.operators.length + 1}`,
            position,
            operatorType: operatorType ?? this.selectedOperatorType,
          }
          net.operators.push(operator)
          newId = operator.id
          break
        }
        case 'subprocess': {
          if (!net.subProcesses) net.subProcesses = []
          const defaultName = `Sub ${net.subProcesses.length + 1}`
          const subNetId = nanoid()
          this.nets[subNetId] = createEmptyNet(subNetId, defaultName, this.activeNetId)
          const subprocess: SubProcess = {
            id: nanoid(),
            name: defaultName,
            position,
            subNetId,
            collapsed: true,
          }
          net.subProcesses.push(subprocess)
          newId = subprocess.id
          break
        }
        default:
          return null
      }

      net.arcs.push({
        id: nanoid(),
        sourceId,
        targetId: newId,
        weight: DEFAULTS.arc.weight,
        waypoints: [],
      })

      this.select(newId, false)
      return newId
    },

    /**
     * Update an arc
     */
    updateArc(id: string, updates: Partial<Omit<Arc, 'id'>>) {
      const net = this.nets[this.activeNetId]
      const arc = net.arcs.find((a) => a.id === id)
      if (arc) {
        this.saveToHistory()
        Object.assign(arc, updates)
      }
    },

    // ========== Delete Operations ==========

    /**
     * Delete an element by ID
     */
    deleteElement(id: string) {
      this.saveToHistory()
      const net = this.nets[this.activeNetId]

      // Remove from places
      const placeIndex = net.places.findIndex((p) => p.id === id)
      if (placeIndex !== -1) {
        net.places.splice(placeIndex, 1)
        // Remove connected arcs
        net.arcs = net.arcs.filter(
          (a) => a.sourceId !== id && a.targetId !== id
        )
        this.selectedIds = this.selectedIds.filter((sid) => sid !== id)
        return
      }

      // Remove from transitions
      const transIndex = net.transitions.findIndex((t) => t.id === id)
      if (transIndex !== -1) {
        net.transitions.splice(transIndex, 1)
        // Remove connected arcs
        net.arcs = net.arcs.filter(
          (a) => a.sourceId !== id && a.targetId !== id
        )
        this.selectedIds = this.selectedIds.filter((sid) => sid !== id)
        return
      }

      // Remove from operators
      const opIndex = net.operators.findIndex((o) => o.id === id)
      if (opIndex !== -1) {
        net.operators.splice(opIndex, 1)
        // Remove connected arcs
        net.arcs = net.arcs.filter(
          (a) => a.sourceId !== id && a.targetId !== id
        )
        this.selectedIds = this.selectedIds.filter((sid) => sid !== id)
        return
      }

      // Remove from subprocesses
      if (net.subProcesses) {
        const subIndex = net.subProcesses.findIndex((s) => s.id === id)
        if (subIndex !== -1) {
          const subprocess = net.subProcesses[subIndex]
          // Also delete the sub-net
          delete this.nets[subprocess.subNetId]
          net.subProcesses.splice(subIndex, 1)
          // Remove connected arcs
          net.arcs = net.arcs.filter(
            (a) => a.sourceId !== id && a.targetId !== id
          )
          this.selectedIds = this.selectedIds.filter((sid) => sid !== id)
          return
        }
      }

      // Remove from arcs
      const arcIndex = net.arcs.findIndex((a) => a.id === id)
      if (arcIndex !== -1) {
        net.arcs.splice(arcIndex, 1)
        this.selectedIds = this.selectedIds.filter((sid) => sid !== id)
      }
    },

    /**
     * Delete all selected elements
     */
    deleteSelected() {
      if (this.selectedIds.length === 0) return

      this.saveToHistory()
      const net = this.nets[this.activeNetId]

      for (const id of [...this.selectedIds]) {
        // Remove from places
        const placeIndex = net.places.findIndex((p) => p.id === id)
        if (placeIndex !== -1) {
          net.places.splice(placeIndex, 1)
          net.arcs = net.arcs.filter(
            (a) => a.sourceId !== id && a.targetId !== id
          )
          continue
        }

        // Remove from transitions
        const transIndex = net.transitions.findIndex((t) => t.id === id)
        if (transIndex !== -1) {
          net.transitions.splice(transIndex, 1)
          net.arcs = net.arcs.filter(
            (a) => a.sourceId !== id && a.targetId !== id
          )
          continue
        }

        // Remove from operators
        const opIndex = net.operators.findIndex((o) => o.id === id)
        if (opIndex !== -1) {
          net.operators.splice(opIndex, 1)
          net.arcs = net.arcs.filter(
            (a) => a.sourceId !== id && a.targetId !== id
          )
          continue
        }

        // Remove from subprocesses
        if (net.subProcesses) {
          const subIndex = net.subProcesses.findIndex((s) => s.id === id)
          if (subIndex !== -1) {
            const subprocess = net.subProcesses[subIndex]
            delete this.nets[subprocess.subNetId]
            net.subProcesses.splice(subIndex, 1)
            net.arcs = net.arcs.filter(
              (a) => a.sourceId !== id && a.targetId !== id
            )
            continue
          }
        }

        // Remove from arcs
        const arcIndex = net.arcs.findIndex((a) => a.id === id)
        if (arcIndex !== -1) {
          net.arcs.splice(arcIndex, 1)
        }
      }

      this.selectedIds = []
    },

    // ========== Selection Management ==========

    /**
     * Select an element
     */
    select(id: string, multi: boolean = false) {
      if (multi) {
        // Toggle selection
        const index = this.selectedIds.indexOf(id)
        if (index === -1) {
          this.selectedIds.push(id)
        } else {
          this.selectedIds.splice(index, 1)
        }
      } else {
        // Single selection
        this.selectedIds = [id]
      }
    },

    /**
     * Clear all selections
     */
    clearSelection() {
      this.selectedIds = []
    },

    /**
     * Select multiple elements
     */
    selectMultiple(ids: string[], additive = false) {
      if (additive) {
        const merged = new Set([...this.selectedIds, ...ids])
        this.selectedIds = [...merged]
      } else {
        this.selectedIds = ids
      }
    },

    // ========== Tool Management ==========

    /**
     * Set the current tool
     */
    setTool(tool: Tool) {
      this.tool = tool
      this.cancelArcCreation()
    },

    // ========== Arc Creation State ==========

    /**
     * Start creating an arc from a source element
     */
    startArcCreation(sourceId: string, sourceType: 'place' | 'transition' | 'operator' | 'subprocess') {
      this.arcCreation = {
        isCreating: true,
        sourceId,
        sourceType: (sourceType === 'operator' || sourceType === 'subprocess') ? 'transition' : sourceType,
        tempEndPosition: null,
      }
    },

    /**
     * Update temporary end position during arc creation
     */
    updateArcTempEnd(position: Position) {
      this.arcCreation.tempEndPosition = position
    },

    /**
     * Complete arc creation
     */
    completeArcCreation(targetId: string): Arc | null {
      if (!this.arcCreation.isCreating || !this.arcCreation.sourceId) {
        return null
      }

      const arc = this.addArc(this.arcCreation.sourceId, targetId)
      this.cancelArcCreation()
      return arc
    },

    /**
     * Cancel arc creation
     */
    cancelArcCreation() {
      this.arcCreation = {
        isCreating: false,
        sourceId: null,
        sourceType: null,
        tempEndPosition: null,
      }
    },

    // ========== Viewport Management ==========

    /**
     * Set viewport position and scale
     */
    setViewport(viewport: Partial<ViewportState>) {
      Object.assign(this.viewport, viewport)
    },

    /**
     * Zoom in
     */
    zoomIn() {
      const newScale = Math.min(this.viewport.scale * 1.2, DEFAULTS.viewport.maxScale)
      this.viewport.scale = newScale
    },

    /**
     * Zoom out
     */
    zoomOut() {
      const newScale = Math.max(this.viewport.scale / 1.2, DEFAULTS.viewport.minScale)
      this.viewport.scale = newScale
    },

    rotateCW() {
      this.viewport.rotation = (this.viewport.rotation + 90) % 360
    },

    rotateCCW() {
      this.viewport.rotation = (this.viewport.rotation + 270) % 360
    },

    /**
     * Reset zoom to 100%
     */
    resetZoom() {
      this.viewport.scale = 1
    },

    // ========== Layout Operations ==========

    /**
     * Apply layout positions to all elements
     */
    applyLayout(positions: Map<string, Position>) {
      if (positions.size === 0) return

      this.saveToHistory()

      for (const [id, position] of positions) {
        this.moveElement(id, position)
      }
    },

    // ========== Move Operations ==========

    /**
     * Move an element to a new position
     */
    moveElement(id: string, position: Position) {
      const net = this.nets[this.activeNetId]
      
      const place = net.places.find((p) => p.id === id)
      if (place) {
        place.position = position
        return
      }

      const transition = net.transitions.find((t) => t.id === id)
      if (transition) {
        transition.position = position
        return
      }

      const operator = net.operators.find((o) => o.id === id)
      if (operator) {
        operator.position = position
        return
      }

      if (net.subProcesses) {
        const subprocess = net.subProcesses.find((s) => s.id === id)
        if (subprocess) {
          subprocess.position = position
        }
      }
    },

    /**
     * Move element with history save (for drag end)
     */
    moveElementWithHistory(id: string, position: Position) {
      this.saveToHistory()
      this.moveElement(id, position)
    },

    // ========== Net Operations ==========

    /**
     * Create a new empty net
     */
    newNet() {
      const mainNetId = nanoid()
      this.nets = {
        [mainNetId]: createEmptyNet(mainNetId, 'Main'),
      }
      this.activeNetId = mainNetId
      this.breadcrumb = [mainNetId]
      this.selectedIds = []
      this.history = []
      this.historyIndex = -1
      this.saveToHistory()
    },

    /**
     * Load a net from data (supports legacy single-net and new multi-net format)
     */
    loadNet(net: PetriNet) {
      const { net: loadedNet } = normalizePetriNet(
        JSON.parse(JSON.stringify(net)) as PetriNet,
      )
      this.nets = { [loadedNet.id]: loadedNet }
      this.activeNetId = loadedNet.id
      this.breadcrumb = [loadedNet.id]
      this.selectedIds = []
      this.history = []
      this.historyIndex = -1
      this.saveToHistory()
    },

    /**
     * Load multiple nets (for files with subprocesses)
     */
    loadNets(nets: Record<string, PetriNet>, mainNetId: string) {
      const cloned = JSON.parse(JSON.stringify(nets)) as Record<string, PetriNet>
      const normalized: Record<string, PetriNet> = {}
      for (const [id, net] of Object.entries(cloned)) {
        normalized[id] = normalizePetriNet(net).net
      }
      this.nets = normalized
      this.activeNetId = mainNetId
      this.breadcrumb = [mainNetId]
      this.selectedIds = []
      this.history = []
      this.historyIndex = -1
      this.saveToHistory()
    },

    /**
     * Get a net by ID
     */
    getNetById(netId: string): PetriNet | undefined {
      return this.nets[netId]
    },

    /**
     * Get all nets (for export)
     */
    getAllNets(): Record<string, PetriNet> {
      return this.nets
    },

    /**
     * Get the main (root) net ID
     */
    getMainNetId(): string {
      return this.breadcrumb[0]
    },

    /**
     * Initialize store with empty history
     */
    initialize() {
      this.saveToHistory()
    },
  },
})
