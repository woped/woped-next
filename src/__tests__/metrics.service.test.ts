import { describe, it, expect } from 'vitest'
import { metricsCalculator, MetricsCalculator } from '@/services/analysis/metricsCalculator'
import { OperatorType } from '@/types/petri-net'
import type { PetriNet } from '@/types/petri-net'

function createSimpleNet(): PetriNet {
  return {
    id: 'simple',
    name: 'Simple',
    places: [
      { id: 'p1', name: 'P1', position: { x: 0, y: 0 }, tokens: 1, capacity: -1 },
    ],
    transitions: [
      { id: 't1', name: 'T1', position: { x: 100, y: 0 } },
    ],
    operators: [],
    arcs: [
      { id: 'a1', sourceId: 'p1', targetId: 't1', weight: 1, waypoints: [] },
    ],
    subProcesses: [],
  } as unknown as PetriNet
}

function createComplexNet(): PetriNet {
  return {
    id: 'complex',
    name: 'Complex',
    places: [
      { id: 'p1', name: 'Start', position: { x: 0, y: 0 }, tokens: 1, capacity: -1 },
      { id: 'p2', name: 'Mid1', position: { x: 100, y: -50 }, tokens: 0, capacity: -1 },
      { id: 'p3', name: 'Mid2', position: { x: 100, y: 50 }, tokens: 0, capacity: -1 },
      { id: 'p4', name: 'End', position: { x: 200, y: 0 }, tokens: 0, capacity: -1 },
    ],
    transitions: [
      { id: 't1', name: 'T1', position: { x: 50, y: 0 } },
      { id: 't2', name: 'T2', position: { x: 150, y: 0 } },
    ],
    operators: [
      { id: 'op1', name: 'Split', position: { x: 75, y: 0 }, operatorType: OperatorType.AND_SPLIT },
      { id: 'op2', name: 'Join', position: { x: 125, y: 0 }, operatorType: OperatorType.AND_JOIN },
    ],
    arcs: [
      { id: 'a1', sourceId: 'p1', targetId: 't1', weight: 1, waypoints: [] },
      { id: 'a2', sourceId: 't1', targetId: 'op1', weight: 1, waypoints: [] },
      { id: 'a3', sourceId: 'op1', targetId: 'p2', weight: 1, waypoints: [] },
      { id: 'a4', sourceId: 'op1', targetId: 'p3', weight: 1, waypoints: [] },
      { id: 'a5', sourceId: 'p2', targetId: 'op2', weight: 1, waypoints: [] },
      { id: 'a6', sourceId: 'p3', targetId: 'op2', weight: 1, waypoints: [] },
      { id: 'a7', sourceId: 'op2', targetId: 't2', weight: 1, waypoints: [] },
      { id: 'a8', sourceId: 't2', targetId: 'p4', weight: 1, waypoints: [] },
    ],
    subProcesses: [],
  } as unknown as PetriNet
}

function createEmptyNet(): PetriNet {
  return {
    id: 'empty',
    name: 'Empty',
    places: [],
    transitions: [],
    operators: [],
    arcs: [],
    subProcesses: [],
  } as unknown as PetriNet
}

describe('MetricsCalculator', () => {
  it('exports a singleton instance', () => {
    expect(metricsCalculator).toBeInstanceOf(MetricsCalculator)
  })

  describe('simple net', () => {
    it('returns a metrics array with timestamp', () => {
      const report = metricsCalculator.calculate(createSimpleNet())

      expect(report.metrics).toBeDefined()
      expect(Array.isArray(report.metrics)).toBe(true)
      expect(report.metrics.length).toBeGreaterThan(0)
      expect(typeof report.timestamp).toBe('number')
      expect(report.netId).toBe('simple')
    })

    it('each metric has required fields', () => {
      const report = metricsCalculator.calculate(createSimpleNet())

      for (const m of report.metrics) {
        expect(m.metricId).toBeTruthy()
        expect(typeof m.value).toBe('number')
        expect(['good', 'warning', 'bad', 'neutral']).toContain(m.rating)
        expect(typeof m.formattedValue).toBe('string')
      }
    })
  })

  describe('complex net', () => {
    it('counts places, transitions, arcs, operators correctly', () => {
      const report = metricsCalculator.calculate(createComplexNet())
      const byId = Object.fromEntries(report.metrics.map((m) => [m.metricId, m]))

      expect(byId['places']?.value).toBe(4)
      expect(byId['transitions']?.value).toBe(2)
      expect(byId['arcs']?.value).toBe(8)
      expect(byId['operators']?.value).toBe(2)
      expect(byId['nodes']?.value).toBe(8) // 4 places + 2 transitions + 2 operators
    })

    it('computes density and connectivity ratios', () => {
      const report = metricsCalculator.calculate(createComplexNet())
      const byId = Object.fromEntries(report.metrics.map((m) => [m.metricId, m]))

      expect(byId['density']?.value).toBeGreaterThan(0)
      expect(byId['density']?.value).toBeLessThanOrEqual(1)
      expect(byId['coefficientOfConnectivity']?.value).toBeGreaterThan(0)
    })

    it('reports cyclomatic complexity', () => {
      const report = metricsCalculator.calculate(createComplexNet())
      const cc = report.metrics.find((m) => m.metricId === 'cyclomaticComplexity')

      expect(cc).toBeDefined()
      expect(cc!.value).toBeGreaterThanOrEqual(0)
    })

    it('summary counts match metrics array', () => {
      const report = metricsCalculator.calculate(createComplexNet())
      const { summary } = report

      expect(summary.totalMetrics).toBe(report.metrics.length)
      expect(summary.good + summary.warning + summary.bad + summary.neutral).toBe(summary.totalMetrics)
    })
  })

  describe('empty net', () => {
    it('does not crash and returns metrics with zero values', () => {
      const report = metricsCalculator.calculate(createEmptyNet())

      expect(report.metrics).toBeDefined()
      expect(report.metrics.length).toBeGreaterThan(0)

      const byId = Object.fromEntries(report.metrics.map((m) => [m.metricId, m]))
      expect(byId['places']?.value).toBe(0)
      expect(byId['transitions']?.value).toBe(0)
      expect(byId['arcs']?.value).toBe(0)
      expect(byId['density']?.value).toBe(0)
    })
  })

  describe('metric categories', () => {
    it('includes size, complexity, density, and quality metrics', () => {
      const report = metricsCalculator.calculate(createComplexNet())
      const ids = report.metrics.map((m) => m.metricId)

      expect(ids).toContain('places')
      expect(ids).toContain('transitions')
      expect(ids).toContain('arcs')
      expect(ids).toContain('cyclomaticComplexity')
      expect(ids).toContain('density')
      expect(ids).toContain('sequentiality')
      expect(ids).toContain('piMetric')
    })
  })
})
