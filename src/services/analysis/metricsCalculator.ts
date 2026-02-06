import type { PetriNet } from '@/types/petri-net'
import { OperatorType, isOperator } from '@/types/petri-net'
import type {
  MetricResult,
  MetricsReport,
  MetricRating,
  MetricThreshold,
  MetricCategory,
} from '@/types/metrics'
import { METRIC_DEFINITIONS, getMetricDefinition, CATEGORY_LABELS } from '@/types/metrics'

/**
 * Calculator for process metrics
 */
export class MetricsCalculator {
  /**
   * Calculate all metrics for a Petri net
   */
  calculate(net: PetriNet): MetricsReport {
    const timestamp = Date.now()
    const metrics: MetricResult[] = []

    // Calculate each metric
    for (const definition of METRIC_DEFINITIONS) {
      const result = this.calculateMetric(net, definition.id)
      if (result) {
        metrics.push(result)
      }
    }

    // Calculate summary
    const summary = {
      totalMetrics: metrics.length,
      good: metrics.filter((m) => m.rating === 'good').length,
      warning: metrics.filter((m) => m.rating === 'warning').length,
      bad: metrics.filter((m) => m.rating === 'bad').length,
      neutral: metrics.filter((m) => m.rating === 'neutral').length,
    }

    return {
      timestamp,
      netId: net.id,
      netName: net.name,
      metrics,
      summary,
    }
  }

  /**
   * Calculate a single metric
   */
  calculateMetric(net: PetriNet, metricId: string): MetricResult | null {
    const definition = getMetricDefinition(metricId)
    if (!definition) return null

    let value: number

    switch (metricId) {
      // Size Metrics
      case 'places':
        value = net.places.length
        break
      case 'transitions':
        value = net.transitions.length
        break
      case 'arcs':
        value = net.arcs.length
        break
      case 'operators':
        value = net.operators.length
        break
      case 'subprocesses':
        value = net.subProcesses?.length || 0
        break
      case 'nodes':
        value = this.getTotalNodes(net)
        break

      // Complexity Metrics
      case 'cyclomaticComplexity':
        value = this.calculateCyclomaticComplexity(net)
        break
      case 'controlFlowComplexity':
        value = this.calculateControlFlowComplexity(net)
        break
      case 'structuredness':
        value = this.calculateStructuredness(net)
        break
      case 'maxDepth':
        value = this.calculateMaxDepth(net)
        break

      // Density Metrics
      case 'density':
        value = this.calculateDensity(net)
        break
      case 'coefficientOfConnectivity':
        value = this.calculateCoefficientOfConnectivity(net)
        break
      case 'connectorMismatch':
        value = this.calculateConnectorMismatch(net)
        break
      case 'avgConnectorDegree':
        value = this.calculateAvgConnectorDegree(net)
        break

      // Quality Metrics
      case 'separability':
        value = this.calculateSeparability(net)
        break
      case 'sequentiality':
        value = this.calculateSequentiality(net)
        break
      case 'tokenComplexity':
        value = this.calculateTokenComplexity(net)
        break
      case 'piMetric':
        value = this.calculatePiMetric(net)
        break

      default:
        return null
    }

    const rating = this.getRating(value, definition.threshold)
    const formattedValue = this.formatValue(value, definition)

    return {
      metricId,
      value,
      rating,
      formattedValue,
    }
  }

  /**
   * Get total number of nodes
   */
  private getTotalNodes(net: PetriNet): number {
    return (
      net.places.length +
      net.transitions.length +
      net.operators.length +
      (net.subProcesses?.length || 0)
    )
  }

  /**
   * Calculate cyclomatic complexity: CC = E - N + 2
   * Where E = edges (arcs), N = nodes
   */
  private calculateCyclomaticComplexity(net: PetriNet): number {
    const nodes = this.getTotalNodes(net)
    const edges = net.arcs.length
    if (nodes === 0) return 0
    return Math.max(0, edges - nodes + 2)
  }

