import { nanoid } from 'nanoid'
import type { PetriNet, Arc } from '@/types/petri-net'
import type {
  SimulationConfig,
  TimeModel,
  ResourceModel,
  ResourceStats,
  BottleneckInfo,
  SimEvent,
  SimCase,
  SimulationResult,
  SimStatistics,
  ActivityStats,
  CycleTimeStats,
} from '@/types/simulation'
import { DEFAULT_RESOURCE_MODEL } from '@/types/simulation'
import { PriorityQueue } from '@/utils/priorityQueue'
import { SeededRandom, mean, standardDeviation, median, percentile, min, max } from '@/utils/random'

/**
 * Discrete Event Simulation Engine for Petri Nets
 */
export class SimulationEngine {
  private eventQueue: PriorityQueue<SimEvent>
  private currentTime: number = 0
  private cases: Map<string, SimCase> = new Map()
  private rng: SeededRandom
  private caseCounter: number = 0

  // Activity tracking
  private activityTimes: Map<string, number[]> = new Map()
  private activityWaitTimes: Map<string, number[]> = new Map()
  private activityBusyTime: Map<string, number> = new Map()

  // Resource tracking
  private resourceAvailable: Map<string, number> = new Map()
  private resourceBusyTime: Map<string, number> = new Map()
  private resourceContentionCount: Map<string, number> = new Map()
  private resourceQueueLengths: Map<string, number[]> = new Map()

  // Progress callback
  private onProgress?: (progress: number) => void

  constructor(
    private net: PetriNet,
    private config: SimulationConfig,
    private timeModel: TimeModel,
    private resourceModel: ResourceModel = DEFAULT_RESOURCE_MODEL
  ) {
    this.eventQueue = new PriorityQueue<SimEvent>((a, b) => a.time - b.time)
    this.rng = new SeededRandom(config.seed)
  }

  /**
   * Set progress callback
   */
  setProgressCallback(callback: (progress: number) => void): void {
    this.onProgress = callback
  }

  /**
   * Run the simulation
   */
  run(): SimulationResult {
    const startTime = performance.now()

    this.initialize()

    let lastProgressUpdate = 0
    const progressInterval = this.config.simulationTime / 100

    // Main simulation loop
    while (!this.eventQueue.isEmpty) {
      const event = this.eventQueue.pop()!

      if (event.time > this.config.simulationTime) break

      this.currentTime = event.time
      this.processEvent(event)

      // Update progress
      if (this.onProgress && this.currentTime - lastProgressUpdate >= progressInterval) {
        this.onProgress(this.currentTime / this.config.simulationTime)
        lastProgressUpdate = this.currentTime
      }
    }

    const executionTimeMs = performance.now() - startTime

    return this.collectResults(executionTimeMs)
  }

  /**
   * Initialize simulation state
   */
  private initialize(): void {
    this.currentTime = 0
    this.cases.clear()
    this.caseCounter = 0
    this.eventQueue.clear()
    this.activityTimes.clear()
    this.activityWaitTimes.clear()
    this.activityBusyTime.clear()

    // Initialize activity tracking for all transitions
    for (const transition of this.net.transitions) {
      this.activityTimes.set(transition.id, [])
      this.activityWaitTimes.set(transition.id, [])
      this.activityBusyTime.set(transition.id, 0)
    }
    for (const operator of this.net.operators) {
      this.activityTimes.set(operator.id, [])
      this.activityWaitTimes.set(operator.id, [])
      this.activityBusyTime.set(operator.id, 0)
    }

    // Initialize resource tracking
    this.resourceAvailable.clear()
    this.resourceBusyTime.clear()
    this.resourceContentionCount.clear()
    this.resourceQueueLengths.clear()
    for (const resource of this.resourceModel.resources) {
      this.resourceAvailable.set(resource.id, resource.capacity)
      this.resourceBusyTime.set(resource.id, 0)
      this.resourceContentionCount.set(resource.id, 0)
      this.resourceQueueLengths.set(resource.id, [])
    }

    // Schedule first arrival
    this.scheduleArrival(0)
  }

