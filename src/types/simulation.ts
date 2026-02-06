/**
 * Distribution types for time modeling
 */
export type DistributionType = 'constant' | 'exponential' | 'normal' | 'uniform' | 'triangular'

/**
 * Statistical distribution configuration
 */
export interface Distribution {
  type: DistributionType
  /** Parameters depend on type:
   * - constant: [value]
   * - exponential: [mean]
   * - normal: [mean, stdDev]
   * - uniform: [min, max]
   * - triangular: [min, mode, max]
   */
  params: number[]
}

/**
 * Simulation configuration
 */
export interface SimulationConfig {
  /** Cases arriving per time unit */
  arrivalRate: number
  /** Total simulation time */
  simulationTime: number
  /** Warmup period (results discarded) */
  warmupTime: number
  /** Number of replications for confidence intervals */
  replications: number
  /** Random seed for reproducibility */
  seed?: number
  /** Time unit label */
  timeUnit: 'seconds' | 'minutes' | 'hours'
}

/**
 * Default simulation configuration
 */
export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  arrivalRate: 10,
  simulationTime: 1000,
  warmupTime: 100,
  replications: 1,
  timeUnit: 'minutes',
}

/**
 * Time model: maps transitions to their processing time distributions
 */
export interface TimeModel {
  /** Transition ID -> Distribution */
  transitionTimes: Record<string, Distribution>
  /** Default distribution for transitions without specific config */
  defaultTime: Distribution
}

/**
 * Default time model
 */
export const DEFAULT_TIME_MODEL: TimeModel = {
  transitionTimes: {},
  defaultTime: { type: 'exponential', params: [5] },
}

/**
 * Simulation event types
 */
export type SimEventType = 'arrival' | 'start' | 'complete' | 'depart'

/**
 * A single simulation event
 */
export interface SimEvent {
  /** Event timestamp */
  time: number
  /** Event type */
  type: SimEventType
  /** Associated transition ID (empty for arrival/depart) */
  transitionId: string
  /** Associated case ID */
  caseId: string
  /** Place ID for token tracking */
  placeId?: string
}

/**
 * A simulation case (process instance)
 */
export interface SimCase {
  /** Unique case ID */
  id: string
  /** Start timestamp */
  startTime: number
  /** End timestamp (0 if not completed) */
  endTime: number
  /** All events for this case */
  events: SimEvent[]
  /** Whether the case completed successfully */
  completed: boolean
  /** Current position (place IDs with tokens) */
  currentMarking: Record<string, number>
}

/**
 * Activity statistics
 */
export interface ActivityStats {
  transitionId: string
  transitionName: string
  /** Number of times executed */
  count: number
  /** Total processing time */
  totalTime: number
  /** Average processing time */
  avgTime: number
  /** Minimum processing time */
  minTime: number
  /** Maximum processing time */
  maxTime: number
  /** Waiting time statistics */
  avgWaitTime: number
  /** Utilization (0-1) */
  utilization: number
}

/**
 * Cycle time statistics
 */
export interface CycleTimeStats {
  avg: number
  min: number
  max: number
  stdDev: number
  median: number
  p90: number
  p95: number
}

/**
 * Overall simulation statistics
 */
export interface SimStatistics {
  /** Cases per time unit */
  throughput: number
  /** Cycle time analysis */
  cycleTime: CycleTimeStats
  /** Completion rate (0-1) */
  completionRate: number
  /** Total cases started */
  casesStarted: number
  /** Total cases completed */
  casesCompleted: number
  /** Cases still in progress at simulation end */
  casesInProgress: number
  /** Per-activity statistics */
  activityStats: ActivityStats[]
  /** Average tokens in system */
  avgTokensInSystem: number
  /** Resource statistics */
  resourceStats?: ResourceStats[]
  /** Bottleneck analysis */
  bottlenecks?: BottleneckInfo[]
}

/**
 * Complete simulation result
 */
export interface SimulationResult {
  /** All cases */
  cases: SimCase[]
  /** Aggregated statistics */
  statistics: SimStatistics
  /** Configuration used */
  config: SimulationConfig
  /** Time model used */
  timeModel: TimeModel
  /** Simulation duration (wall clock) */
  executionTimeMs: number
  /** Random seed used */
  seed: number
}

/**
 * Simulation status
 */
export type SimulationStatus = 'idle' | 'configuring' | 'running' | 'completed' | 'error'

/**
 * Resource definition
 */
export interface Resource {
  /** Unique resource ID */
  id: string
  /** Display name */
  name: string
  /** Number of available units */
  capacity: number
  /** Cost per time unit (optional) */
  costPerTimeUnit?: number
}

/**
 * Resource assignment to a transition
 */
export interface ResourceRequirement {
  /** Resource ID */
  resourceId: string
  /** Number of units required */
  units: number
}

/**
 * Resource model: maps transitions to their resource requirements
 */
export interface ResourceModel {
  /** Available resources */
  resources: Resource[]
  /** Transition ID -> Resource requirements */
  transitionResources: Record<string, ResourceRequirement[]>
}

/**
 * Default resource model
 */
export const DEFAULT_RESOURCE_MODEL: ResourceModel = {
  resources: [],
  transitionResources: {},
}

/**
 * Resource statistics
 */
export interface ResourceStats {
  resourceId: string
  resourceName: string
  /** Utilization (0-1) */
  utilization: number
  /** Total busy time */
  totalBusyTime: number
  /** Total idle time */
  totalIdleTime: number
  /** Times resource was unavailable (caused waiting) */
  contentionCount: number
  /** Average queue length waiting for this resource */
  avgQueueLength: number
}

/**
 * Bottleneck analysis result
 */
export interface BottleneckInfo {
  transitionId: string
  transitionName: string
  /** Utilization (0-1) */
  utilization: number
  /** Average wait time */
  avgWaitTime: number
  /** Total cases affected */
  casesAffected: number
  /** Is this a critical bottleneck? */
  isCritical: boolean
  /** Suggested capacity increase */
  suggestedCapacityIncrease?: number
}

/**
 * Simulation store state
 */
export interface SimulationState {
  status: SimulationStatus
  config: SimulationConfig
  timeModel: TimeModel
  resourceModel: ResourceModel
  result: SimulationResult | null
  progress: number
  error: string | null
}

/**
 * Default simulation state
 */
export const DEFAULT_SIMULATION_STATE: SimulationState = {
  status: 'idle',
  config: { ...DEFAULT_SIMULATION_CONFIG },
  timeModel: { ...DEFAULT_TIME_MODEL },
  resourceModel: { ...DEFAULT_RESOURCE_MODEL },
  result: null,
  progress: 0,
  error: null,
}