  /**
   * Calculate control flow complexity based on operators
   */
  private calculateControlFlowComplexity(net: PetriNet): number {
    let cfc = 0

    for (const op of net.operators) {
      // Get incoming and outgoing arcs for this operator
      const inArcs = net.arcs.filter((a) => a.targetId === op.id)
      const outArcs = net.arcs.filter((a) => a.sourceId === op.id)

      switch (op.operatorType) {
        case OperatorType.AND_SPLIT:
        case OperatorType.AND_JOIN:
          cfc += 1 // AND structures are simple
          break
        case OperatorType.XOR_SPLIT:
          cfc += outArcs.length // XOR splits add complexity per branch
          break
        case OperatorType.XOR_JOIN:
          cfc += 1 // XOR joins are simple
          break
        case OperatorType.AND_SPLIT_JOIN:
        case OperatorType.XOR_SPLIT_JOIN:
          cfc += Math.max(inArcs.length, outArcs.length)
          break
        case OperatorType.AND_JOIN_XOR_SPLIT:
        case OperatorType.XOR_JOIN_AND_SPLIT:
          cfc += outArcs.length + 1
          break
      }
    }

    return cfc
  }

  /**
   * Calculate structuredness (0-1 scale)
   * Based on matching split-join pairs
   */
  private calculateStructuredness(net: PetriNet): number {
    const andSplits = net.operators.filter(
      (o) =>
        o.operatorType === OperatorType.AND_SPLIT ||
        o.operatorType === OperatorType.AND_SPLIT_JOIN ||
        o.operatorType === OperatorType.XOR_JOIN_AND_SPLIT
    ).length

    const andJoins = net.operators.filter(
      (o) =>
        o.operatorType === OperatorType.AND_JOIN ||
        o.operatorType === OperatorType.AND_SPLIT_JOIN ||
        o.operatorType === OperatorType.AND_JOIN_XOR_SPLIT
    ).length

    const xorSplits = net.operators.filter(
      (o) =>
        o.operatorType === OperatorType.XOR_SPLIT ||
        o.operatorType === OperatorType.XOR_SPLIT_JOIN ||
        o.operatorType === OperatorType.AND_JOIN_XOR_SPLIT
    ).length

    const xorJoins = net.operators.filter(
      (o) =>
        o.operatorType === OperatorType.XOR_JOIN ||
        o.operatorType === OperatorType.XOR_SPLIT_JOIN ||
        o.operatorType === OperatorType.XOR_JOIN_AND_SPLIT
    ).length

    const totalSplits = andSplits + xorSplits
    const totalJoins = andJoins + xorJoins

    if (totalSplits === 0 && totalJoins === 0) return 1.0 // No control flow is fully structured

    const matched = Math.min(andSplits, andJoins) + Math.min(xorSplits, xorJoins)
    const total = Math.max(totalSplits, totalJoins)

    return total > 0 ? matched / total : 1.0
  }

  /**
   * Calculate maximum depth of nested control structures
   */
  private calculateMaxDepth(net: PetriNet): number {
    // Simplified depth calculation based on operator count
    // A more accurate version would analyze the graph structure
    const splits = net.operators.filter(
      (o) =>
        o.operatorType.includes('split') ||
        o.operatorType === OperatorType.AND_SPLIT ||
        o.operatorType === OperatorType.XOR_SPLIT
    ).length

    return Math.ceil(Math.sqrt(splits)) // Approximate depth
  }

  /**
   * Calculate arc density
   */
  private calculateDensity(net: PetriNet): number {
    const places = net.places.length
    const transitions = net.transitions.length + net.operators.length + (net.subProcesses?.length || 0)
    const arcs = net.arcs.length

    if (places === 0 || transitions === 0) return 0
    const maxArcs = 2 * places * transitions
    return arcs / maxArcs
  }

  /**
   * Calculate coefficient of connectivity
   */
  private calculateCoefficientOfConnectivity(net: PetriNet): number {
    const nodes = this.getTotalNodes(net)
    const arcs = net.arcs.length

    if (nodes === 0) return 0
    return arcs / nodes
  }

