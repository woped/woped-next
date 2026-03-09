import { describe, it, expect, vi } from 'vitest'
import { SimulationEngine } from '@/services/simulation/SimulationEngine'
import type { SimulationConfig, TimeModel, ResourceModel } from '@/types/simulation'
import type { PetriNet } from '@/types/petri-net'

function createSimpleNet(): PetriNet {
  return {
    id: 'test-net',
    name: 'Test',
    places: [
      { id: 'p1', name: 'Start', position: { x: 0, y: 0 }, tokens: 1, capacity: -1 },
      { id: 'p2', name: 'End', position: { x: 200, y: 0 }, tokens: 0, capacity: -1 },
    ],
    transitions: [
      { id: 't1', name: 'T1', position: { x: 100, y: 0 } },
    ],
    operators: [],
    arcs: [
      { id: 'a1', sourceId: 'p1', targetId: 't1', weight: 1, waypoints: [] },
      { id: 'a2', sourceId: 't1', targetId: 'p2', weight: 1, waypoints: [] },
    ],
    subProcesses: [],
  } as unknown as PetriNet
}

function createParallelNet(): PetriNet {
  return {
    id: 'parallel-net',
    name: 'Parallel',
    places: [
      { id: 'p1', name: 'Start', position: { x: 0, y: 0 }, tokens: 1, capacity: -1 },
      { id: 'p2', name: 'Mid1', position: { x: 100, y: -50 }, tokens: 0, capacity: -1 },
      { id: 'p3', name: 'Mid2', position: { x: 100, y: 50 }, tokens: 0, capacity: -1 },
      { id: 'p4', name: 'End', position: { x: 200, y: 0 }, tokens: 0, capacity: -1 },
    ],
    transitions: [
      { id: 't1', name: 'Split', position: { x: 50, y: 0 } },
      { id: 't2', name: 'Join', position: { x: 150, y: 0 } },
    ],
    operators: [],
    arcs: [
      { id: 'a1', sourceId: 'p1', targetId: 't1', weight: 1, waypoints: [] },
      { id: 'a2', sourceId: 't1', targetId: 'p2', weight: 1, waypoints: [] },
      { id: 'a3', sourceId: 't1', targetId: 'p3', weight: 1, waypoints: [] },
      { id: 'a4', sourceId: 'p2', targetId: 't2', weight: 1, waypoints: [] },
      { id: 'a5', sourceId: 'p3', targetId: 't2', weight: 1, waypoints: [] },
      { id: 'a6', sourceId: 't2', targetId: 'p4', weight: 1, waypoints: [] },
    ],
    subProcesses: [],
  } as unknown as PetriNet
}

function createEmptyNet(): PetriNet {
  return {
    id: 'empty-net',
    name: 'Empty',
    places: [
      { id: 'p1', name: 'Lone', position: { x: 0, y: 0 }, tokens: 1, capacity: -1 },
    ],
    transitions: [],
    operators: [],
    arcs: [],
    subProcesses: [],
  } as unknown as PetriNet
}

const baseConfig: SimulationConfig = {
  arrivalRate: 10,
  simulationTime: 1000,
  warmupTime: 100,
  replications: 1,
  timeUnit: 'minutes',
  seed: 42,
}

const constantTimeModel: TimeModel = {
  transitionTimes: {},
  defaultTime: { type: 'constant', params: [5] },
}

const defaultResourceModel: ResourceModel = {
  resources: [],
  transitionResources: {},
}

