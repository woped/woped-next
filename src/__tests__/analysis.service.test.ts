import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePetriNetStore } from '@/stores/petriNet'
import { analyzeWorkflow, analyzeSoundness, computeStatistics, buildCoverabilityGraph, buildReachabilityGraph } from '@/services/analysis'
import { OperatorType } from '@/types/petri-net'

describe('Analysis Services', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('computeStatistics', () => {
    it('should count elements correctly', () => {
      const store = usePetriNetStore()
      store.addPlace({ x: 100, y: 100 }, 'P1')
      store.addPlace({ x: 200, y: 100 }, 'P2')
      store.addTransition({ x: 150, y: 100 }, 'T1')

      const stats = computeStatistics(store.net)

      expect(stats.places).toBe(2)
      expect(stats.transitions).toBe(1)
    })

    it('should identify source places', () => {
      const store = usePetriNetStore()
      const p1 = store.addPlace({ x: 100, y: 100 }, 'Start')
      const t1 = store.addTransition({ x: 200, y: 100 }, 'T1')
      const p2 = store.addPlace({ x: 300, y: 100 }, 'End')
      
      store.addArc(p1.id, t1.id)
      store.addArc(t1.id, p2.id)

      const stats = computeStatistics(store.net)

      expect(stats.sourcePlaces).toContain(p1.id)
      expect(stats.sourcePlaces).not.toContain(p2.id)
    })

    it('should identify sink places', () => {
      const store = usePetriNetStore()
      const p1 = store.addPlace({ x: 100, y: 100 }, 'Start')
      const t1 = store.addTransition({ x: 200, y: 100 }, 'T1')
      const p2 = store.addPlace({ x: 300, y: 100 }, 'End')
      
      store.addArc(p1.id, t1.id)
      store.addArc(t1.id, p2.id)

      const stats = computeStatistics(store.net)

      expect(stats.sinkPlaces).toContain(p2.id)
      expect(stats.sinkPlaces).not.toContain(p1.id)
    })

    it('should count total tokens', () => {
      const store = usePetriNetStore()
      const p1 = store.addPlace({ x: 100, y: 100 }, 'P1')
      const p2 = store.addPlace({ x: 200, y: 100 }, 'P2')
      
      store.updatePlace(p1.id, { tokens: 3 })
      store.updatePlace(p2.id, { tokens: 2 })

      const stats = computeStatistics(store.net)

      expect(stats.totalTokens).toBe(5)
    })
  })

  describe('analyzeWorkflow', () => {
    it('should validate a correct workflow net', () => {
      const store = usePetriNetStore()
      
      // Simple workflow: Start -> T1 -> End
      const start = store.addPlace({ x: 100, y: 100 }, 'Start')
      const t1 = store.addTransition({ x: 200, y: 100 }, 'T1')
      const end = store.addPlace({ x: 300, y: 100 }, 'End')
      
      store.addArc(start.id, t1.id)
      store.addArc(t1.id, end.id)

      const result = analyzeWorkflow(store.net)

      expect(result.valid).toBe(true)
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0)
    })

    it('should detect multiple source places', () => {
      const store = usePetriNetStore()
      
      // Two source places
      const p1 = store.addPlace({ x: 100, y: 100 }, 'Start1')
      const p2 = store.addPlace({ x: 100, y: 200 }, 'Start2')
      const t1 = store.addTransition({ x: 200, y: 150 }, 'T1')
      const end = store.addPlace({ x: 300, y: 150 }, 'End')
      
      store.addArc(p1.id, t1.id)
      store.addArc(p2.id, t1.id)
      store.addArc(t1.id, end.id)

      const result = analyzeWorkflow(store.net)

      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.code === 'WF001')).toBe(true)
    })

    it('should detect multiple sink places', () => {
      const store = usePetriNetStore()
      
      // Two sink places
      const start = store.addPlace({ x: 100, y: 150 }, 'Start')
      const t1 = store.addTransition({ x: 200, y: 150 }, 'T1')
      const end1 = store.addPlace({ x: 300, y: 100 }, 'End1')
      const end2 = store.addPlace({ x: 300, y: 200 }, 'End2')
      
      store.addArc(start.id, t1.id)
      store.addArc(t1.id, end1.id)
      store.addArc(t1.id, end2.id)

      const result = analyzeWorkflow(store.net)

      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.code === 'WF002')).toBe(true)
    })

    it('should detect isolated elements', () => {
      const store = usePetriNetStore()
      
      // Connected part
      const start = store.addPlace({ x: 100, y: 100 }, 'Start')
      const t1 = store.addTransition({ x: 200, y: 100 }, 'T1')
      const end = store.addPlace({ x: 300, y: 100 }, 'End')
      store.addArc(start.id, t1.id)
      store.addArc(t1.id, end.id)
      
      // Isolated place
      store.addPlace({ x: 500, y: 100 }, 'Isolated')

      const result = analyzeWorkflow(store.net)

      expect(result.issues.some(i => i.code === 'WF004')).toBe(true)
    })
  })

  describe('analyzeSoundness', () => {
    it('should detect dead transitions', () => {
      const store = usePetriNetStore()
      
      // T1 can fire, T2 cannot (dead)
      const start = store.addPlace({ x: 100, y: 100 }, 'Start')
      store.updatePlace(start.id, { tokens: 1 })
      const t1 = store.addTransition({ x: 200, y: 100 }, 'T1')
      const middle = store.addPlace({ x: 300, y: 100 }, 'Middle')
      const end = store.addPlace({ x: 400, y: 100 }, 'End')
      
      // T2 has no input - unreachable
      const t2 = store.addTransition({ x: 200, y: 200 }, 'T2')
      const unreachable = store.addPlace({ x: 100, y: 200 }, 'Unreachable')
      
      store.addArc(start.id, t1.id)
      store.addArc(t1.id, middle.id)
      store.addArc(unreachable.id, t2.id)
      store.addArc(t2.id, end.id)
      store.addArc(middle.id, end.id) // Direct path to end

      const result = analyzeSoundness(store.net)

      expect(result.issues.some(i => i.code === 'SN002')).toBe(true)
    })

    it('should mark a minimal sound workflow net as valid', () => {
      const store = usePetriNetStore()

      // Start -> T1 -> End, one token in the source
      const start = store.addPlace({ x: 100, y: 100 }, 'Start')
      store.updatePlace(start.id, { tokens: 1 })
      const t1 = store.addTransition({ x: 200, y: 100 }, 'T1')
      const end = store.addPlace({ x: 300, y: 100 }, 'End')

      store.addArc(start.id, t1.id)
      store.addArc(t1.id, end.id)

      const result = analyzeSoundness(store.net)

      expect(result.valid).toBe(true)
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0)
    })

    it('should flag nets that are not workflow nets (SN007)', () => {
      const store = usePetriNetStore()

      // Two source places -> not a workflow net
      const a = store.addPlace({ x: 100, y: 100 }, 'A')
      store.updatePlace(a.id, { tokens: 1 })
      const b = store.addPlace({ x: 100, y: 200 }, 'B')
      const t1 = store.addTransition({ x: 200, y: 150 }, 'T1')
      const end = store.addPlace({ x: 300, y: 150 }, 'End')
      store.addArc(a.id, t1.id)
      store.addArc(b.id, t1.id)
      store.addArc(t1.id, end.id)

      const result = analyzeSoundness(store.net)

      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.code === 'SN007')).toBe(true)
    })

    it('should flag a wrong initial marking (SN006)', () => {
      const store = usePetriNetStore()

      // Correct structure but no token in the source place
      const start = store.addPlace({ x: 100, y: 100 }, 'Start')
      const t1 = store.addTransition({ x: 200, y: 100 }, 'T1')
      const end = store.addPlace({ x: 300, y: 100 }, 'End')
      store.addArc(start.id, t1.id)
      store.addArc(t1.id, end.id)

      const result = analyzeSoundness(store.net)

      expect(result.issues.some(i => i.code === 'SN006')).toBe(true)
      expect(result.valid).toBe(false)
    })

    it('should detect unbounded nets as unsound (SN003)', () => {
      const store = usePetriNetStore()

      // Start -> T1 -> End, with T1 also pumping tokens into an extra place
      const start = store.addPlace({ x: 0, y: 0 }, 'Start')
      store.updatePlace(start.id, { tokens: 1 })
      const t1 = store.addTransition({ x: 100, y: 0 }, 'T1')
      const loop = store.addPlace({ x: 200, y: 0 }, 'Loop')
      const t2 = store.addTransition({ x: 300, y: 0 }, 'T2')
      const end = store.addPlace({ x: 400, y: 0 }, 'End')
      store.addArc(start.id, t1.id)
      store.addArc(t1.id, loop.id)
      store.addArc(loop.id, t2.id)
      store.addArc(t2.id, end.id)
      // T2 returns a token to loop -> unbounded growth of "Loop"
      store.addArc(t2.id, loop.id)

      const result = analyzeSoundness(store.net)

      expect(result.issues.some(i => i.code === 'SN003')).toBe(true)
      expect(result.valid).toBe(false)
    })

    it('should detect a structurally valid WF-net that deadlocks (non-live)', () => {
      const store = usePetriNetStore()

      // Start -> t1 -> p1; p1 is an XOR choice (t2 or t3); t4 is an AND-join
      // that waits for BOTH branches -> whichever branch is taken deadlocks.
      const start = store.addPlace({ x: 0, y: 0 }, 'Start')
      store.updatePlace(start.id, { tokens: 1 })
      const t1 = store.addTransition({ x: 100, y: 0 }, 'T1')
      const p1 = store.addPlace({ x: 200, y: 0 }, 'P1')
      const t2 = store.addTransition({ x: 300, y: -50 }, 'T2')
      const t3 = store.addTransition({ x: 300, y: 50 }, 'T3')
      const p2 = store.addPlace({ x: 400, y: -50 }, 'P2')
      const p3 = store.addPlace({ x: 400, y: 50 }, 'P3')
      const t4 = store.addTransition({ x: 500, y: 0 }, 'T4')
      const end = store.addPlace({ x: 600, y: 0 }, 'End')

      store.addArc(start.id, t1.id)
      store.addArc(t1.id, p1.id)
      store.addArc(p1.id, t2.id)
      store.addArc(p1.id, t3.id)
      store.addArc(t2.id, p2.id)
      store.addArc(t3.id, p3.id)
      store.addArc(p2.id, t4.id)
      store.addArc(p3.id, t4.id)
      store.addArc(t4.id, end.id)

      const result = analyzeSoundness(store.net)

      // Structurally a workflow net, but t4 can never fire -> not sound.
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.code === 'SN007')).toBe(false)
      expect(
        result.issues.some(i => i.code === 'SN004' || i.code === 'SN005')
      ).toBe(true)
    })
  })

  describe('buildReachabilityGraph', () => {
    it('should build a complete graph for a simple bounded net', () => {
      const store = usePetriNetStore()
      const p1 = store.addPlace({ x: 0, y: 0 }, 'Start')
      store.updatePlace(p1.id, { tokens: 1 })
      const t1 = store.addTransition({ x: 100, y: 0 }, 'T1')
      const p2 = store.addPlace({ x: 200, y: 0 }, 'End')
      store.addArc(p1.id, t1.id)
      store.addArc(t1.id, p2.id)

      const graph = buildReachabilityGraph(store.net, { [p1.id]: 1 })

      expect(graph).not.toBeNull()
      expect(graph!.nodes.length).toBe(2)
      expect(graph!.edges.length).toBe(1)
      expect(graph!.bounded).toBe(true)
      expect(graph!.nodes[0].isInitial).toBe(true)
      expect(graph!.nodes.some(n => n.isFinal)).toBe(true)
    })

    it('should contain no omega values', () => {
      const store = usePetriNetStore()
      const p1 = store.addPlace({ x: 0, y: 0 }, 'Start')
      store.updatePlace(p1.id, { tokens: 1 })
      const t1 = store.addTransition({ x: 100, y: 0 }, 'T1')
      const p2 = store.addPlace({ x: 200, y: 0 }, 'End')
      store.addArc(p1.id, t1.id)
      store.addArc(t1.id, p2.id)

      const graph = buildReachabilityGraph(store.net, { [p1.id]: 1 })

      expect(graph).not.toBeNull()
      for (const node of graph!.nodes) {
        for (const val of Object.values(node.marking)) {
          expect(val).not.toBe('omega')
        }
      }
    })

    it('should return null for an unbounded net', () => {
      const store = usePetriNetStore()
      const p1 = store.addPlace({ x: 0, y: 0 }, 'P1')
      store.updatePlace(p1.id, { tokens: 1 })
      const t1 = store.addTransition({ x: 100, y: 0 }, 'T1')
      store.addArc(p1.id, t1.id)
      store.addArc(t1.id, p1.id)
      const p2 = store.addPlace({ x: 200, y: 0 }, 'P2')
      store.addArc(t1.id, p2.id)

      const graph = buildReachabilityGraph(store.net, { [p1.id]: 1 }, 50)

      expect(graph).toBeNull()
    })

    it('should detect deadlocks', () => {
      const store = usePetriNetStore()
      const p1 = store.addPlace({ x: 0, y: 0 }, 'Start')
      store.updatePlace(p1.id, { tokens: 1 })
      const t1 = store.addTransition({ x: 100, y: 0 }, 'T1')
      const p2 = store.addPlace({ x: 200, y: 0 }, 'Dead')
      store.addArc(p1.id, t1.id)
      store.addArc(t1.id, p2.id)

      const graph = buildReachabilityGraph(store.net, { [p1.id]: 1 })

      expect(graph).not.toBeNull()
      expect(graph!.deadlockNodes.length).toBeGreaterThan(0)
    })

    it('should handle a net with a cycle (bounded)', () => {
      const store = usePetriNetStore()
      const p1 = store.addPlace({ x: 0, y: 0 }, 'P1')
      store.updatePlace(p1.id, { tokens: 1 })
      const t1 = store.addTransition({ x: 100, y: 0 }, 'T1')
      const p2 = store.addPlace({ x: 200, y: 0 }, 'P2')
      const t2 = store.addTransition({ x: 300, y: 0 }, 'T2')
      store.addArc(p1.id, t1.id)
      store.addArc(t1.id, p2.id)
      store.addArc(p2.id, t2.id)
      store.addArc(t2.id, p1.id)

      const graph = buildReachabilityGraph(store.net, { [p1.id]: 1 })

      expect(graph).not.toBeNull()
      expect(graph!.bounded).toBe(true)
      expect(graph!.nodes.length).toBe(2)
      expect(graph!.edges.length).toBe(2)
    })

    it('should differ from coverability graph for unbounded nets', () => {
      const store = usePetriNetStore()
      const p1 = store.addPlace({ x: 0, y: 0 }, 'P1')
      store.updatePlace(p1.id, { tokens: 1 })
      const t1 = store.addTransition({ x: 100, y: 0 }, 'T1')
      store.addArc(p1.id, t1.id)
      store.addArc(t1.id, p1.id)
      const p2 = store.addPlace({ x: 200, y: 0 }, 'P2')
      store.addArc(t1.id, p2.id)

      const reachGraph = buildReachabilityGraph(store.net, { [p1.id]: 1 }, 50)
      const coverGraph = buildCoverabilityGraph(store.net, { [p1.id]: 1 })

      expect(reachGraph).toBeNull()
      expect(coverGraph).not.toBeNull()
      expect(coverGraph.bounded).toBe(false)
    })
  })
})