  /**
   * Schedule an arrival event
   */
  private scheduleArrival(time: number): void {
    this.eventQueue.push({
      time,
      type: 'arrival',
      transitionId: '',
      caseId: '',
    })
  }

  /**
   * Process a single event
   */
  private processEvent(event: SimEvent): void {
    switch (event.type) {
      case 'arrival':
        this.handleArrival(event)
        break
      case 'start':
        this.handleStart(event)
        break
      case 'complete':
        this.handleComplete(event)
        break
      case 'depart':
        this.handleDeparture(event)
        break
    }
  }

  /**
   * Handle arrival of a new case
   */
  private handleArrival(event: SimEvent): void {
    // Create new case
    const caseId = `case-${++this.caseCounter}`
    const newCase: SimCase = {
      id: caseId,
      startTime: this.currentTime,
      endTime: 0,
      events: [{ ...event, caseId }],
      completed: false,
      currentMarking: {},
    }

    // Initialize marking with tokens on start places
    const startPlaces = this.getStartPlaces()
    for (const placeId of startPlaces) {
      newCase.currentMarking[placeId] = 1
    }

    this.cases.set(caseId, newCase)

    // Try to start first enabled transition
    this.tryStartNextTransition(caseId)

    // Schedule next arrival (exponential inter-arrival time)
    if (this.currentTime < this.config.simulationTime) {
      const interArrivalTime = this.rng.sample({
        type: 'exponential',
        params: [1 / this.config.arrivalRate],
      })
      this.scheduleArrival(this.currentTime + interArrivalTime)
    }
  }

  /**
   * Handle start of an activity
   */
  private handleStart(event: SimEvent): void {
    const simCase = this.cases.get(event.caseId)
    if (!simCase) return

    simCase.events.push(event)

    // Get processing time for this transition
    const processingTime = this.getProcessingTime(event.transitionId)

    // Track wait time (time from when tokens were available to start)
    const waitTimes = this.activityWaitTimes.get(event.transitionId)
    if (waitTimes) {
      // Simplified: we don't track exact arrival time at input places
      waitTimes.push(0)
    }

    // Schedule completion
    this.eventQueue.push({
      time: this.currentTime + processingTime,
      type: 'complete',
      transitionId: event.transitionId,
      caseId: event.caseId,
    })
  }

  /**
   * Handle completion of an activity
   */
  private handleComplete(event: SimEvent): void {
    const simCase = this.cases.get(event.caseId)
    if (!simCase) return

    simCase.events.push(event)

    // Record activity time
    const startEvent = simCase.events.find(
      (e) => e.type === 'start' && e.transitionId === event.transitionId
    )
    if (startEvent) {
      const duration = this.currentTime - startEvent.time
      const times = this.activityTimes.get(event.transitionId)
      if (times) times.push(duration)

      const busyTime = this.activityBusyTime.get(event.transitionId) ?? 0
      this.activityBusyTime.set(event.transitionId, busyTime + duration)
    }

    // Update marking: consume from input places, produce to output places
    this.fireTransition(simCase, event.transitionId)

    // Check if case is complete (tokens on end places)
    if (this.isCaseComplete(simCase)) {
      simCase.completed = true
      simCase.endTime = this.currentTime
      simCase.events.push({
        time: this.currentTime,
        type: 'depart',
        transitionId: '',
        caseId: event.caseId,
      })
    } else {
      // Try to start next transition
      this.tryStartNextTransition(event.caseId)
    }
  }

  /**
   * Handle departure of a completed case
   */
  private handleDeparture(event: SimEvent): void {
    const simCase = this.cases.get(event.caseId)
    if (simCase) {
      simCase.events.push(event)
    }
  }

  /**
   * Try to start the next enabled transition for a case
   */
  private tryStartNextTransition(caseId: string): void {
    const simCase = this.cases.get(caseId)
    if (!simCase) return

    const enabledTransitions = this.getEnabledTransitions(simCase)

    if (enabledTransitions.length > 0) {
      // For simplicity, choose randomly among enabled transitions
      const index = this.rng.randomInt(0, enabledTransitions.length - 1)
      const transitionId = enabledTransitions[index]

      this.eventQueue.push({
        time: this.currentTime,
        type: 'start',
        transitionId,
        caseId,
      })
    }
  }

