import { defineStore } from 'pinia'
import type { HelpState, HelpArticle, GuidedTour, HelpCategory } from '@/types/help'
import { HELP_STORAGE_KEY } from '@/types/help'
import { helpArticles } from '@/help/articles'
import { guidedTours } from '@/help/tours'

export const useHelpStore = defineStore('help', {
  state: (): HelpState => ({
    dialogOpen: false,
    activeArticleId: null,
    searchQuery: '',
    activeTourId: null,
    activeTourStep: 0,
    seenTours: [],
    hasSeenWelcome: false,
  }),

  getters: {
    articles(): HelpArticle[] {
      return helpArticles
    },

    tours(): GuidedTour[] {
      return guidedTours
    },

    activeArticle(): HelpArticle | null {
      if (!this.activeArticleId) return null
      return helpArticles.find((a) => a.id === this.activeArticleId) ?? null
    },

    activeTour(): GuidedTour | null {
      if (!this.activeTourId) return null
      return guidedTours.find((t) => t.id === this.activeTourId) ?? null
    },

    activeTourCurrentStep(): import('@/types/help').TourStep | null {
      const tour = this.activeTour
      if (!tour) return null
      return tour.steps[this.activeTourStep] ?? null
    },

    isTourActive(): boolean {
      return this.activeTourId !== null
    },

    articlesByCategory() {
      const grouped: Record<string, HelpArticle[]> = {}
      for (const article of helpArticles) {
        if (!grouped[article.category]) {
          grouped[article.category] = []
        }
        grouped[article.category].push(article)
      }
      return grouped
    },

    filteredArticles(): HelpArticle[] {
      const q = this.searchQuery.trim().toLowerCase()
      if (!q) return helpArticles
      return helpArticles.filter((a) =>
        a.keywords.some((k) => k.toLowerCase().includes(q)) ||
        a.id.toLowerCase().includes(q)
      )
    },

    filteredArticlesByCategory() {
      const articles = this.filteredArticles
      const grouped: Record<string, HelpArticle[]> = {}
      for (const article of articles) {
        if (!grouped[article.category]) {
          grouped[article.category] = []
        }
        grouped[article.category].push(article)
      }
      return grouped
    },
  },

  actions: {
    openDialog(articleId?: string) {
      this.dialogOpen = true
      if (articleId) {
        this.activeArticleId = articleId
      } else if (!this.activeArticleId) {
        this.activeArticleId = helpArticles[0]?.id ?? null
      }
    },

    closeDialog() {
      this.dialogOpen = false
      this.searchQuery = ''
    },

    setArticle(articleId: string) {
      this.activeArticleId = articleId
    },

    setSearch(query: string) {
      this.searchQuery = query
    },

    openArticleByCategory(category: HelpCategory) {
      const article = helpArticles.find((a) => a.category === category)
      if (article) {
        this.activeArticleId = article.id
        this.dialogOpen = true
      }
    },

    startTour(tourId: string) {
      this.activeTourId = tourId
      this.activeTourStep = 0
      this.dialogOpen = false
    },

    nextTourStep() {
      const tour = this.activeTour
      if (!tour) return
      if (this.activeTourStep < tour.steps.length - 1) {
        this.activeTourStep++
      } else {
        this.endTour()
      }
    },

    prevTourStep() {
      if (this.activeTourStep > 0) {
        this.activeTourStep--
      }
    },

    endTour() {
      if (this.activeTourId && !this.seenTours.includes(this.activeTourId)) {
        this.seenTours.push(this.activeTourId)
      }
      this.activeTourId = null
      this.activeTourStep = 0
      this.savePersisted()
    },

    markWelcomeSeen() {
      this.hasSeenWelcome = true
      this.savePersisted()
    },

    loadPersisted() {
      try {
        const saved = localStorage.getItem(HELP_STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.seenTours) this.seenTours = parsed.seenTours
          if (parsed.hasSeenWelcome) this.hasSeenWelcome = parsed.hasSeenWelcome
        }
      } catch {
        // Ignore parse errors
      }
    },

    savePersisted() {
      try {
        localStorage.setItem(
          HELP_STORAGE_KEY,
          JSON.stringify({
            seenTours: this.seenTours,
            hasSeenWelcome: this.hasSeenWelcome,
          })
        )
      } catch {
        // Ignore storage errors
      }
    },
  },
})
