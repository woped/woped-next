/**
 * Help article category identifiers
 */
export type HelpCategory =
  | 'getting-started'
  | 'editor'
  | 'operators'
  | 'subprocesses'
  | 'token-game'
  | 'analysis'
  | 'simulation'
  | 'files'
  | 'settings'
  | 'shortcuts'

/**
 * A single help article
 */
export interface HelpArticle {
  id: string
  category: HelpCategory
  titleKey: string
  contentKey: string
  icon: string
  keywords: string[]
  tourId?: string
}

/**
 * Category metadata for navigation grouping
 */
export interface HelpCategoryMeta {
  id: HelpCategory
  titleKey: string
  icon: string
  order: number
}

/**
 * A single step in a guided tour
 */
export interface TourStep {
  targetSelector: string
  titleKey: string
  contentKey: string
  placement: 'top' | 'bottom' | 'left' | 'right'
  highlightPadding?: number
}

/**
 * A guided tour definition
 */
export interface GuidedTour {
  id: string
  titleKey: string
  descriptionKey: string
  steps: TourStep[]
}

/**
 * Inline help tooltip definition
 */
export interface HelpTooltipDef {
  id: string
  titleKey: string
  contentKey: string
  articleId?: string
}

/**
 * Help store state
 */
export interface HelpState {
  dialogOpen: boolean
  activeArticleId: string | null
  searchQuery: string
  activeTourId: string | null
  activeTourStep: number
  seenTours: string[]
  hasSeenWelcome: boolean
}

/**
 * localStorage key for help state persistence
 */
export const HELP_STORAGE_KEY = 'woped-help'

/**
 * All help categories with metadata
 */
export const HELP_CATEGORIES: HelpCategoryMeta[] = [
  { id: 'getting-started', titleKey: 'help.categories.gettingStarted', icon: '🚀', order: 0 },
  { id: 'editor', titleKey: 'help.categories.editor', icon: '✏️', order: 1 },
  { id: 'operators', titleKey: 'help.categories.operators', icon: '◇', order: 2 },
  { id: 'subprocesses', titleKey: 'help.categories.subprocesses', icon: '⊞', order: 3 },
  { id: 'token-game', titleKey: 'help.categories.tokenGame', icon: '▶', order: 4 },
  { id: 'analysis', titleKey: 'help.categories.analysis', icon: '🔍', order: 5 },
  { id: 'simulation', titleKey: 'help.categories.simulation', icon: '📊', order: 6 },
  { id: 'files', titleKey: 'help.categories.files', icon: '📁', order: 7 },
  { id: 'settings', titleKey: 'help.categories.settings', icon: '⚙', order: 8 },
  { id: 'shortcuts', titleKey: 'help.categories.shortcuts', icon: '⌨', order: 9 },
]
