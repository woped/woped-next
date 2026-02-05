import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import type {
  PetriNet,
  Place,
  Transition,
  OperatorTransition,
  Arc,
  Position,
  Tool,
  ArcCreationState,
  ViewportState,
  PetriNetElement,
} from '@/types/petri-net'
import { DEFAULTS, OperatorType } from '@/types/petri-net'

interface PetriNetState {
  net: PetriNet
  selectedIds: string[]
  tool: Tool
  selectedOperatorType: OperatorType
  arcCreation: ArcCreationState
  viewport: ViewportState
  history: PetriNet[]
  historyIndex: number
  maxHistorySize: number
}

export const usePetriNetStore = defineStore('petriNet', {
  state: (): PetriNetState => ({
    net: {
      id: nanoid(),
      name: 'New Petri Net',
      places: [],
      transitions: [],
      operators: [],
      arcs: [],
    },
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
    },
    history: [],
    historyIndex: -1,
    maxHistorySize: 50,
  }),

  getters: {
    /**
     * Get all places
     */
    places: (state): Place[] => state.net.places,

    /**
     * Get all transitions
     */
    transitions: (state): Transition[] => state.net.transitions,

    /**
     * Get all operators
     */
    operators: (state): OperatorTransition[] => state.net.operators,

    /**
     * Get all arcs
     */
    arcs: (state): Arc[] => state.net.arcs,

    /**
     * Get selected elements
     */
    selectedElements: (state): PetriNetElement[] => {
      const elements: PetriNetElement[] = []
      for (const id of state.selectedIds) {
        const place = state.net.places.find((p) => p.id === id)
        if (place) {
          elements.push(place)
          continue
        }
        const transition = state.net.transitions.find((t) => t.id === id)
        if (transition) {
          elements.push(transition)
          continue
        }
        const operator = state.net.operators.find((o) => o.id === id)
        if (operator) {
          elements.push(operator)
          continue
        }
        const arc = state.net.arcs.find((a) => a.id === id)
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
    getElementById:
      (state) =>
      (id: string): PetriNetElement | undefined => {
        return (
          state.net.places.find((p) => p.id === id) ||
          state.net.transitions.find((t) => t.id === id) ||
          state.net.operators.find((o) => o.id === id) ||
          state.net.arcs.find((a) => a.id === id)
        )
      },

    /**
     * Get element type by ID
     */
    getElementType:
      (state) =>
      (id: string): 'place' | 'transition' | 'operator' | 'arc' | null => {
        if (state.net.places.find((p) => p.id === id)) return 'place'
        if (state.net.transitions.find((t) => t.id === id)) return 'transition'
        if (state.net.operators.find((o) => o.id === id)) return 'operator'
        if (state.net.arcs.find((a) => a.id === id)) return 'arc'
        return null
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
    getConnectedArcs:
      (state) =>
      (elementId: string): Arc[] => {
        return state.net.arcs.filter(
          (arc) => arc.sourceId === elementId || arc.targetId === elementId
        )
      },
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

      // Deep clone the current net
      const snapshot = JSON.parse(JSON.stringify(this.net))
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
        this.net = JSON.parse(JSON.stringify(this.history[this.historyIndex]))
        this.clearSelection()
      }
    },

    /**
     * Redo last undone action
     */
    redo() {
      if (this.canRedo) {
        this.historyIndex++
        this.net = JSON.parse(JSON.stringify(this.history[this.historyIndex]))
        this.clearSelection()
      }
    },

    // ========== Place Operations ==========

    /**
     * Add a new place
     */
    addPlace(position: Position, name?: string): Place {
      this.saveToHistory()

      const place: Place = {
        id: nanoid(),
        name: name || `P${this.net.places.length + 1}`,
        position,
        tokens: DEFAULTS.place.tokens,
        capacity: DEFAULTS.place.capacity,
      }

      this.net.places.push(place)
      return place
    },

    /**
     * Update a place
     */
    updatePlace(id: string, updates: Partial<Omit<Place, 'id'>>) {
      const place = this.net.places.find((p) => p.id === id)
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

      const transition: Transition = {
        id: nanoid(),
        name: name || `T${this.net.transitions.length + 1}`,
        position,
      }

      this.net.transitions.push(transition)
      return transition
    },

    /**
     * Update a transition
     */
    updateTransition(id: string, updates: Partial<Omit<Transition, 'id'>>) {
      const transition = this.net.transitions.find((t) => t.id === id)
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

      const type = operatorType || this.selectedOperatorType
      const operator: OperatorTransition = {
        id: nanoid(),
        name: name || `Op${this.net.operators.length + 1}`,
        position,
        operatorType: type,
      }

      this.net.operators.push(operator)
      return operator
    },

    /**
     * Update an operator
     */
    updateOperator(id: string, updates: Partial<Omit<OperatorTransition, 'id'>>) {
      const operator = this.net.operators.find((o) => o.id === id)
      if (operator) {
        this.saveToHistory()
        Object.assign(operator, updates)
      }
    },

    // ========== Arc Operations ==========

    /**
     * Add a new arc
     */
    addArc(sourceId: string, targetId: string): Arc | null {
      // Validate: source and target must be different types
      const sourceType = this.getElementType(sourceId)
      const targetType = this.getElementType(targetId)

      if (!sourceType || !targetType) return null
      if (sourceType === 'arc' || targetType === 'arc') return null

      // Normalize types: operators behave like transitions
      const normalizedSource = sourceType === 'operator' ? 'transition' : sourceType
      const normalizedTarget = targetType === 'operator' ? 'transition' : targetType

      // Source and target must be different types (place <-> transition/operator)
      if (normalizedSource === normalizedTarget) return null

      // Check if arc already exists
      const exists = this.net.arcs.some(
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

      this.net.arcs.push(arc)
      return arc
    },

    /**
     * Update an arc
     */
    updateArc(id: string, updates: Partial<Omit<Arc, 'id'>>) {
      const arc = this.net.arcs.find((a) => a.id === id)
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

      // Remove from places
      const placeIndex = this.net.places.findIndex((p) => p.id === id)
      if (placeIndex !== -1) {
        this.net.places.splice(placeIndex, 1)
        // Remove connected arcs
        this.net.arcs = this.net.arcs.filter(
          (a) => a.sourceId !== id && a.targetId !== id
        )
        this.selectedIds = this.selectedIds.filter((sid) => sid !== id)
        return
      }

      // Remove from transitions
      const transIndex = this.net.transitions.findIndex((t) => t.id === id)
      if (transIndex !== -1) {
        this.net.transitions.splice(transIndex, 1)
        // Remove connected arcs
        this.net.arcs = this.net.arcs.filter(
          (a) => a.sourceId !== id && a.targetId !== id
        )
        this.selectedIds = this.selectedIds.filter((sid) => sid !== id)
        return
      }

      // Remove from operators
      const opIndex = this.net.operators.findIndex((o) => o.id === id)
      if (opIndex !== -1) {
        this.net.operators.splice(opIndex, 1)
        // Remove connected arcs
        this.net.arcs = this.net.arcs.filter(
          (a) => a.sourceId !== id && a.targetId !== id
        )
        this.selectedIds = this.selectedIds.filter((sid) => sid !== id)
        return
      }

      // Remove from arcs
      const arcIndex = this.net.arcs.findIndex((a) => a.id === id)
      if (arcIndex !== -1) {
        this.net.arcs.splice(arcIndex, 1)
        this.selectedIds = this.selectedIds.filter((sid) => sid !== id)
      }
    },

    /**
     * Delete all selected elements
     */
    deleteSelected() {
      if (this.selectedIds.length === 0) return

      this.saveToHistory()

      for (const id of [...this.selectedIds]) {
        // Remove from places
        const placeIndex = this.net.places.findIndex((p) => p.id === id)
        if (placeIndex !== -1) {
          this.net.places.splice(placeIndex, 1)
          this.net.arcs = this.net.arcs.filter(
            (a) => a.sourceId !== id && a.targetId !== id
          )
          continue
        }

        // Remove from transitions
        const transIndex = this.net.transitions.findIndex((t) => t.id === id)
        if (transIndex !== -1) {
          this.net.transitions.splice(transIndex, 1)
          this.net.arcs = this.net.arcs.filter(
            (a) => a.sourceId !== id && a.targetId !== id
          )
          continue
        }

        // Remove from operators
        const opIndex = this.net.operators.findIndex((o) => o.id === id)
        if (opIndex !== -1) {
          this.net.operators.splice(opIndex, 1)
          this.net.arcs = this.net.arcs.filter(
            (a) => a.sourceId !== id && a.targetId !== id
          )
          continue
        }

        // Remove from arcs
        const arcIndex = this.net.arcs.findIndex((a) => a.id === id)
        if (arcIndex !== -1) {
          this.net.arcs.splice(arcIndex, 1)
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
    selectMultiple(ids: string[]) {
      this.selectedIds = ids
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
    startArcCreation(sourceId: string, sourceType: 'place' | 'transition' | 'operator') {
      this.arcCreation = {
        isCreating: true,
        sourceId,
        sourceType: sourceType === 'operator' ? 'transition' : sourceType,
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
      const place = this.net.places.find((p) => p.id === id)
      if (place) {
        place.position = position
        return
      }

      const transition = this.net.transitions.find((t) => t.id === id)
      if (transition) {
        transition.position = position
        return
      }

      const operator = this.net.operators.find((o) => o.id === id)
      if (operator) {
        operator.position = position
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
      this.net = {
        id: nanoid(),
        name: 'New Petri Net',
        places: [],
        transitions: [],
        operators: [],
        arcs: [],
      }
      this.selectedIds = []
      this.history = []
      this.historyIndex = -1
      this.saveToHistory()
    },

    /**
     * Load a net from data
     */
    loadNet(net: PetriNet) {
      this.net = JSON.parse(JSON.stringify(net))
      this.selectedIds = []
      this.history = []
      this.historyIndex = -1
      this.saveToHistory()
    },

    /**
     * Initialize store with empty history
     */
    initialize() {
      this.saveToHistory()
    },
  },
})
