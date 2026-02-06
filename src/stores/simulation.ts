import { defineStore } from 'pinia'
import { usePetriNetStore } from './petriNet'
import type {
  SimulationState,
  SimulationConfig,
  TimeModel,
  ResourceModel,
  Resource,
  ResourceRequirement,
  SimulationResult,
  Distribution,
} from '@/types/simulation'
import { DEFAULT_SIMULATION_STATE, DEFAULT_SIMULATION_CONFIG, DEFAULT_TIME_MODEL, DEFAULT_RESOURCE_MODEL } from '@/types/simulation'
import { SimulationEngine } from '@/services/simulation/SimulationEngine'

export const useSimulationStore = defineStore('simulation', {
  state: (): SimulationState => ({
    ...DEFAULT_SIMULATION_STATE,
  }),

  getters: {
    /**
     * Check if simulation is running
     */
    isRunning: (state): boolean => state.status === 'running',

    /**
     * Check if simulation has results
     */
    hasResults: (state): boolean => state.result !== null,

    /**
     * Get formatted throughput
     */
    formattedThroughput(): string {
      if (!this.result) return '-'
      const throughput = this.result.statistics.throughput
      const unit = this.config.timeUnit
      return `${throughput.toFixed(2)} cases/${unit}`
    },

    /**
     * Get formatted cycle time
     */
    formattedCycleTime(): string {
      if (!this.result) return '-'
      const ct = this.result.statistics.cycleTime.avg
      return `${ct.toFixed(2)} ${this.config.timeUnit}`
    },

    /**
     * Get completion rate as percentage
     */
    completionRatePercent(): number {
      if (!this.result) return 0
      return this.result.statistics.completionRate * 100
    },
  },

  actions: {
    /**
     * Update simulation configuration
     */
    setConfig(config: Partial<SimulationConfig>) {
      this.config = { ...this.config, ...config }
    },

    /**
     * Set time distribution for a transition
     */
    setTransitionTime(transitionId: string, distribution: Distribution) {
      this.timeModel.transitionTimes[transitionId] = distribution
    },

    /**
     * Remove time distribution for a transition (use default)
     */
    removeTransitionTime(transitionId: string) {
      delete this.timeModel.transitionTimes[transitionId]
    },

    /**
     * Set default time distribution
     */
    setDefaultTime(distribution: Distribution) {
      this.timeModel.defaultTime = distribution
    },

    /**
     * Reset time model to defaults
     */
    resetTimeModel() {
      this.timeModel = { ...DEFAULT_TIME_MODEL }
    },

    /**
     * Reset configuration to defaults
     */
    resetConfig() {
      this.config = { ...DEFAULT_SIMULATION_CONFIG }
    },

    /**
     * Add a resource
     */
    addResource(resource: Resource) {
      this.resourceModel.resources.push(resource)
    },

    /**
     * Update a resource
     */
    updateResource(resourceId: string, updates: Partial<Resource>) {
      const index = this.resourceModel.resources.findIndex(r => r.id === resourceId)
      if (index !== -1) {
        this.resourceModel.resources[index] = { ...this.resourceModel.resources[index], ...updates }
      }
    },

    /**
     * Remove a resource
     */
    removeResource(resourceId: string) {
      this.resourceModel.resources = this.resourceModel.resources.filter(r => r.id !== resourceId)
      // Also remove from all transition requirements
      for (const transitionId of Object.keys(this.resourceModel.transitionResources)) {
        this.resourceModel.transitionResources[transitionId] = 
          this.resourceModel.transitionResources[transitionId].filter(r => r.resourceId !== resourceId)
        if (this.resourceModel.transitionResources[transitionId].length === 0) {
          delete this.resourceModel.transitionResources[transitionId]
        }
      }
    },

    /**
     * Set resource requirements for a transition
     */
    setTransitionResources(transitionId: string, requirements: ResourceRequirement[]) {
      if (requirements.length === 0) {
        delete this.resourceModel.transitionResources[transitionId]
      } else {
        this.resourceModel.transitionResources[transitionId] = requirements
      }
    },

    /**
     * Add resource requirement to a transition
     */
    addTransitionResource(transitionId: string, requirement: ResourceRequirement) {
      if (!this.resourceModel.transitionResources[transitionId]) {
        this.resourceModel.transitionResources[transitionId] = []
      }
      this.resourceModel.transitionResources[transitionId].push(requirement)
    },

    /**
     * Remove resource requirement from a transition
     */
    removeTransitionResource(transitionId: string, resourceId: string) {
      if (this.resourceModel.transitionResources[transitionId]) {
        this.resourceModel.transitionResources[transitionId] = 
          this.resourceModel.transitionResources[transitionId].filter(r => r.resourceId !== resourceId)
        if (this.resourceModel.transitionResources[transitionId].length === 0) {
          delete this.resourceModel.transitionResources[transitionId]
        }
      }
    },

    /**
     * Reset resource model to defaults
     */
    resetResourceModel() {
      this.resourceModel = { ...DEFAULT_RESOURCE_MODEL, resources: [], transitionResources: {} }
    },

    /**
     * Run simulation
     */
    async runSimulation() {
      const petriNetStore = usePetriNetStore()
      const net = petriNetStore.net

      // Validate net has content
      if (net.places.length === 0 || net.transitions.length === 0) {
        this.error = 'Petri net must have at least one place and one transition'
        this.status = 'error'
        return
      }

      // Check for start places
      const placesWithInput = new Set(
        net.arcs.filter(arc => net.places.some(p => p.id === arc.targetId)).map(arc => arc.targetId)
      )
      const startPlaces = net.places.filter(p => !placesWithInput.has(p.id))
      if (startPlaces.length === 0) {
        this.error = 'Petri net must have at least one start place (place with no input)'
        this.status = 'error'
        return
      }

      this.status = 'running'
      this.progress = 0
      this.error = null

      try {
        // Run in next tick to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 10))

        const engine = new SimulationEngine(net, this.config, this.timeModel, this.resourceModel)
        
        engine.setProgressCallback((progress) => {
          this.progress = progress
        })

        const result = engine.run()
        
        this.result = result
        this.status = 'completed'
        this.progress = 1
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Simulation failed'
        this.status = 'error'
      }
    },

    /**
     * Clear results
     */
    clearResults() {
      this.result = null
      this.status = 'idle'
      this.progress = 0
      this.error = null
    },

    /**
     * Reset entire simulation state
     */
    reset() {
      this.status = 'idle'
      this.config = { ...DEFAULT_SIMULATION_CONFIG }
      this.timeModel = { ...DEFAULT_TIME_MODEL }
      this.resourceModel = { ...DEFAULT_RESOURCE_MODEL, resources: [], transitionResources: {} }
      this.result = null
      this.progress = 0
      this.error = null
    },
  },
})
