/**
 * Token Game status
 */
export type TokenGameStatus = 'stopped' | 'playing' | 'paused'

/**
 * Conflict resolution mode for multiple enabled transitions
 */
export type ConflictResolutionMode = 'manual' | 'random' | 'priority'

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
 * State saved when stepping into a subprocess
 */
export interface SubprocessStackEntry {
  /** The net ID we came from */
  parentNetId: string
  /** The subprocess element ID that was entered */
  subprocessId: string
  /** The marking of the parent net when we stepped in */
  parentMarking: Marking
  /** History of the parent net */
  parentHistory: Marking[]
  /** History index of the parent net */
  parentHistoryIndex: number
}

/**
 * Statistics for a single transition
 */
export interface TransitionStats {
  transitionId: string
  transitionName: string
  fireCount: number
}

/**
 * Token game statistics
 */
export interface TokenGameStatistics {
  /** Total number of steps taken */
  totalSteps: number
  /** Total transitions fired */
  transitionsFired: number
  /** Number of conflicts encountered */
  conflictsEncountered: number
  /** Number of times auto-play was used */
  autoPlayCount: number
  /** Number of subprocess entries */
  subprocessEntries: number
  /** Number of deadlocks encountered */
  deadlocksEncountered: number
  /** Transitions fired by ID */
  transitionStats: Record<string, TransitionStats>
  /** Start time of the game */
  startTime: number
  /** Total elapsed time in ms */
  elapsedTime: number
}

/**
 * Default statistics
 */
export const DEFAULT_TOKEN_GAME_STATISTICS: TokenGameStatistics = {
  totalSteps: 0,
  transitionsFired: 0,
  conflictsEncountered: 0,
  autoPlayCount: 0,
  subprocessEntries: 0,
  deadlocksEncountered: 0,
  transitionStats: {},
  startTime: 0,
  elapsedTime: 0,
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
  /** List of enabled subprocess IDs */
  enabledSubprocesses: string[]
  /** Delay between auto-play steps in ms */
  autoPlayDelay: number
  /** How to resolve conflicts when multiple transitions are enabled */
  conflictResolution: ConflictResolutionMode
  /** Currently active animations */
  activeAnimations: TokenAnimation[]
  /** Whether animation is in progress */
  isAnimating: boolean
  /** Stack of parent states when stepping into subprocesses */
  subprocessStack: SubprocessStackEntry[]
  /** Game statistics */
  statistics: TokenGameStatistics
  /** Whether the conflict dialog is showing */
  showConflictDialog: boolean
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
  enabledSubprocesses: [],
  autoPlayDelay: 1000,
  conflictResolution: 'manual',
  activeAnimations: [],
  isAnimating: false,
  subprocessStack: [],
  statistics: { ...DEFAULT_TOKEN_GAME_STATISTICS },
  showConflictDialog: false,
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
