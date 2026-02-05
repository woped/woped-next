/**
 * Token Game status
 */
export type TokenGameStatus = 'stopped' | 'playing' | 'paused'

/**
 * Conflict resolution mode for multiple enabled transitions
 */
export type ConflictResolutionMode = 'manual' | 'random' | 'first'

/**
 * A marking represents the token distribution at a point in time
 */
export interface Marking {
  /** Timestamp when this marking was created */
  timestamp: number
  /** Map of placeId to token count */
  tokens: Record<string, number>
  /** The transition that was fired to reach this marking (if any) */
  firedTransition?: string
}

/**
 * Token animation state
 */
export interface TokenAnimation {
  id: string
  /** Source place ID */
  fromPlaceId: string
  /** Target place ID */
  toPlaceId: string
  /** Transition being fired */
  transitionId: string
  /** Animation progress (0 to 1) */
  progress: number
  /** Start position */
  startPos: { x: number; y: number }
  /** End position */
  endPos: { x: number; y: number }
}

/**
 * Token Game state interface
 */
export interface TokenGameState {
  /** Current game status */
  status: TokenGameStatus
  /** Current marking (token distribution) */
  marking: Marking
  /** History of markings for navigation */
  history: Marking[]
  /** Current position in history */
  historyIndex: number
  /** List of currently enabled transition IDs */
  enabledTransitions: string[]
  /** Delay between auto-play steps in ms */
  autoPlayDelay: number
  /** How to resolve conflicts when multiple transitions are enabled */
  conflictResolution: ConflictResolutionMode
  /** Currently active animations */
  activeAnimations: TokenAnimation[]
  /** Whether animation is in progress */
  isAnimating: boolean
}

/**
 * Default token game state
 */
export const DEFAULT_TOKEN_GAME_STATE: TokenGameState = {
  status: 'stopped',
  marking: { timestamp: 0, tokens: {} },
  history: [],
  historyIndex: -1,
  enabledTransitions: [],
  autoPlayDelay: 1000,
  conflictResolution: 'manual',
  activeAnimations: [],
  isAnimating: false,
}

/**
 * Token game settings
 */
export interface TokenGameSettings {
  autoPlayDelay: number
  conflictResolution: ConflictResolutionMode
  animationDuration: number
  showEnabledHighlight: boolean
}

/**
 * Default settings
 */
export const DEFAULT_TOKEN_GAME_SETTINGS: TokenGameSettings = {
  autoPlayDelay: 1000,
  conflictResolution: 'manual',
  animationDuration: 300,
  showEnabledHighlight: true,
}
