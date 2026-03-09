import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSimulationStore } from '@/stores/simulation'
import { usePetriNetStore } from '@/stores/petriNet'
import { useResourceStore } from '@/stores/resources'
import {
  DEFAULT_SIMULATION_CONFIG,
  DEFAULT_TIME_MODEL,
  DEFAULT_RESOURCE_MODEL,
} from '@/types/simulation'
import type { Distribution, ResourceRequirement } from '@/types/simulation'

describe('Simulation Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('default state', () => {
    it('should initialize with default values', () => {
      const store = useSimulationStore()

      expect(store.status).toBe('idle')
      expect(store.config.arrivalRate).toBe(10)
      expect(store.config.simulationTime).toBe(1000)
      expect(store.config.warmupTime).toBe(100)
      expect(store.config.replications).toBe(1)
      expect(store.config.timeUnit).toBe('minutes')
      expect(store.timeModel.transitionTimes).toEqual({})
      expect(store.timeModel.defaultTime).toEqual({ type: 'exponential', params: [5] })
      expect(store.resourceModel.resources).toEqual([])
      expect(store.resourceModel.transitionResources).toEqual({})
      expect(store.result).toBeNull()
      expect(store.progress).toBe(0)
      expect(store.error).toBeNull()
    })
  })

  describe('setConfig', () => {
    it('should partially update the config', () => {
      const store = useSimulationStore()
      store.setConfig({ arrivalRate: 20, simulationTime: 5000 })

      expect(store.config.arrivalRate).toBe(20)
      expect(store.config.simulationTime).toBe(5000)
      expect(store.config.warmupTime).toBe(100)
      expect(store.config.timeUnit).toBe('minutes')
    })

    it('should override previous partial updates', () => {
      const store = useSimulationStore()
      store.setConfig({ arrivalRate: 50 })
      store.setConfig({ arrivalRate: 75 })

      expect(store.config.arrivalRate).toBe(75)
    })
  })

  describe('time model', () => {
    it('should set a transition time distribution', () => {
      const store = useSimulationStore()
      const dist: Distribution = { type: 'normal', params: [10, 2] }
      store.setTransitionTime('t1', dist)

      expect(store.timeModel.transitionTimes['t1']).toEqual(dist)
    })

    it('should remove a transition time', () => {
      const store = useSimulationStore()
      store.setTransitionTime('t1', { type: 'constant', params: [3] })
      store.removeTransitionTime('t1')

      expect(store.timeModel.transitionTimes['t1']).toBeUndefined()
    })

    it('should set the default time distribution', () => {
      const store = useSimulationStore()
      const dist: Distribution = { type: 'uniform', params: [1, 10] }
      store.setDefaultTime(dist)

      expect(store.timeModel.defaultTime).toEqual(dist)
    })

    it('should reset time model to defaults', () => {
      const store = useSimulationStore()
      store.$patch({
        timeModel: {
          transitionTimes: { t1: { type: 'constant' as const, params: [5] } },
          defaultTime: { type: 'uniform' as const, params: [1, 10] },
        },
      })
      store.resetTimeModel()

      expect(store.timeModel.defaultTime).toEqual({ type: 'exponential', params: [5] })
    })
  })

  describe('resource CRUD', () => {
    it('should add a resource', () => {
      const store = useSimulationStore()
      store.addResource({ id: 'r1', name: 'Dev', capacity: 2 })

      expect(store.resourceModel.resources).toHaveLength(1)
      expect(store.resourceModel.resources[0]).toEqual({ id: 'r1', name: 'Dev', capacity: 2 })
    })

    it('should update a resource', () => {
      const store = useSimulationStore()
      store.addResource({ id: 'r1', name: 'Dev', capacity: 2 })
      store.updateResource('r1', { capacity: 5, name: 'Senior Dev' })

      expect(store.resourceModel.resources[0].capacity).toBe(5)
      expect(store.resourceModel.resources[0].name).toBe('Senior Dev')
    })

    it('should not crash when updating a non-existent resource', () => {
      const store = useSimulationStore()
      const before = store.resourceModel.resources.length
      expect(() => store.updateResource('nonexistent', { capacity: 10 })).not.toThrow()
      expect(store.resourceModel.resources).toHaveLength(before)
    })

    it('should remove a resource', () => {
      const store = useSimulationStore()
      store.addResource({ id: 'r1', name: 'Dev', capacity: 2 })
      store.removeResource('r1')

      expect(store.resourceModel.resources).toHaveLength(0)
    })

    it('should cascade-remove resource from transitionResources', () => {
      const store = useSimulationStore()
      store.addResource({ id: 'r1', name: 'Dev', capacity: 2 })
      store.addResource({ id: 'r2', name: 'Tester', capacity: 1 })
      store.addTransitionResource('t1', { resourceId: 'r1', units: 1 })
      store.addTransitionResource('t1', { resourceId: 'r2', units: 1 })
      store.addTransitionResource('t2', { resourceId: 'r1', units: 2 })

      store.removeResource('r1')

      expect(store.resourceModel.resources).toHaveLength(1)
      expect(store.resourceModel.transitionResources['t1']).toEqual([
        { resourceId: 'r2', units: 1 },
      ])
      expect(store.resourceModel.transitionResources['t2']).toBeUndefined()
    })
  })

  describe('transition resources', () => {
    it('should set transition resources', () => {
      const store = useSimulationStore()
      const reqs: ResourceRequirement[] = [
        { resourceId: 'r1', units: 1 },
        { resourceId: 'r2', units: 2 },
      ]
      store.setTransitionResources('t1', reqs)

      expect(store.resourceModel.transitionResources['t1']).toEqual(reqs)
    })

    it('should delete transition resources when setting empty array', () => {
      const store = useSimulationStore()
      store.setTransitionResources('t1', [{ resourceId: 'r1', units: 1 }])
      store.setTransitionResources('t1', [])

      expect(store.resourceModel.transitionResources['t1']).toBeUndefined()
    })

    it('should add a transition resource', () => {
      const store = useSimulationStore()
      store.addTransitionResource('t1', { resourceId: 'r1', units: 1 })
      store.addTransitionResource('t1', { resourceId: 'r2', units: 3 })

      expect(store.resourceModel.transitionResources['t1']).toHaveLength(2)
      expect(store.resourceModel.transitionResources['t1'][1]).toEqual({
        resourceId: 'r2',
        units: 3,
      })
    })

    it('should remove a transition resource', () => {
      const store = useSimulationStore()
      store.$patch({
        resourceModel: {
          resources: [],
          transitionResources: {
            t1: [
              { resourceId: 'r1', units: 1 },
              { resourceId: 'r2', units: 2 },
            ],
          },
        },
      })
      store.removeTransitionResource('t1', 'r1')

      expect(store.resourceModel.transitionResources['t1']).toEqual([
        { resourceId: 'r2', units: 2 },
      ])
    })

    it('should delete the transition key when last resource is removed', () => {
      const store = useSimulationStore()
      store.$patch({
        resourceModel: {
          resources: [],
          transitionResources: {
            t1: [{ resourceId: 'r1', units: 1 }],
          },
        },
      })
      store.removeTransitionResource('t1', 'r1')

      expect(store.resourceModel.transitionResources['t1']).toBeUndefined()
    })
  })

  describe('resetResourceModel', () => {
    it('should reset to empty resources and transitionResources', () => {
      const store = useSimulationStore()
      store.addResource({ id: 'r1', name: 'Dev', capacity: 2 })
      store.addTransitionResource('t1', { resourceId: 'r1', units: 1 })
      store.resetResourceModel()

      expect(store.resourceModel.resources).toEqual([])
      expect(store.resourceModel.transitionResources).toEqual({})
    })
  })

  describe('resetConfig', () => {
    it('should restore config to defaults', () => {
      const store = useSimulationStore()
      store.setConfig({ arrivalRate: 999, simulationTime: 1, timeUnit: 'hours' })
      store.resetConfig()

      expect(store.config).toEqual(DEFAULT_SIMULATION_CONFIG)
    })
  })

  describe('getters', () => {
    it('isRunning should be false by default', () => {
      const store = useSimulationStore()
      expect(store.isRunning).toBe(false)
    })

    it('hasResults should be false by default', () => {
      const store = useSimulationStore()
      expect(store.hasResults).toBe(false)
    })

    it('formattedThroughput should return "-" without results', () => {
      const store = useSimulationStore()
      expect(store.formattedThroughput).toBe('-')
    })

    it('formattedCycleTime should return "-" without results', () => {
      const store = useSimulationStore()
      expect(store.formattedCycleTime).toBe('-')
    })

    it('completionRatePercent should return 0 without results', () => {
      const store = useSimulationStore()
      expect(store.completionRatePercent).toBe(0)
    })

    it('should format throughput when results exist', () => {
      const store = useSimulationStore()
      store.$patch({
        result: {
          cases: [],
          statistics: {
            throughput: 3.456,
            cycleTime: { avg: 0, min: 0, max: 0, stdDev: 0, median: 0, p90: 0, p95: 0 },
            completionRate: 0.8,
            casesStarted: 10,
            casesCompleted: 8,
            casesInProgress: 2,
            activityStats: [],
            avgTokensInSystem: 1,
          },
          config: { ...DEFAULT_SIMULATION_CONFIG },
          timeModel: { ...DEFAULT_TIME_MODEL },
          executionTimeMs: 100,
          seed: 42,
        },
      })

      expect(store.formattedThroughput).toBe('3.46 cases/minutes')
    })

    it('should format cycle time when results exist', () => {
      const store = useSimulationStore()
      store.$patch({
        result: {
          cases: [],
          statistics: {
            throughput: 1,
            cycleTime: { avg: 12.345, min: 5, max: 20, stdDev: 3, median: 12, p90: 18, p95: 19 },
            completionRate: 1,
            casesStarted: 10,
            casesCompleted: 10,
            casesInProgress: 0,
            activityStats: [],
            avgTokensInSystem: 1,
          },
          config: { ...DEFAULT_SIMULATION_CONFIG },
          timeModel: { ...DEFAULT_TIME_MODEL },
          executionTimeMs: 50,
          seed: 42,
        },
      })

      expect(store.formattedCycleTime).toBe('12.35 minutes')
    })

    it('should compute completionRatePercent from result', () => {
      const store = useSimulationStore()
      store.$patch({
        result: {
          cases: [],
          statistics: {
            throughput: 1,
            cycleTime: { avg: 10, min: 5, max: 20, stdDev: 3, median: 10, p90: 18, p95: 19 },
            completionRate: 0.75,
            casesStarted: 100,
            casesCompleted: 75,
            casesInProgress: 25,
            activityStats: [],
            avgTokensInSystem: 1,
          },
          config: { ...DEFAULT_SIMULATION_CONFIG },
          timeModel: { ...DEFAULT_TIME_MODEL },
          executionTimeMs: 50,
          seed: 42,
        },
      })

      expect(store.completionRatePercent).toBe(75)
    })
  })

  describe('runSimulation', () => {
    function buildSimplePetriNet() {
      const petriNetStore = usePetriNetStore()
      const p1 = petriNetStore.addPlace({ x: 0, y: 0 }, 'Start')
      petriNetStore.updatePlace(p1.id, { tokens: 1 })
      const t1 = petriNetStore.addTransition({ x: 100, y: 0 }, 'T1')
      const p2 = petriNetStore.addPlace({ x: 200, y: 0 }, 'End')
      petriNetStore.addArc(p1.id, t1.id)
      petriNetStore.addArc(t1.id, p2.id)
      return { petriNetStore, p1, t1, p2 }
    }

    it('should complete and produce results with a valid net', async () => {
      buildSimplePetriNet()
      const store = useSimulationStore()

      await store.runSimulation()

      expect(store.status).toBe('completed')
      expect(store.result).not.toBeNull()
      expect(store.result!.statistics).toBeDefined()
      expect(store.result!.statistics.throughput).toBeGreaterThanOrEqual(0)
      expect(store.progress).toBe(1)
      expect(store.error).toBeNull()
    })

    it('should set error status when net is empty', async () => {
      const store = useSimulationStore()

      await store.runSimulation()

      expect(store.status).toBe('error')
      expect(store.error).toBeTruthy()
      expect(store.result).toBeNull()
    })

    it('should set error when net has no start place', async () => {
      const petriNetStore = usePetriNetStore()
      const p1 = petriNetStore.addPlace({ x: 0, y: 0 }, 'P1')
      const t1 = petriNetStore.addTransition({ x: 100, y: 0 }, 'T1')
      petriNetStore.addArc(p1.id, t1.id)
      petriNetStore.addArc(t1.id, p1.id)

      const store = useSimulationStore()
      await store.runSimulation()

      expect(store.status).toBe('error')
      expect(store.error).toContain('start place')
    })
  })

  describe('clearResults', () => {
    it('should reset status to idle and clear result', async () => {
      const petriNetStore = usePetriNetStore()
      const p1 = petriNetStore.addPlace({ x: 0, y: 0 }, 'Start')
      petriNetStore.updatePlace(p1.id, { tokens: 1 })
      const t1 = petriNetStore.addTransition({ x: 100, y: 0 }, 'T1')
      const p2 = petriNetStore.addPlace({ x: 200, y: 0 }, 'End')
      petriNetStore.addArc(p1.id, t1.id)
      petriNetStore.addArc(t1.id, p2.id)

      const store = useSimulationStore()
      await store.runSimulation()
      expect(store.status).toBe('completed')

      store.clearResults()

      expect(store.status).toBe('idle')
      expect(store.result).toBeNull()
      expect(store.progress).toBe(0)
      expect(store.error).toBeNull()
    })
  })

  describe('reset', () => {
    it('should restore everything to defaults', () => {
      const store = useSimulationStore()
      store.$patch({
        status: 'error',
        error: 'something',
        progress: 0.5,
        config: { arrivalRate: 50, simulationTime: 1000, warmupTime: 100, replications: 1, timeUnit: 'hours' as const },
        timeModel: {
          transitionTimes: { t1: { type: 'constant' as const, params: [10] } },
          defaultTime: { type: 'uniform' as const, params: [1, 10] },
        },
        resourceModel: {
          resources: [{ id: 'r1', name: 'Dev', capacity: 3 }],
          transitionResources: { t1: [{ resourceId: 'r1', units: 1 }] },
        },
      })

      store.reset()

      expect(store.status).toBe('idle')
      expect(store.config).toEqual(DEFAULT_SIMULATION_CONFIG)
      expect(store.timeModel.defaultTime).toEqual({ type: 'exponential', params: [5] })
      expect(store.resourceModel.resources).toEqual([])
      expect(store.resourceModel.transitionResources).toEqual({})
      expect(store.result).toBeNull()
      expect(store.progress).toBe(0)
      expect(store.error).toBeNull()
    })
  })
})