  /**
   * Calculate connector mismatch
   */
  private calculateConnectorMismatch(net: PetriNet): number {
    let andSplits = 0
    let andJoins = 0
    let xorSplits = 0
    let xorJoins = 0

    for (const op of net.operators) {
      switch (op.operatorType) {
        case OperatorType.AND_SPLIT:
          andSplits++
          break
        case OperatorType.AND_JOIN:
          andJoins++
          break
        case OperatorType.XOR_SPLIT:
          xorSplits++
          break
        case OperatorType.XOR_JOIN:
          xorJoins++
          break
        case OperatorType.AND_SPLIT_JOIN:
          andSplits++
          andJoins++
          break
        case OperatorType.XOR_SPLIT_JOIN:
          xorSplits++
          xorJoins++
          break
        case OperatorType.AND_JOIN_XOR_SPLIT:
          andJoins++
          xorSplits++
          break
        case OperatorType.XOR_JOIN_AND_SPLIT:
          xorJoins++
          andSplits++
          break
      }
    }

    return Math.abs(andSplits - andJoins) + Math.abs(xorSplits - xorJoins)
  }

  /**
   * Calculate average connector degree
   */
  private calculateAvgConnectorDegree(net: PetriNet): number {
    if (net.operators.length === 0) return 0

    let totalDegree = 0
    for (const op of net.operators) {
      const inDegree = net.arcs.filter((a) => a.targetId === op.id).length
      const outDegree = net.arcs.filter((a) => a.sourceId === op.id).length
      totalDegree += Math.max(inDegree, outDegree)
    }

    return totalDegree / net.operators.length
  }

  /**
   * Calculate separability (cut vertex ratio)
   */
  private calculateSeparability(net: PetriNet): number {
    const nodes = this.getTotalNodes(net)
    if (nodes <= 2) return 0

    // Count nodes that are on sequential paths (articulation points)
    // Simplified: count nodes with degree 2 (one in, one out)
    let cutVertices = 0

    const allNodeIds = [
      ...net.places.map((p) => p.id),
      ...net.transitions.map((t) => t.id),
      ...net.operators.map((o) => o.id),
      ...(net.subProcesses?.map((s) => s.id) || []),
    ]

    for (const nodeId of allNodeIds) {
      const inDegree = net.arcs.filter((a) => a.targetId === nodeId).length
      const outDegree = net.arcs.filter((a) => a.sourceId === nodeId).length
      if (inDegree === 1 && outDegree === 1) {
        cutVertices++
      }
    }

    return cutVertices / nodes
  }

  /**
   * Calculate sequentiality
   */
  private calculateSequentiality(net: PetriNet): number {
    const totalArcs = net.arcs.length
    if (totalArcs === 0) return 1.0

    // Get operator IDs
    const operatorIds = new Set(net.operators.map((o) => o.id))

    // Count arcs not connected to operators
    const sequentialArcs = net.arcs.filter(
      (a) => !operatorIds.has(a.sourceId) && !operatorIds.has(a.targetId)
    ).length

    return sequentialArcs / totalArcs
  }

  /**
   * Calculate token complexity (total initial tokens)
   */
  private calculateTokenComplexity(net: PetriNet): number {
    return net.places.reduce((sum, p) => sum + p.tokens, 0)
  }

  /**
   * Calculate Pi metric (places / total nodes)
   */
  private calculatePiMetric(net: PetriNet): number {
    const nodes = this.getTotalNodes(net)
    if (nodes === 0) return 0
    return net.places.length / nodes
  }

  /**
   * Get rating based on threshold
   */
  private getRating(value: number, threshold?: MetricThreshold): MetricRating {
    if (!threshold) return 'neutral'

    const lowerIsBetter = threshold.lowerIsBetter !== false

    if (lowerIsBetter) {
      if (value <= threshold.good) return 'good'
      if (value <= threshold.warning) return 'warning'
      return 'bad'
    } else {
      if (value >= threshold.good) return 'good'
      if (value >= threshold.warning) return 'warning'
      return 'bad'
    }
  }

  /**
   * Format value for display
   */
  private formatValue(value: number, definition: { unit?: string }): string {
    if (Number.isInteger(value)) {
      return value.toString()
    }
    // Round to 2 decimal places for ratios
    return value.toFixed(2)
  }
}

// Singleton instance
export const metricsCalculator = new MetricsCalculator()