  /**
   * Get enabled transitions for a case based on its marking
   */
  private getEnabledTransitions(simCase: SimCase): string[] {
    const enabled: string[] = []

    const allTransitions = [...this.net.transitions, ...this.net.operators]

    for (const transition of allTransitions) {
      if (this.isTransitionEnabled(simCase, transition.id)) {
        enabled.push(transition.id)
      }
    }

    return enabled
  }

  /**
   * Check if a transition is enabled for a case
   */
  private isTransitionEnabled(simCase: SimCase, transitionId: string): boolean {
    const inputArcs = this.net.arcs.filter((arc) => arc.targetId === transitionId)

    for (const arc of inputArcs) {
      const tokens = simCase.currentMarking[arc.sourceId] ?? 0
      if (tokens < arc.weight) return false
    }

    return inputArcs.length > 0
  }

  /**
   * Fire a transition: update marking
   */
  private fireTransition(simCase: SimCase, transitionId: string): void {
    // Consume from input places
    const inputArcs = this.net.arcs.filter((arc) => arc.targetId === transitionId)
    for (const arc of inputArcs) {
      const current = simCase.currentMarking[arc.sourceId] ?? 0
      simCase.currentMarking[arc.sourceId] = current - arc.weight
      if (simCase.currentMarking[arc.sourceId] <= 0) {
        delete simCase.currentMarking[arc.sourceId]
      }
    }

    // Produce to output places
    const outputArcs = this.net.arcs.filter((arc) => arc.sourceId === transitionId)
    for (const arc of outputArcs) {
      const current = simCase.currentMarking[arc.targetId] ?? 0
      simCase.currentMarking[arc.targetId] = current + arc.weight
    }
  }

  /**
   * Get start places (places with no input arcs)
   */
  private getStartPlaces(): string[] {
    const placesWithInput = new Set(
      this.net.arcs.filter((arc) => this.net.places.some((p) => p.id === arc.targetId)).map((arc) => arc.targetId)
    )
    return this.net.places.filter((p) => !placesWithInput.has(p.id)).map((p) => p.id)
  }

  /**
   * Get end places (places with no output arcs)
   */
  private getEndPlaces(): string[] {
    const placesWithOutput = new Set(
      this.net.arcs.filter((arc) => this.net.places.some((p) => p.id === arc.sourceId)).map((arc) => arc.sourceId)
    )
    return this.net.places.filter((p) => !placesWithOutput.has(p.id)).map((p) => p.id)
  }

  /**
   * Check if a case is complete
   */
  private isCaseComplete(simCase: SimCase): boolean {
    const endPlaces = this.getEndPlaces()
    return endPlaces.some((placeId) => (simCase.currentMarking[placeId] ?? 0) > 0)
  }

  /**
   * Get processing time for a transition
   */
  private getProcessingTime(transitionId: string): number {
    const distribution =
      this.timeModel.transitionTimes[transitionId] ?? this.timeModel.defaultTime
    return Math.max(0, this.rng.sample(distribution))
  }

  /**
   * Collect and compute simulation results
   */
  private collectResults(executionTimeMs: number): SimulationResult {
    const allCases = Array.from(this.cases.values())

    // Filter out warmup period
    const validCases = allCases.filter((c) => c.startTime >= this.config.warmupTime)
    const completedCases = validCases.filter((c) => c.completed)

    // Compute statistics
    const statistics = this.computeStatistics(validCases, completedCases)

    return {
      cases: allCases,
      statistics,
      config: this.config,
      timeModel: this.timeModel,
      executionTimeMs,
      seed: this.rng.getSeed(),
    }
  }

