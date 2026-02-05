import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import { usePetriNetStore } from './petriNet'
import type {
  TokenGameState,
  TokenGameStatus,
  Marking,
  TokenAnimation,
  ConflictResolutionMode,
} from '@/types/token-game'
import { DEFAULT_TOKEN_GAME_STATE, DEFAULT_TOKEN_GAME_SETTINGS } from '@/types/token-game'
import type { PetriNet, Arc } from '@/types/petri-net'

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
     * Check if there's a deadlock (no enabled transitions)
     */
    isDeadlock: (state): boolean =>
      state.status !== 'stopped' && state.enabledTransitions.length === 0,
  },

  actions: {
    /**
     * Initialize and start the token game
     */
    start() {
      const petriNetStore = usePetriNetStore()
      const net = petriNetStore.net

      // Get initial marking from places
      const initialMarking = this.createMarking(net)

      this.marking = initialMarking
      this.history = [initialMarking]
      this.historyIndex = 0
      this.activeAnimations = []
      this.isAnimating = false

      this.updateEnabledTransitions()
      this.status = 'paused'
    },

    /**
     * Stop the token game
     */
    stop() {
      this.status = 'stopped'
      this.marking = { timestamp: 0, tokens: {} }
      this.history = []
      this.historyIndex = -1
      this.enabledTransitions = []
      this.activeAnimations = []
      this.isAnimating = false
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
     * Update the list of enabled transitions
     */
    updateEnabledTransitions() {
      const petriNetStore = usePetriNetStore()
      const net = petriNetStore.net
      const enabled: string[] = []

      // Check regular transitions
      for (const transition of net.transitions) {
        if (this.isTransitionEnabledByMarking(transition.id, net)) {
          enabled.push(transition.id)
        }
      }

      // Check operators (they act like transitions)
      for (const operator of net.operators) {
        if (this.isTransitionEnabledByMarking(operator.id, net)) {
          enabled.push(operator.id)
        }
      }

      this.enabledTransitions = enabled
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

      // Update enabled transitions
      this.updateEnabledTransitions()
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

      // Get transition position
      const transition =
        net.transitions.find((t) => t.id === transitionId) ||
        net.operators.find((o) => o.id === transitionId)

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
     * Auto-play: automatically fire transitions
     */
    async autoPlay() {
      this.status = 'playing'

      while (this.status === 'playing' && this.enabledTransitions.length > 0) {
        const transitionId = this.selectTransition()
        if (transitionId) {
          await this.fireTransition(transitionId)
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
     * Select which transition to fire (based on conflict resolution mode)
     */
    selectTransition(): string | null {
      if (this.enabledTransitions.length === 0) return null
      if (this.enabledTransitions.length === 1) return this.enabledTransitions[0]

      switch (this.conflictResolution) {
        case 'random':
          const randomIndex = Math.floor(Math.random() * this.enabledTransitions.length)
          return this.enabledTransitions[randomIndex]
        case 'first':
          return this.enabledTransitions[0]
        case 'manual':
        default:
          // In manual mode, pause and let user decide
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
  },
})
