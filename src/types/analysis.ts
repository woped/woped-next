/**
 * Type of analysis performed
 */
export type AnalysisType = 'workflow' | 'soundness' | 'structural'

/**
 * Severity level for issues
 */
export type IssueSeverity = 'error' | 'warning' | 'info'

/**
 * Issue codes for categorization
 */
export const IssueCodes = {
  // Workflow issues (WF)
  WF001: 'WF001', // Multiple or no source places
  WF002: 'WF002', // Multiple or no sink places
  WF003: 'WF003', // Not strongly connected
  WF004: 'WF004', // Isolated elements

  // Soundness issues (SN)
  SN001: 'SN001', // Deadlock detected
  SN002: 'SN002', // Dead transition
  SN003: 'SN003', // Unbounded place
  SN004: 'SN004', // No option to complete

  // Structural issues (ST)
  ST001: 'ST001', // Empty net
  ST002: 'ST002', // No transitions
  ST003: 'ST003', // Disconnected component
} as const

export type IssueCode = (typeof IssueCodes)[keyof typeof IssueCodes]

/**
 * An issue found during analysis
 */
export interface AnalysisIssue {
  severity: IssueSeverity
  code: IssueCode
  message: string
  affectedElements: string[]
  details?: string
}

/**
 * Statistics about the net structure
 */
export interface NetStatistics {
  places: number
  transitions: number
  arcs: number
  operators: number
  totalTokens: number
  sourcePlaces: string[]
  sinkPlaces: string[]
  sourceTransitions: string[]
  sinkTransitions: string[]
  stronglyConnected: boolean
  freeChoice: boolean
  stateMachine: boolean
  markedGraph: boolean
}

/**
 * Result of an analysis
 */
export interface AnalysisResult {
  timestamp: number
  type: AnalysisType
  valid: boolean
  issues: AnalysisIssue[]
  statistics: NetStatistics
  duration: number
}

/**
 * Node in the coverability/reachability graph
 */
export interface CoverabilityNode {
  id: string
  marking: Record<string, number | 'omega'>
  parentId?: string
  firedTransition?: string
  isDeadlock: boolean
  isInitial: boolean
  isFinal: boolean
}

/**
 * Edge in the coverability/reachability graph
 */
export interface CoverabilityEdge {
  from: string
  to: string
  transitionId: string
  transitionName: string
}

/**
 * The complete coverability/reachability graph
 */
export interface CoverabilityGraph {
  nodes: CoverabilityNode[]
  edges: CoverabilityEdge[]
  bounded: boolean
  deadlockNodes: string[]
  reachableFinalStates: number
}

/**
 * Default empty statistics
 */
export const EMPTY_STATISTICS: NetStatistics = {
  places: 0,
  transitions: 0,
  arcs: 0,
  operators: 0,
  totalTokens: 0,
  sourcePlaces: [],
  sinkPlaces: [],
  sourceTransitions: [],
  sinkTransitions: [],
  stronglyConnected: false,
  freeChoice: false,
  stateMachine: false,
  markedGraph: false,
}

/**
 * Default empty analysis result
 */
export const EMPTY_ANALYSIS_RESULT: AnalysisResult = {
  timestamp: 0,
  type: 'structural',
  valid: true,
  issues: [],
  statistics: EMPTY_STATISTICS,
  duration: 0,
}
