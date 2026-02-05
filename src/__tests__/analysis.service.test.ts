import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePetriNetStore } from '@/stores/petriNet'
import { analyzeWorkflow, analyzeSoundness, computeStatistics } from '@/services/analysis'
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

    it('should identify bounded nets', () => {
      const store = usePetriNetStore()
      
      // Simple bounded net
      const start = store.addPlace({ x: 100, y: 100 }, 'Start')
      store.updatePlace(start.id, { tokens: 1 })
      const t1 = store.addTransition({ x: 200, y: 100 }, 'T1')
      const end = store.addPlace({ x: 300, y: 100 }, 'End')
      
      store.addArc(start.id, t1.id)
      store.addArc(t1.id, end.id)

      const result = analyzeSoundness(store.net)

      // Should find that the net is bounded
      expect(result.issues.some(i => i.message.includes('bounded'))).toBe(true)
    })
  })
})
