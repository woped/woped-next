import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePetriNetStore } from '@/stores/petriNet'
import { useTokenGameStore } from '@/stores/tokenGame'

describe('TokenGame Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function createSimpleNet() {
    const petriStore = usePetriNetStore()
    
    // Create: P1 -> T1 -> P2
    const p1 = petriStore.addPlace({ x: 100, y: 100 }, 'P1')
    petriStore.updatePlace(p1.id, { tokens: 1 })
    const t1 = petriStore.addTransition({ x: 200, y: 100 }, 'T1')
    const p2 = petriStore.addPlace({ x: 300, y: 100 }, 'P2')
    
    petriStore.addArc(p1.id, t1.id)
    petriStore.addArc(t1.id, p2.id)
    
    return { p1, t1, p2, petriStore }
  }

  describe('Start/Stop', () => {
    it('should start the token game', () => {
      createSimpleNet()
      const tokenStore = useTokenGameStore()

      tokenStore.start()

      expect(tokenStore.status).toBe('paused')
      expect(tokenStore.isRunning).toBe(true)
      expect(tokenStore.history).toHaveLength(1)
    })

    it('should stop the token game', () => {
      createSimpleNet()
      const tokenStore = useTokenGameStore()

      tokenStore.start()
      tokenStore.stop()

      expect(tokenStore.status).toBe('stopped')
      expect(tokenStore.isRunning).toBe(false)
    })
  })

  describe('Marking', () => {
    it('should capture initial marking', () => {
      const { p1 } = createSimpleNet()
      const tokenStore = useTokenGameStore()

      tokenStore.start()

      expect(tokenStore.marking.tokens[p1.id]).toBe(1)
    })

    it('should detect enabled transitions', () => {
      const { t1 } = createSimpleNet()
      const tokenStore = useTokenGameStore()

      tokenStore.start()

      expect(tokenStore.enabledTransitions).toContain(t1.id)
    })

    it('should not enable transitions without tokens', () => {
      const petriStore = usePetriNetStore()
      
      // P1 (no tokens) -> T1 -> P2
      const p1 = petriStore.addPlace({ x: 100, y: 100 }, 'P1')
      const t1 = petriStore.addTransition({ x: 200, y: 100 }, 'T1')
      const p2 = petriStore.addPlace({ x: 300, y: 100 }, 'P2')
      
      petriStore.addArc(p1.id, t1.id)
      petriStore.addArc(t1.id, p2.id)

      const tokenStore = useTokenGameStore()
      tokenStore.start()

      expect(tokenStore.enabledTransitions).not.toContain(t1.id)
    })
  })

  describe('Fire Transition', () => {
    it('should fire an enabled transition', async () => {
      const { p1, t1, p2 } = createSimpleNet()
      const tokenStore = useTokenGameStore()

      tokenStore.start()
      await tokenStore.fireTransition(t1.id)

      // Token moved from P1 to P2
      expect(tokenStore.marking.tokens[p1.id] ?? 0).toBe(0)
      expect(tokenStore.marking.tokens[p2.id]).toBe(1)
    })

    it('should add to history when firing', async () => {
      const { t1 } = createSimpleNet()
      const tokenStore = useTokenGameStore()

      tokenStore.start()
      expect(tokenStore.history).toHaveLength(1)

      await tokenStore.fireTransition(t1.id)

      expect(tokenStore.history).toHaveLength(2)
      expect(tokenStore.historyIndex).toBe(1)
    })

    it('should not fire disabled transition', async () => {
      const { p1, t1 } = createSimpleNet()
      const tokenStore = useTokenGameStore()
      const petriStore = usePetriNetStore()

      // Remove token
      petriStore.updatePlace(p1.id, { tokens: 0 })

      tokenStore.start()
      const initialMarking = { ...tokenStore.marking.tokens }

      await tokenStore.fireTransition(t1.id)

      // Marking should be unchanged
      expect(tokenStore.marking.tokens).toEqual(initialMarking)
    })
  })

  describe('History Navigation', () => {
    it('should step backward in history', async () => {
      const { p1, t1, p2 } = createSimpleNet()
      const tokenStore = useTokenGameStore()

      tokenStore.start()
      await tokenStore.fireTransition(t1.id)

      // Now at step 2, P2 has token
      expect(tokenStore.marking.tokens[p2.id]).toBe(1)

      tokenStore.stepBackward()

      // Back to step 1, P1 has token
      expect(tokenStore.marking.tokens[p1.id]).toBe(1)
      expect(tokenStore.marking.tokens[p2.id] ?? 0).toBe(0)
    })

    it('should step forward in history', async () => {
      const { p1, t1, p2 } = createSimpleNet()
      const tokenStore = useTokenGameStore()

      tokenStore.start()
      await tokenStore.fireTransition(t1.id)
      tokenStore.stepBackward()

      // Back at step 1
      expect(tokenStore.marking.tokens[p1.id]).toBe(1)

      tokenStore.stepForward()

      // Forward to step 2
      expect(tokenStore.marking.tokens[p2.id]).toBe(1)
    })

    it('should not step backward at start', () => {
      createSimpleNet()
      const tokenStore = useTokenGameStore()

      tokenStore.start()

      expect(tokenStore.canStepBackward).toBe(false)
    })

    it('should not step forward at end', () => {
      createSimpleNet()
      const tokenStore = useTokenGameStore()

      tokenStore.start()

      expect(tokenStore.canStepForward).toBe(false)
    })
  })

  describe('Deadlock Detection', () => {
    it('should detect deadlock when no transitions enabled', async () => {
      const { t1 } = createSimpleNet()
      const tokenStore = useTokenGameStore()

      tokenStore.start()
      await tokenStore.fireTransition(t1.id)

      // After firing, P2 has token but T1 needs P1
      expect(tokenStore.enabledTransitions).toHaveLength(0)
      expect(tokenStore.isDeadlock).toBe(true)
    })
  })
})
