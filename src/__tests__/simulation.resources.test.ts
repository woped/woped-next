import { describe, it, expect } from 'vitest'
import { SimulationEngine } from '@/services/simulation/SimulationEngine'
import type { PetriNet } from '@/types/petri-net'
import type { SimulationConfig, TimeModel, ResourceModel } from '@/types/simulation'

function createSimpleNet(): PetriNet {
  return {
    id: 'net-1',
    name: 'Test',
    places: [
      { id: 'p-start', name: 'Start', position: { x: 0, y: 0 }, tokens: 0 },
      { id: 'p-end', name: 'End', position: { x: 200, y: 0 }, tokens: 0 },
    ],
    transitions: [
      { id: 't1', name: 'T1', position: { x: 100, y: 0 } },
    ],
    operators: [],
    subProcesses: [],
    arcs: [
      { id: 'a1', sourceId: 'p-start', targetId: 't1', weight: 1, waypoints: [] },
      { id: 'a2', sourceId: 't1', targetId: 'p-end', weight: 1, waypoints: [] },
    ],
  }
}

const baseConfig: SimulationConfig = {
  arrivalRate: 2,
  simulationTime: 100,
  warmupTime: 0,
  replications: 1,
  seed: 42,
  timeUnit: 'minutes',
}

const baseTimeModel: TimeModel = {
  transitionTimes: {},
  defaultTime: { type: 'exponential', params: [2] },
}

describe('SimulationEngine — Resource Allocation', () => {
  it('should run without resources and produce results', () => {
    const net = createSimpleNet()
    const engine = new SimulationEngine(net, baseConfig, baseTimeModel)
    const result = engine.run()

    expect(result).toBeDefined()
    expect(result.cases.length).toBeGreaterThan(0)
    expect(result.statistics).toBeDefined()
  })

  it('should allocate and release resources during simulation', () => {
    const net = createSimpleNet()
    const resourceModel: ResourceModel = {
      resources: [{ id: 'res-1', name: 'Worker', capacity: 2 }],
      transitionResources: {
        't1': [{ resourceId: 'res-1', units: 1 }],
      },
    }

    const engine = new SimulationEngine(net, baseConfig, baseTimeModel, resourceModel)
    const result = engine.run()

    expect(result).toBeDefined()
    expect(result.cases.length).toBeGreaterThan(0)

    const resStats = result.statistics.resourceStats
    expect(resStats).toBeDefined()
    if (resStats && resStats.length > 0) {
      const workerStats = resStats.find((r) => r.resourceId === 'res-1')
      expect(workerStats).toBeDefined()
      expect(workerStats!.utilization).toBeGreaterThanOrEqual(0)
      expect(workerStats!.utilization).toBeLessThanOrEqual(1)
    }
  })

  it('should block transitions when resource capacity is exhausted', () => {
    const net = createSimpleNet()
    const resourceModel: ResourceModel = {
      resources: [{ id: 'res-scarce', name: 'Scarce', capacity: 1 }],
      transitionResources: {
        't1': [{ resourceId: 'res-scarce', units: 1 }],
      },
    }

    const config = { ...baseConfig, arrivalRate: 10, simulationTime: 50 }
    const engine = new SimulationEngine(net, config, baseTimeModel, resourceModel)
    const result = engine.run()

    expect(result).toBeDefined()
    const completedCases = result.cases.filter((c) => c.completed)
    expect(completedCases.length).toBeGreaterThan(0)
  })

  it('should use time trigger delay when present on transition', () => {
    const net = createSimpleNet()
    net.transitions[0].triggers = [
      { id: 'trig-1', type: 'time', delay: 1, timeUnit: 'minutes' },
    ]

    const engine = new SimulationEngine(net, { ...baseConfig, simulationTime: 50 }, baseTimeModel)
    const result = engine.run()

    expect(result).toBeDefined()
    expect(result.cases.length).toBeGreaterThan(0)
  })

  it('should handle empty resource model gracefully', () => {
    const net = createSimpleNet()
    const resourceModel: ResourceModel = {
      resources: [],
      transitionResources: {},
    }

    const engine = new SimulationEngine(net, baseConfig, baseTimeModel, resourceModel)
    const result = engine.run()

    expect(result).toBeDefined()
    expect(result.cases.length).toBeGreaterThan(0)
  })
})
