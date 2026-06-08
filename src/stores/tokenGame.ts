import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import { usePetriNetStore } from './petriNet'
import { useConfigStore } from './config'
import type {
  TokenGameState,
  TokenGameStatus,
  Marking,
  TokenAnimation,
  ConflictResolutionMode,
  SubprocessStackEntry,
  TokenGameStatistics,
} from '@/types/token-game'
import { DEFAULT_TOKEN_GAME_STATE, DEFAULT_TOKEN_GAME_SETTINGS, DEFAULT_TOKEN_GAME_STATISTICS } from '@/types/token-game'
import type { PetriNet, Arc, SubProcess } from '@/types/petri-net'

export const useTokenGameStore = defineStore('tokenGame', {
  state: (): TokenGameState => ({ ...DEFAULT_TOKEN_GAME_STATE }),

  getters: {
    /**
     * Check if we can step forward in history
     */
    canStepForward: (state): boolean => state.historyIndex < state.history.length - 1,

    /**
     * Check if we can step backward in history
     */
    canStepBackward: (state): boolean => state.historyIndex > 0,

    /**
     * Check if a transition is enabled
     */
    isTransitionEnabled:
      (state) =>
      (transitionId: string): boolean =>
        state.enabledTransitions.includes(transitionId),

    /**
     * Get token count at a place
     */
    tokensAt:
      (state) =>
      (placeId: string): number =>
        state.marking.tokens[placeId] ?? 0,

    /**
     * Check if the game is running
     */
    isRunning: (state): boolean => state.status !== 'stopped',

    /**
     * Check if the game is playing (auto mode)
     */
    isPlaying: (state): boolean => state.status === 'playing',

    /**
     * Check if the game is paused
     */
    isPaused: (state): boolean => state.status === 'paused',

    /**
     * Get current step number
     */
    currentStep: (state): number => state.historyIndex + 1,

    /**
     * Get total steps in history
     */
    totalSteps: (state): number => state.history.length,

    /**
     * Check if there's a deadlock (no enabled transitions or subprocesses)
     */
    isDeadlock: (state): boolean =>
      state.status !== 'stopped' && 
      state.enabledTransitions.length === 0 && 
      state.enabledSubprocesses.length === 0,

    /**
     * Check if we're currently inside a subprocess
     */
    isInSubprocess: (state): boolean => state.subprocessStack.length > 0,

    /**
     * Check if we can step out of current subprocess
     */
    canStepOut(): boolean {
      if (this.subprocessStack.length === 0) return false
      
      const petriNetStore = usePetriNetStore()
      const net = petriNetStore.net
      
      // If subnet is empty (no places), always allow step out
      if (net.places.length === 0) return true
      
      // If subnet has no transitions (deadlock by design), allow step out if no enabled transitions
      if (net.transitions.length === 0 && net.operators.length === 0 && (net.subProcesses || []).length === 0) {
        return true
      }
      
      // Find end places (places with no outgoing arcs)
      const placesWithOutgoing = new Set(
        net.arcs
          .filter((arc) => net.places.some((p) => p.id === arc.sourceId))
          .map((arc) => arc.sourceId)
      )
      const endPlaces = net.places
        .filter((place) => !placesWithOutgoing.has(place.id))
        .map((place) => place.id)

      // Can step out if any end place has tokens
      return endPlaces.some((placeId) => (this.marking.tokens[placeId] ?? 0) > 0)
    },

    /**
     * Get subprocess stack depth
     */
    subprocessDepth: (state): number => state.subprocessStack.length,

    /**
     * Check if there's a conflict (multiple enabled transitions)
     */
    hasConflict: (state): boolean => 
      state.enabledTransitions.length + state.enabledSubprocesses.length > 1,
  },

  actions: {
    /**
     * Initialize and start the token game
     */
    start() {
      const petriNetStore = usePetriNetStore()
      const configStore = useConfigStore()
      const net = petriNetStore.net

      // Apply settings from config
      this.autoPlayDelay = configStore.tokenGame.defaultSpeed
      this.conflictResolution = configStore.tokenGame.conflictResolution

      // Get initial marking from places
      const initialMarking = this.createMarking(net)

      this.marking = initialMarking
      this.history = [initialMarking]
      this.historyIndex = 0
      this.activeAnimations = []
      this.isAnimating = false

      // Reset statistics
      this.statistics = {
        ...DEFAULT_TOKEN_GAME_STATISTICS,
        startTime: Date.now(),
      }
      this.showConflictDialog = false

      this.updateEnabledTransitions()
      this.status = 'paused'
    },

    /**
     * Stop the token game
     */
    stop() {
      // Finalize statistics
      if (this.statistics.startTime > 0) {
        this.statistics.elapsedTime = Date.now() - this.statistics.startTime
      }

      // If in subprocess, navigate back to root
      if (this.subprocessStack.length > 0) {
        const petriNetStore = usePetriNetStore()
        const rootNetId = this.subprocessStack[0].parentNetId
        petriNetStore.navigateTo(rootNetId)
      }
      
      this.status = 'stopped'
      this.marking = { timestamp: 0, tokens: {} }
      this.history = []
      this.historyIndex = -1
      this.enabledTransitions = []
      this.enabledSubprocesses = []
      this.activeAnimations = []
      this.isAnimating = false
      this.subprocessStack = []
    },

    /**
     * Pause the token game
     */
    pause() {
      if (this.status === 'playing') {
        this.status = 'paused'
      }
    },

    /**
     * Resume auto-play
     */
    async resume() {
      if (this.status === 'paused') {
        await this.autoPlay()
      }
    },

    /**
     * Create marking from current net state
     */
    createMarking(net: PetriNet): Marking {
      const tokens: Record<string, number> = {}

      for (const place of net.places) {
        if (place.tokens > 0) {
          tokens[place.id] = place.tokens
        }
      }

      return {
        timestamp: Date.now(),
        tokens,
      }
    },

    /**
     * Update the list of enabled transitions and subprocesses
     */
    updateEnabledTransitions() {
      const petriNetStore = usePetriNetStore()
      const net = petriNetStore.net
      const enabledTransitions: string[] = []
      const enabledSubprocesses: string[] = []

      // Check regular transitions
      for (const transition of net.transitions) {
        if (this.isTransitionEnabledByMarking(transition.id, net)) {
          enabledTransitions.push(transition.id)
        }
      }

      // Check operators (they act like transitions)
      for (const operator of net.operators) {
        if (this.isTransitionEnabledByMarking(operator.id, net)) {
          enabledTransitions.push(operator.id)
        }
      }

      // Check subprocesses (they also act like transitions for enabling)
      if (net.subProcesses) {
        for (const subprocess of net.subProcesses) {
          if (this.isTransitionEnabledByMarking(subprocess.id, net)) {
            enabledSubprocesses.push(subprocess.id)
          }
        }
      }

      this.enabledTransitions = enabledTransitions
      this.enabledSubprocesses = enabledSubprocesses
    },

    /**
     * Get start places of a net (places with no incoming arcs)
     */
    getStartPlaces(net: PetriNet): string[] {
      const placesWithIncoming = new Set(
        net.arcs.filter(arc => net.places.some(p => p.id === arc.targetId))
          .map(arc => arc.targetId)
      )
      return net.places
        .filter(place => !placesWithIncoming.has(place.id))
        .map(place => place.id)
    },

    /**
     * Get end places of a net (places with no outgoing arcs)
     */
    getEndPlaces(net: PetriNet): string[] {
      const placesWithOutgoing = new Set(
        net.arcs.filter(arc => net.places.some(p => p.id === arc.sourceId))
          .map(arc => arc.sourceId)
      )
      return net.places
        .filter(place => !placesWithOutgoing.has(place.id))
        .map(place => place.id)
    },

    /**
     * Check if a transition is enabled given current marking
     */
    isTransitionEnabledByMarking(transitionId: string, net: PetriNet): boolean {
      // Get all input arcs (arcs leading to this transition)
      const inputArcs = net.arcs.filter((arc) => arc.targetId === transitionId)

      // Transition is enabled if all input places have enough tokens
      for (const arc of inputArcs) {
        const tokensAvailable = this.marking.tokens[arc.sourceId] ?? 0
        if (tokensAvailable < arc.weight) {
          return false
        }
      }

      // Must have at least one input arc to be enabled
      return inputArcs.length > 0
    },

    /**
     * Fire a transition
     */
    async fireTransition(transitionId: string) {
      if (!this.enabledTransitions.includes(transitionId)) {
        console.warn('Transition not enabled:', transitionId)
        return
      }

      if (this.isAnimating) {
        console.warn('Animation in progress')
        return
      }

      const petriNetStore = usePetriNetStore()
      const net = petriNetStore.net

      // Track conflict if multiple transitions were enabled
      if (this.enabledTransitions.length + this.enabledSubprocesses.length > 1) {
        this.statistics.conflictsEncountered++
      }

      // Start animation
      await this.animateTransition(transitionId, net)

      // Compute new marking
      const newMarking = this.computeNewMarking(transitionId, net)
      newMarking.firedTransition = transitionId

      // Truncate future history if we're not at the end
      if (this.historyIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.historyIndex + 1)
      }

      // Add to history
      this.history.push(newMarking)
      this.historyIndex++
      this.marking = newMarking

      // Update statistics
      this.statistics.totalSteps++
      this.statistics.transitionsFired++
      
      // Track per-transition statistics
      if (!this.statistics.transitionStats[transitionId]) {
        // Get transition name from net
        const transition = net.transitions.find(t => t.id === transitionId) ||
                          net.operators.find(o => o.id === transitionId)
        this.statistics.transitionStats[transitionId] = {
          transitionId,
          transitionName: transition?.name || transitionId,
          fireCount: 0,
        }
      }
      this.statistics.transitionStats[transitionId].fireCount++

      // Update enabled transitions
      this.updateEnabledTransitions()

      // Track deadlock
      if (this.enabledTransitions.length === 0 && this.enabledSubprocesses.length === 0) {
        this.statistics.deadlocksEncountered++
      }
    },

    /**
     * Compute new marking after firing a transition
     */
    computeNewMarking(transitionId: string, net: PetriNet): Marking {
      const newTokens = { ...this.marking.tokens }

      // Get input and output arcs
      const inputArcs = net.arcs.filter((arc) => arc.targetId === transitionId)
      const outputArcs = net.arcs.filter((arc) => arc.sourceId === transitionId)

      // Remove tokens from input places
      for (const arc of inputArcs) {
        const current = newTokens[arc.sourceId] ?? 0
        const newValue = current - arc.weight
        if (newValue > 0) {
          newTokens[arc.sourceId] = newValue
        } else {
          delete newTokens[arc.sourceId]
        }
      }

      // Add tokens to output places
      for (const arc of outputArcs) {
        const current = newTokens[arc.targetId] ?? 0
        newTokens[arc.targetId] = current + arc.weight
      }

      return {
        timestamp: Date.now(),
        tokens: newTokens,
      }
    },

    /**
     * Animate token movement through transition
     */
    async animateTransition(transitionId: string, net: PetriNet): Promise<void> {
      const petriNetStore = usePetriNetStore()
      const duration = DEFAULT_TOKEN_GAME_SETTINGS.animationDuration

      // Get transition position (could be transition, operator, or subprocess)
      const transition =
        net.transitions.find((t) => t.id === transitionId) ||
        net.operators.find((o) => o.id === transitionId) ||
        (net.subProcesses || []).find((s) => s.id === transitionId)

      if (!transition) return

      // Get input and output arcs
      const inputArcs = net.arcs.filter((arc) => arc.targetId === transitionId)
      const outputArcs = net.arcs.filter((arc) => arc.sourceId === transitionId)

      // Create animations for input tokens (moving to transition)
      const inputAnimations: TokenAnimation[] = []
      for (const arc of inputArcs) {
        const place = net.places.find((p) => p.id === arc.sourceId)
        if (place) {
          for (let i = 0; i < arc.weight; i++) {
            inputAnimations.push({
              id: nanoid(),
              fromPlaceId: arc.sourceId,
              toPlaceId: '',
              transitionId,
              progress: 0,
              startPos: { ...place.position },
              endPos: { ...transition.position },
            })
          }
        }
      }

      // Animate tokens moving to transition
      this.isAnimating = true
      this.activeAnimations = inputAnimations

      await this.runAnimation(duration / 2)

      // Create animations for output tokens (moving from transition)
      const outputAnimations: TokenAnimation[] = []
      for (const arc of outputArcs) {
        const place = net.places.find((p) => p.id === arc.targetId)
        if (place) {
          for (let i = 0; i < arc.weight; i++) {
            outputAnimations.push({
              id: nanoid(),
              fromPlaceId: '',
              toPlaceId: arc.targetId,
              transitionId,
              progress: 0,
              startPos: { ...transition.position },
              endPos: { ...place.position },
            })
          }
        }
      }

      // Animate tokens moving from transition
      this.activeAnimations = outputAnimations
      await this.runAnimation(duration / 2)

      this.activeAnimations = []
      this.isAnimating = false
    },

    /**
     * Run animation loop
     */
    runAnimation(duration: number): Promise<void> {
      return new Promise((resolve) => {
        const startTime = performance.now()

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime
          const progress = Math.min(elapsed / duration, 1)

          // Update all animation progress
          for (const anim of this.activeAnimations) {
            anim.progress = this.easeInOutQuad(progress)
          }

          if (progress < 1) {
            requestAnimationFrame(animate)
          } else {
            resolve()
          }
        }

        requestAnimationFrame(animate)
      })
    },

    /**
     * Easing function for smooth animation
     */
    easeInOutQuad(t: number): number {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    },

    /**
     * Step forward in history
     */
    stepForward() {
      if (this.canStepForward) {
        this.historyIndex++
        this.marking = this.history[this.historyIndex]
        this.updateEnabledTransitions()
      }
    },

    /**
     * Step backward in history
     */
    stepBackward() {
      if (this.canStepBackward) {
        this.historyIndex--
        this.marking = this.history[this.historyIndex]
        this.updateEnabledTransitions()
      }
    },

    /**
     * Go to beginning of history
     */
    goToStart() {
      if (this.history.length > 0) {
        this.historyIndex = 0
        this.marking = this.history[0]
        this.updateEnabledTransitions()
      }
    },

    /**
     * Go to end of history
     */
    goToEnd() {
      if (this.history.length > 0) {
        this.historyIndex = this.history.length - 1
        this.marking = this.history[this.historyIndex]
        this.updateEnabledTransitions()
      }
    },

    /**
     * Auto-play: automatically fire transitions and step into/out of subprocesses
     */
    async autoPlay() {
      this.status = 'playing'
      this.statistics.autoPlayCount++

      while (this.status === 'playing') {
        const totalEnabled = this.enabledTransitions.length + this.enabledSubprocesses.length
        
        // Check if we can step out of a subprocess (when no other options)
        if (totalEnabled === 0 && this.subprocessStack.length > 0 && this.canStepOut) {
          await this.stepOutOfSubprocess()
          await this.sleep(this.autoPlayDelay)
          continue
        }
        
        // No enabled elements and can't step out - stop
        if (totalEnabled === 0) {
          break
        }

        const selection = this.selectNextAction()
        if (selection) {
          if (selection.type === 'transition') {
            await this.fireTransition(selection.id)
          } else if (selection.type === 'subprocess') {
            await this.stepIntoSubprocess(selection.id)
          }
          await this.sleep(this.autoPlayDelay)
        } else {
          break
        }
      }

      if (this.status === 'playing') {
        this.status = 'paused'
      }
    },

    /**
     * Select next action (transition or subprocess) based on conflict resolution mode
     */
    selectNextAction(): { type: 'transition' | 'subprocess'; id: string } | null {
      const allEnabled: { type: 'transition' | 'subprocess'; id: string }[] = [
        ...this.enabledTransitions.map(id => ({ type: 'transition' as const, id })),
        ...this.enabledSubprocesses.map(id => ({ type: 'subprocess' as const, id })),
      ]

      if (allEnabled.length === 0) return null
      if (allEnabled.length === 1) return allEnabled[0]

      switch (this.conflictResolution) {
        case 'random':
          const randomIndex = Math.floor(Math.random() * allEnabled.length)
          return allEnabled[randomIndex]
        case 'priority':
          return allEnabled[0]
        case 'manual':
        default:
          // In manual mode, pause and let user decide
          this.status = 'paused'
          return null
      }
    },

    /**
     * Select which transition to fire (based on conflict resolution mode)
     * @deprecated Use selectNextAction for subprocess support
     */
    selectTransition(): string | null {
      if (this.enabledTransitions.length === 0) return null
      if (this.enabledTransitions.length === 1) return this.enabledTransitions[0]

      switch (this.conflictResolution) {
        case 'random':
          const randomIndex = Math.floor(Math.random() * this.enabledTransitions.length)
          return this.enabledTransitions[randomIndex]
        case 'priority':
          return this.enabledTransitions[0]
        case 'manual':
        default:
          this.status = 'paused'
          return null
      }
    },

    /**
     * Set auto-play delay
     */
    setAutoPlayDelay(delay: number) {
      this.autoPlayDelay = Math.max(100, Math.min(5000, delay))
    },

    /**
     * Set conflict resolution mode
     */
    setConflictResolution(mode: ConflictResolutionMode) {
      this.conflictResolution = mode
    },

    /**
     * Helper: sleep for specified duration
     */
    sleep(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms))
    },

    /**
     * Reset to initial marking
     */
    reset() {
      if (this.history.length > 0) {
        this.historyIndex = 0
        this.marking = this.history[0]
        this.history = [this.marking]
        this.updateEnabledTransitions()
      }
    },

    // ========== Subprocess Support ==========

    /**
     * Step into a subprocess
     */
    async stepIntoSubprocess(subprocessId: string) {
      if (!this.enabledSubprocesses.includes(subprocessId)) {
        console.warn('Subprocess not enabled:', subprocessId)
        return
      }

      if (this.isAnimating) {
        console.warn('Animation in progress')
        return
      }

      const petriNetStore = usePetriNetStore()
      const net = petriNetStore.net

      // Find the subprocess element
      const subprocess = (net.subProcesses || []).find(s => s.id === subprocessId)
      if (!subprocess) {
        console.warn('Subprocess not found:', subprocessId)
        return
      }

      // Get the subnet
      const subNet = petriNetStore.getNetById(subprocess.subNetId)
      if (!subNet) {
        console.warn('Subnet not found:', subprocess.subNetId)
        return
      }

      // Animate tokens moving into the subprocess
      await this.animateTransition(subprocessId, net)

      // Consume tokens from input places of the subprocess
      const inputArcs = net.arcs.filter(arc => arc.targetId === subprocessId)
      const newParentTokens = { ...this.marking.tokens }
      
      for (const arc of inputArcs) {
        const current = newParentTokens[arc.sourceId] ?? 0
        const newValue = current - arc.weight
        if (newValue > 0) {
          newParentTokens[arc.sourceId] = newValue
        } else {
          delete newParentTokens[arc.sourceId]
        }
      }

      // Save parent state to stack
      const parentState: SubprocessStackEntry = {
        parentNetId: petriNetStore.activeNetId,
        subprocessId: subprocessId,
        parentMarking: { 
          timestamp: Date.now(), 
          tokens: newParentTokens 
        },
        parentHistory: [...this.history],
        parentHistoryIndex: this.historyIndex,
      }
      this.subprocessStack.push(parentState)

      // Navigate into the subprocess
      petriNetStore.openSubProcess(subprocessId)

      // Initialize marking for the subprocess
      // Put tokens on start places (places with no incoming arcs)
      const startPlaces = this.getStartPlaces(subNet)
      const subNetTokens: Record<string, number> = {}
      
      for (const placeId of startPlaces) {
        subNetTokens[placeId] = 1 // Put 1 token on each start place
      }

      const initialSubMarking: Marking = {
        timestamp: Date.now(),
        tokens: subNetTokens,
      }

      this.marking = initialSubMarking
      this.history = [initialSubMarking]
      this.historyIndex = 0

      // Track statistics
      this.statistics.totalSteps++
      this.statistics.subprocessEntries++

      this.updateEnabledTransitions()
    },

    /**
     * Show/hide conflict dialog
     */
    setShowConflictDialog(show: boolean) {
      this.showConflictDialog = show
    },

    /**
     * Step out of current subprocess back to parent
     */
    async stepOutOfSubprocess() {
      if (this.subprocessStack.length === 0) {
        console.warn('Not in a subprocess')
        return
      }

      if (this.isAnimating) {
        console.warn('Animation in progress')
        return
      }

      const petriNetStore = usePetriNetStore()
      const currentNet = petriNetStore.net

      // Check if subnet is empty or has no active elements - allow exit
      const isEmptySubnet = currentNet.places.length === 0
      const hasNoActiveElements = currentNet.transitions.length === 0 && 
                                   currentNet.operators.length === 0 && 
                                   (currentNet.subProcesses || []).length === 0

      // Check if we can step out (end places have tokens OR subnet is empty/inactive)
      if (!isEmptySubnet && !hasNoActiveElements) {
        const endPlaces = this.getEndPlaces(currentNet)
        const hasTokensOnEnd = endPlaces.some(placeId => (this.marking.tokens[placeId] ?? 0) > 0)
        
        if (!hasTokensOnEnd) {
          console.warn('Cannot step out: no tokens on end places')
          return
        }
      }

      // Pop parent state from stack
      const parentState = this.subprocessStack.pop()!

      // Navigate back to parent
      petriNetStore.navigateTo(parentState.parentNetId)

      // Get the parent net and subprocess
      const parentNet = petriNetStore.net
      const subprocess = (parentNet.subProcesses || []).find(s => s.id === parentState.subprocessId)

      // Restore parent marking and add tokens to output places
      const restoredTokens = { ...parentState.parentMarking.tokens }

      if (subprocess) {
        // Add tokens to output places of the subprocess
        const outputArcs = parentNet.arcs.filter(arc => arc.sourceId === parentState.subprocessId)
        for (const arc of outputArcs) {
          const current = restoredTokens[arc.targetId] ?? 0
          restoredTokens[arc.targetId] = current + arc.weight
        }
      }

      const restoredMarking: Marking = {
        timestamp: Date.now(),
        tokens: restoredTokens,
        firedTransition: parentState.subprocessId,
      }

      // Restore history and add new marking
      this.history = [...parentState.parentHistory, restoredMarking]
      this.historyIndex = this.history.length - 1
      this.marking = restoredMarking

      this.updateEnabledTransitions()
    },

    /**
     * Check if a subprocess is enabled
     */
    isSubprocessEnabled(subprocessId: string): boolean {
      return this.enabledSubprocesses.includes(subprocessId)
    },
  },
})
