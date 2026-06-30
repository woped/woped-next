import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePetriNetStore } from '@/stores/petriNet'

const STORAGE_KEY = 'woped-petrinet'

// Self-contained localStorage mock (the test environment's localStorage is not
// guaranteed to implement the full Web Storage API).
let backing: Record<string, string> = {}
const setItemSpy = vi.fn((key: string, value: string) => {
  backing[key] = value
})
const localStorageMock = {
  getItem: (key: string) => backing[key] ?? null,
  setItem: setItemSpy,
  removeItem: (key: string) => {
    delete backing[key]
  },
  clear: () => {
    backing = {}
  },
}
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
})

describe('PetriNet Store persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing = {}
    setItemSpy.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('persists nets and active net id to localStorage', () => {
    const store = usePetriNetStore()
    store.addPlace({ x: 10, y: 20 }, 'P1')

    store.saveToLocalStorage()

    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw as string)
    expect(parsed.activeNetId).toBe(store.activeNetId)
    expect(parsed.nets[store.activeNetId].places).toHaveLength(1)
  })

  it('restores a previously saved net into a fresh store', () => {
    const first = usePetriNetStore()
    const place = first.addPlace({ x: 42, y: 99 }, 'Saved')
    first.saveToLocalStorage()
    const savedActiveId = first.activeNetId

    // Simulate a page reload with a brand new store instance.
    setActivePinia(createPinia())
    const restored = usePetriNetStore()

    expect(restored.loadFromLocalStorage()).toBe(true)
    expect(restored.hydratedFromStorage).toBe(true)
    expect(restored.activeNetId).toBe(savedActiveId)
    expect(restored.net.places).toHaveLength(1)
    expect(restored.net.places[0].name).toBe('Saved')
    expect(restored.net.places[0].id).toBe(place.id)
  })

  it('returns false when no state is persisted', () => {
    const store = usePetriNetStore()
    expect(store.loadFromLocalStorage()).toBe(false)
    expect(store.hydratedFromStorage).toBe(false)
  })

  it('returns false and does not throw on corrupted data', () => {
    backing[STORAGE_KEY] = '{ this is not valid json'
    const store = usePetriNetStore()
    expect(() => store.loadFromLocalStorage()).not.toThrow()
    expect(store.loadFromLocalStorage()).toBe(false)
  })

  it('returns false when the active net id references a missing net', () => {
    backing[STORAGE_KEY] = JSON.stringify({ nets: {}, activeNetId: 'does-not-exist' })
    const store = usePetriNetStore()
    expect(store.loadFromLocalStorage()).toBe(false)
  })

  it('debounces scheduled saves into a single write', () => {
    vi.useFakeTimers()
    const store = usePetriNetStore()

    store.scheduleSave()
    store.scheduleSave()
    store.scheduleSave()
    expect(setItemSpy).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)

    const persistWrites = setItemSpy.mock.calls.filter((c) => c[0] === STORAGE_KEY)
    expect(persistWrites).toHaveLength(1)
  })

  it('clearSaved removes persisted state and resets to an empty net', () => {
    const store = usePetriNetStore()
    store.addPlace({ x: 1, y: 2 }, 'P1')
    store.saveToLocalStorage()
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy()

    store.clearSaved()

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(store.net.places).toHaveLength(0)
  })
})
