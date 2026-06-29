import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHelpStore } from '@/stores/help'
import { HELP_STORAGE_KEY } from '@/types/help'
import { helpArticles } from '@/help/articles'
import { guidedTours } from '@/help/tours'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

describe('Help Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
  })

  describe('Default State', () => {
    it('should have correct initial values', () => {
      const store = useHelpStore()

      expect(store.dialogOpen).toBe(false)
      expect(store.activeArticleId).toBeNull()
      expect(store.searchQuery).toBe('')
      expect(store.activeTourId).toBeNull()
      expect(store.activeTourStep).toBe(0)
      expect(store.seenTours).toEqual([])
      expect(store.hasSeenWelcome).toBe(false)
    })
  })

  describe('openDialog', () => {
    it('should open the dialog and default to first article when none active', () => {
      const store = useHelpStore()

      store.openDialog()

      expect(store.dialogOpen).toBe(true)
      expect(store.activeArticleId).toBe(helpArticles[0].id)
    })

    it('should open with a specific article id', () => {
      const store = useHelpStore()

      store.openDialog('shortcuts')

      expect(store.dialogOpen).toBe(true)
      expect(store.activeArticleId).toBe('shortcuts')
    })

    it('should keep existing activeArticleId when called without argument', () => {
      const store = useHelpStore()
      store.activeArticleId = 'settings'

      store.openDialog()

      expect(store.dialogOpen).toBe(true)
      expect(store.activeArticleId).toBe('settings')
    })
  })

  describe('closeDialog', () => {
    it('should close the dialog and clear search', () => {
      const store = useHelpStore()
      store.dialogOpen = true
      store.searchQuery = 'token'

      store.closeDialog()

      expect(store.dialogOpen).toBe(false)
      expect(store.searchQuery).toBe('')
    })
  })

  describe('setArticle', () => {
    it('should set the active article id', () => {
      const store = useHelpStore()

      store.setArticle('editor-tools')

      expect(store.activeArticleId).toBe('editor-tools')
    })
  })

  describe('setSearch', () => {
    it('should update the search query', () => {
      const store = useHelpStore()

      store.setSearch('token game')

      expect(store.searchQuery).toBe('token game')
    })
  })

  describe('openArticleByCategory', () => {
    it('should open the first article of the given category', () => {
      const store = useHelpStore()

      store.openArticleByCategory('editor')

      expect(store.dialogOpen).toBe(true)
      expect(store.activeArticleId).toBe('editor-tools')
    })

    it('should do nothing for a non-existent category', () => {
      const store = useHelpStore()

      store.openArticleByCategory('nonexistent' as 'getting-started')

      expect(store.dialogOpen).toBe(false)
      expect(store.activeArticleId).toBeNull()
    })
  })

  describe('startTour', () => {
    it('should activate the tour, reset step, and close dialog', () => {
      const store = useHelpStore()
      store.dialogOpen = true
      store.activeTourStep = 3

      store.startTour('welcome')

      expect(store.activeTourId).toBe('welcome')
      expect(store.activeTourStep).toBe(0)
      expect(store.dialogOpen).toBe(false)
    })
  })

  describe('nextTourStep', () => {
    it('should advance the step by one', () => {
      const store = useHelpStore()
      store.startTour('welcome')

      store.nextTourStep()

      expect(store.activeTourStep).toBe(1)
    })

    it('should end the tour when on the last step', () => {
      const store = useHelpStore()
      const tour = guidedTours.find((t) => t.id === 'welcome')!
      store.startTour('welcome')
      store.activeTourStep = tour.steps.length - 1

      store.nextTourStep()

      expect(store.activeTourId).toBeNull()
      expect(store.activeTourStep).toBe(0)
      expect(store.seenTours).toContain('welcome')
    })

    it('should do nothing when no tour is active', () => {
      const store = useHelpStore()

      store.nextTourStep()

      expect(store.activeTourStep).toBe(0)
    })
  })

  describe('prevTourStep', () => {
    it('should go back one step', () => {
      const store = useHelpStore()
      store.startTour('welcome')
      store.activeTourStep = 2

      store.prevTourStep()

      expect(store.activeTourStep).toBe(1)
    })

    it('should not go below step 0', () => {
      const store = useHelpStore()
      store.startTour('welcome')

      store.prevTourStep()

      expect(store.activeTourStep).toBe(0)
    })
  })

  describe('endTour', () => {
    it('should add the tour to seenTours and reset state', () => {
      const store = useHelpStore()
      store.startTour('welcome')
      store.activeTourStep = 2

      store.endTour()

      expect(store.activeTourId).toBeNull()
      expect(store.activeTourStep).toBe(0)
      expect(store.seenTours).toContain('welcome')
    })

    it('should not duplicate in seenTours when ending the same tour twice', () => {
      const store = useHelpStore()
      store.startTour('welcome')
      store.endTour()

      store.startTour('welcome')
      store.endTour()

      expect(store.seenTours.filter((id) => id === 'welcome')).toHaveLength(1)
    })

    it('should persist seenTours to localStorage', () => {
      const store = useHelpStore()
      store.startTour('welcome')

      store.endTour()

      const saved = JSON.parse(localStorage.getItem(HELP_STORAGE_KEY)!)
      expect(saved.seenTours).toContain('welcome')
    })
  })

  describe('markWelcomeSeen', () => {
    it('should set hasSeenWelcome and persist', () => {
      const store = useHelpStore()

      store.markWelcomeSeen()

      expect(store.hasSeenWelcome).toBe(true)
      const saved = JSON.parse(localStorage.getItem(HELP_STORAGE_KEY)!)
      expect(saved.hasSeenWelcome).toBe(true)
    })
  })

  describe('loadPersisted / savePersisted', () => {
    it('should roundtrip seenTours through localStorage', () => {
      const store = useHelpStore()
      store.seenTours = ['welcome', 'editor-basics']
      store.hasSeenWelcome = true
      store.savePersisted()

      const store2 = useHelpStore()
      store2.seenTours = []
      store2.hasSeenWelcome = false
      store2.loadPersisted()

      expect(store2.seenTours).toEqual(['welcome', 'editor-basics'])
      expect(store2.hasSeenWelcome).toBe(true)
    })

    it('should handle missing localStorage key gracefully', () => {
      const store = useHelpStore()

      store.loadPersisted()

      expect(store.seenTours).toEqual([])
      expect(store.hasSeenWelcome).toBe(false)
    })

    it('should handle corrupt localStorage data gracefully', () => {
      localStorage.setItem(HELP_STORAGE_KEY, '{invalid json!!!')
      const store = useHelpStore()

      store.loadPersisted()

      expect(store.seenTours).toEqual([])
      expect(store.hasSeenWelcome).toBe(false)
    })

    it('should handle partial persisted data', () => {
      localStorage.setItem(HELP_STORAGE_KEY, JSON.stringify({ seenTours: ['welcome'] }))
      const store = useHelpStore()

      store.loadPersisted()

      expect(store.seenTours).toEqual(['welcome'])
      expect(store.hasSeenWelcome).toBe(false)
    })
  })

  describe('Getters', () => {
    describe('articles / tours', () => {
      it('should return all help articles', () => {
        const store = useHelpStore()
        expect(store.articles).toEqual(helpArticles)
        expect(store.articles.length).toBeGreaterThan(0)
      })

      it('should return all guided tours', () => {
        const store = useHelpStore()
        expect(store.tours).toEqual(guidedTours)
        expect(store.tours.length).toBeGreaterThan(0)
      })
    })

    describe('activeArticle', () => {
      it('should return null when no article is active', () => {
        const store = useHelpStore()
        expect(store.activeArticle).toBeNull()
      })

      it('should return the matching article', () => {
        const store = useHelpStore()
        store.activeArticleId = 'welcome'

        expect(store.activeArticle).not.toBeNull()
        expect(store.activeArticle!.id).toBe('welcome')
      })

      it('should return null for an invalid article id', () => {
        const store = useHelpStore()
        store.activeArticleId = 'does-not-exist'

        expect(store.activeArticle).toBeNull()
      })
    })

    describe('activeTour', () => {
      it('should return null when no tour is active', () => {
        const store = useHelpStore()
        expect(store.activeTour).toBeNull()
      })

      it('should return the matching tour', () => {
        const store = useHelpStore()
        store.activeTourId = 'welcome'

        expect(store.activeTour).not.toBeNull()
        expect(store.activeTour!.id).toBe('welcome')
      })

      it('should return null for an invalid tour id', () => {
        const store = useHelpStore()
        store.activeTourId = 'does-not-exist'

        expect(store.activeTour).toBeNull()
      })
    })

    describe('activeTourCurrentStep', () => {
      it('should return null when no tour is active', () => {
        const store = useHelpStore()
        expect(store.activeTourCurrentStep).toBeNull()
      })

      it('should return the current step object', () => {
        const store = useHelpStore()
        store.startTour('welcome')

        const step = store.activeTourCurrentStep
        expect(step).not.toBeNull()
        expect(step!.variant).toBe('splash')
        expect(step!.targetSelector).toBe('')
      })

      it('should return null for an out-of-bounds step index', () => {
        const store = useHelpStore()
        store.activeTourId = 'welcome'
        store.activeTourStep = 999

        expect(store.activeTourCurrentStep).toBeNull()
      })
    })

    describe('isTourActive', () => {
      it('should be false initially', () => {
        const store = useHelpStore()
        expect(store.isTourActive).toBe(false)
      })

      it('should be true when a tour is started', () => {
        const store = useHelpStore()
        store.startTour('welcome')
        expect(store.isTourActive).toBe(true)
      })

      it('should be false after tour ends', () => {
        const store = useHelpStore()
        store.startTour('welcome')
        store.endTour()
        expect(store.isTourActive).toBe(false)
      })
    })

    describe('filteredArticles', () => {
      it('should return all articles when search is empty', () => {
        const store = useHelpStore()
        expect(store.filteredArticles).toEqual(helpArticles)
      })

      it('should filter by keyword match', () => {
        const store = useHelpStore()
        store.searchQuery = 'deadlock'

        const results = store.filteredArticles
        expect(results.length).toBeGreaterThan(0)
        expect(results.some((a) => a.id === 'token-game-conflicts')).toBe(true)
      })

      it('should filter by article id', () => {
        const store = useHelpStore()
        store.searchQuery = 'shortcuts'

        const results = store.filteredArticles
        expect(results.some((a) => a.id === 'shortcuts')).toBe(true)
      })

      it('should be case insensitive', () => {
        const store = useHelpStore()
        store.searchQuery = 'DEADLOCK'

        expect(store.filteredArticles.length).toBeGreaterThan(0)
      })

      it('should return empty when no match', () => {
        const store = useHelpStore()
        store.searchQuery = 'xyznonexistentkeyword'

        expect(store.filteredArticles).toHaveLength(0)
      })

      it('should ignore whitespace-only search', () => {
        const store = useHelpStore()
        store.searchQuery = '   '

        expect(store.filteredArticles).toEqual(helpArticles)
      })
    })

    describe('articlesByCategory', () => {
      it('should group all articles by category', () => {
        const store = useHelpStore()
        const grouped = store.articlesByCategory as Record<string, unknown[]>

        expect(grouped['getting-started']).toBeDefined()
        expect(grouped['editor']).toBeDefined()

        const total = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0)
        expect(total).toBe(helpArticles.length)
      })
    })

    describe('filteredArticlesByCategory', () => {
      it('should group filtered articles by category', () => {
        const store = useHelpStore()
        store.searchQuery = 'token'

        const grouped = store.filteredArticlesByCategory as Record<string, unknown[]>
        const total = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0)
        expect(total).toBe(store.filteredArticles.length)
        expect(total).toBeGreaterThan(0)
        expect(total).toBeLessThan(helpArticles.length)
      })

      it('should return all categories when search is empty', () => {
        const store = useHelpStore()
        const grouped = store.filteredArticlesByCategory as Record<string, unknown[]>
        const total = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0)
        expect(total).toBe(helpArticles.length)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle startTour with an invalid tour id', () => {
      const store = useHelpStore()

      store.startTour('nonexistent-tour')

      expect(store.activeTourId).toBe('nonexistent-tour')
      expect(store.activeTour).toBeNull()
      expect(store.activeTourCurrentStep).toBeNull()
    })

    it('should handle nextTourStep with invalid tour id (no-op)', () => {
      const store = useHelpStore()
      store.activeTourId = 'nonexistent-tour'

      store.nextTourStep()

      expect(store.activeTourStep).toBe(0)
    })

    it('should handle setArticle with non-existent id', () => {
      const store = useHelpStore()

      store.setArticle('bogus-id')

      expect(store.activeArticleId).toBe('bogus-id')
      expect(store.activeArticle).toBeNull()
    })

    it('should handle localStorage.setItem throwing', () => {
      const orig = localStorageMock.setItem
      localStorageMock.setItem = () => { throw new Error('quota exceeded') }

      const store = useHelpStore()
      store.startTour('welcome')

      expect(() => store.endTour()).not.toThrow()

      localStorageMock.setItem = orig
    })

    it('should handle localStorage.getItem throwing', () => {
      const orig = localStorageMock.getItem
      localStorageMock.getItem = () => { throw new Error('access denied') }

      const store = useHelpStore()

      expect(() => store.loadPersisted()).not.toThrow()
      expect(store.seenTours).toEqual([])

      localStorageMock.getItem = orig
    })
  })
})