describe('SimulationEngine', () => {
  it('produces a result with all expected fields', () => {
    const engine = new SimulationEngine(createSimpleNet(), baseConfig, constantTimeModel, defaultResourceModel)
    const result = engine.run()

    expect(result.cases).toBeDefined()
    expect(Array.isArray(result.cases)).toBe(true)
    expect(result.statistics).toBeDefined()
    expect(result.config).toEqual(baseConfig)
    expect(result.timeModel).toEqual(constantTimeModel)
    expect(typeof result.executionTimeMs).toBe('number')
    expect(typeof result.seed).toBe('number')
  })

  it('is deterministic with the same seed', () => {
    const run = () => {
      const engine = new SimulationEngine(createSimpleNet(), baseConfig, constantTimeModel, defaultResourceModel)
      return engine.run()
    }

    const result1 = run()
    const result2 = run()

    const completed1 = result1.cases.filter((c) => c.completed).length
    const completed2 = result2.cases.filter((c) => c.completed).length
    expect(completed1).toBe(completed2)
  })

  it('uses constant time model so all activity times equal 5', () => {
    const engine = new SimulationEngine(createSimpleNet(), baseConfig, constantTimeModel, defaultResourceModel)
    const result = engine.run()

    const stats = result.statistics.activityStats
    for (const activity of stats) {
      expect(activity.avgTime).toBeCloseTo(5, 5)
      expect(activity.minTime).toBeCloseTo(5, 5)
      expect(activity.maxTime).toBeCloseTo(5, 5)
    }
  })

  it('cases have start/end times and events', () => {
    const engine = new SimulationEngine(createSimpleNet(), baseConfig, constantTimeModel, defaultResourceModel)
    const result = engine.run()

    const completedCase = result.cases.find((c) => c.completed)
    expect(completedCase).toBeDefined()
    expect(completedCase!.startTime).toBeGreaterThanOrEqual(0)
    expect(completedCase!.endTime).toBeGreaterThan(completedCase!.startTime)
    expect(completedCase!.events.length).toBeGreaterThan(0)
  })

  it('statistics have valid throughput, cycleTime, completionRate, casesStarted', () => {
    const engine = new SimulationEngine(createSimpleNet(), baseConfig, constantTimeModel, defaultResourceModel)
    const result = engine.run()
    const { statistics } = result

    expect(statistics.throughput).toBeGreaterThan(0)
    expect(statistics.cycleTime.avg).toBeGreaterThan(0)
    expect(statistics.completionRate).toBeGreaterThanOrEqual(0)
    expect(statistics.completionRate).toBeLessThanOrEqual(1)
    expect(statistics.casesStarted).toBeGreaterThan(0)
  })

  it('tracks resource statistics when resources are assigned', () => {
    const resourceModel: ResourceModel = {
      resources: [{ id: 'r1', name: 'Worker', capacity: 2 }],
      transitionResources: { t1: [{ resourceId: 'r1', units: 1 }] },
    }

    const engine = new SimulationEngine(createSimpleNet(), baseConfig, constantTimeModel, resourceModel)
    const result = engine.run()

    expect(result.statistics.resourceStats).toBeDefined()
    expect(result.statistics.resourceStats!.length).toBe(1)
    const rStats = result.statistics.resourceStats![0]
    expect(rStats.resourceId).toBe('r1')
    expect(rStats.resourceName).toBe('Worker')
    expect(rStats.utilization).toBeGreaterThanOrEqual(0)
    expect(rStats.utilization).toBeLessThanOrEqual(1)
    expect(typeof rStats.totalBusyTime).toBe('number')
    expect(typeof rStats.totalIdleTime).toBe('number')
  })

  it('invokes the progress callback during run', () => {
    const engine = new SimulationEngine(createSimpleNet(), baseConfig, constantTimeModel, defaultResourceModel)
    const progressValues: number[] = []
    engine.setProgressCallback((p) => progressValues.push(p))

    engine.run()

    expect(progressValues.length).toBeGreaterThan(0)
    for (const p of progressValues) {
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(1)
    }
  })

  it('handles an empty net with no transitions gracefully', () => {
    const engine = new SimulationEngine(createEmptyNet(), baseConfig, constantTimeModel, defaultResourceModel)
    const result = engine.run()

    expect(result.cases).toBeDefined()
    expect(result.statistics.casesCompleted).toBe(0)
  })

  it('records activity stats for both transitions in a parallel net', () => {
    const engine = new SimulationEngine(createParallelNet(), baseConfig, constantTimeModel, defaultResourceModel)
    const result = engine.run()

    const ids = result.statistics.activityStats.map((a) => a.transitionId)
    expect(ids).toContain('t1')
    expect(ids).toContain('t2')
  })
})