  /**
   * Compute simulation statistics
   */
  private computeStatistics(validCases: SimCase[], completedCases: SimCase[]): SimStatistics {
    const cycleTimes = completedCases.map((c) => c.endTime - c.startTime)
    const effectiveTime = this.config.simulationTime - this.config.warmupTime

    // Cycle time statistics
    const cycleTime: CycleTimeStats = {
      avg: mean(cycleTimes),
      min: min(cycleTimes),
      max: max(cycleTimes),
      stdDev: standardDeviation(cycleTimes),
      median: median(cycleTimes),
      p90: percentile(cycleTimes, 90),
      p95: percentile(cycleTimes, 95),
    }

    // Activity statistics
    const activityStats: ActivityStats[] = []
    const allTransitions = [...this.net.transitions, ...this.net.operators]

    for (const transition of allTransitions) {
      const times = this.activityTimes.get(transition.id) ?? []
      const waitTimes = this.activityWaitTimes.get(transition.id) ?? []
      const busyTime = this.activityBusyTime.get(transition.id) ?? 0

      if (times.length > 0) {
        // Utilization: fraction of time the activity was busy
        // Cap at 1.0 since multiple parallel executions can exceed 100%
        const rawUtilization = busyTime / effectiveTime
        const utilization = Math.min(rawUtilization, 1.0)

        activityStats.push({
          transitionId: transition.id,
          transitionName: transition.name || transition.id,
          count: times.length,
          totalTime: times.reduce((a, b) => a + b, 0),
          avgTime: mean(times),
          minTime: min(times),
          maxTime: max(times),
          avgWaitTime: mean(waitTimes),
          utilization,
        })
      }
    }

    // Sort by count descending
    activityStats.sort((a, b) => b.count - a.count)

    // Resource statistics
    const resourceStats: ResourceStats[] = this.computeResourceStats(effectiveTime)

    // Bottleneck analysis
    const bottlenecks: BottleneckInfo[] = this.computeBottlenecks(activityStats, completedCases.length)

    return {
      throughput: completedCases.length / effectiveTime,
      cycleTime,
      completionRate: validCases.length > 0 ? completedCases.length / validCases.length : 0,
      casesStarted: validCases.length,
      casesCompleted: completedCases.length,
      casesInProgress: validCases.length - completedCases.length,
      activityStats,
      avgTokensInSystem: mean(validCases.map((c) => Object.values(c.currentMarking).reduce((a, b) => a + b, 0))),
      resourceStats: resourceStats.length > 0 ? resourceStats : undefined,
      bottlenecks: bottlenecks.length > 0 ? bottlenecks : undefined,
    }
  }

  /**
   * Compute resource statistics
   */
  private computeResourceStats(effectiveTime: number): ResourceStats[] {
    const stats: ResourceStats[] = []

    for (const resource of this.resourceModel.resources) {
      const busyTime = this.resourceBusyTime.get(resource.id) ?? 0
      const contentionCount = this.resourceContentionCount.get(resource.id) ?? 0
      const queueLengths = this.resourceQueueLengths.get(resource.id) ?? []

      stats.push({
        resourceId: resource.id,
        resourceName: resource.name,
        utilization: Math.min(busyTime / (effectiveTime * resource.capacity), 1.0),
        totalBusyTime: busyTime,
        totalIdleTime: Math.max(0, effectiveTime * resource.capacity - busyTime),
        contentionCount,
        avgQueueLength: queueLengths.length > 0 ? mean(queueLengths) : 0,
      })
    }

    return stats
  }

  /**
   * Compute bottleneck analysis
   */
  private computeBottlenecks(activityStats: ActivityStats[], totalCases: number): BottleneckInfo[] {
    const bottlenecks: BottleneckInfo[] = []

    // Identify activities with high utilization as potential bottlenecks
    const utilizationThreshold = 0.7 // 70% utilization is a warning
    const criticalThreshold = 0.9 // 90% is critical

    for (const activity of activityStats) {
      if (activity.utilization >= utilizationThreshold) {
        bottlenecks.push({
          transitionId: activity.transitionId,
          transitionName: activity.transitionName,
          utilization: activity.utilization,
          avgWaitTime: activity.avgWaitTime,
          casesAffected: activity.count,
          isCritical: activity.utilization >= criticalThreshold,
          suggestedCapacityIncrease: activity.utilization >= criticalThreshold 
            ? Math.ceil(activity.utilization / 0.7) 
            : undefined,
        })
      }
    }

    // Sort by utilization descending
    bottlenecks.sort((a, b) => b.utilization - a.utilization)

    return bottlenecks
  }
}
