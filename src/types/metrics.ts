/**
 * Process Metrics Types
 */

/**
 * Metric category
 */
export type MetricCategory = 'size' | 'complexity' | 'density' | 'quality'

/**
 * Rating for a metric value
 */
export type MetricRating = 'good' | 'warning' | 'bad' | 'neutral'

/**
 * Threshold configuration for metric rating
 */
export interface MetricThreshold {
  good: number
  warning: number
  bad: number
  lowerIsBetter?: boolean // Default true
}

/**
 * Definition of a metric
 */
export interface MetricDefinition {
  id: string
  name: string
  shortName: string
  description: string
  category: MetricCategory
  formula?: string
  threshold?: MetricThreshold
  unit?: string
}

/**
 * Result of calculating a metric
 */
export interface MetricResult {
  metricId: string
  value: number
  rating: MetricRating
  formattedValue: string
  details?: string
}

/**
 * Complete metrics report
 */
export interface MetricsReport {
  timestamp: number
  netId: string
  netName: string
  metrics: MetricResult[]
  summary: {
    totalMetrics: number
    good: number
    warning: number
    bad: number
    neutral: number
  }
}

/**
 * Standard metrics definitions
 */
export const METRIC_DEFINITIONS: MetricDefinition[] = [
  // Size Metrics
  {
    id: 'places',
    name: 'Number of Places',
    shortName: 'Places',
    category: 'size',
    description: 'Total count of places (states) in the net',
    unit: '',
  },
  {
    id: 'transitions',
    name: 'Number of Transitions',
    shortName: 'Transitions',
    category: 'size',
    description: 'Total count of transitions (activities) in the net',
    unit: '',
  },
  {
    id: 'arcs',
    name: 'Number of Arcs',
    shortName: 'Arcs',
    category: 'size',
    description: 'Total count of arcs (flow relations) in the net',
    unit: '',
  },
  {
    id: 'operators',
    name: 'Number of Operators',
    shortName: 'Operators',
    category: 'size',
    description: 'Total count of workflow operators (splits/joins) in the net',
    unit: '',
  },
  {
    id: 'subprocesses',
    name: 'Number of Subprocesses',
    shortName: 'Subprocs',
    category: 'size',
    description: 'Total count of subprocesses (hierarchical elements) in the net',
    unit: '',
  },
  {
    id: 'nodes',
    name: 'Total Nodes',
    shortName: 'Nodes',
    category: 'size',
    description: 'Total count of all nodes (places + transitions + operators + subprocesses)',
    unit: '',
  },

  // Complexity Metrics
  {
    id: 'cyclomaticComplexity',
    name: 'Cyclomatic Complexity',
    shortName: 'CC',
    category: 'complexity',
    description: 'CC = Arcs - Nodes + 2. Measures the number of linearly independent paths.',
    formula: 'arcs - nodes + 2',
    threshold: { good: 10, warning: 20, bad: 30 },
    unit: '',
  },
  {
    id: 'controlFlowComplexity',
    name: 'Control Flow Complexity',
    shortName: 'CFC',
    category: 'complexity',
    description: 'Sum of split/join complexities based on operator types.',
    threshold: { good: 10, warning: 20, bad: 40 },
    unit: '',
  },
  {
    id: 'structuredness',
    name: 'Structuredness',
    shortName: 'Struct',
    category: 'complexity',
    description: 'Degree to which the model follows structured patterns (well-nested constructs).',
    threshold: { good: 0.8, warning: 0.5, bad: 0.3, lowerIsBetter: false },
    unit: '',
  },
  {
    id: 'maxDepth',
    name: 'Maximum Depth',
    shortName: 'Depth',
    category: 'complexity',
    description: 'Maximum nesting depth of control structures.',
    threshold: { good: 3, warning: 5, bad: 7 },
    unit: '',
  },

  // Density Metrics
  {
    id: 'density',
    name: 'Arc Density',
    shortName: 'Density',
    category: 'density',
    description: 'Ratio of arcs to maximum possible arcs: arcs / (2 * places * transitions)',
    formula: 'arcs / (2 * places * transitions)',
    threshold: { good: 0.3, warning: 0.5, bad: 0.7 },
    unit: '',
  },
  {
    id: 'coefficientOfConnectivity',
    name: 'Coefficient of Connectivity',
    shortName: 'CoC',
    category: 'density',
    description: 'Ratio of arcs to nodes. Higher values indicate more connections.',
    formula: 'arcs / nodes',
    threshold: { good: 2, warning: 3, bad: 4 },
    unit: '',
  },
  {
    id: 'connectorMismatch',
    name: 'Connector Mismatch',
    shortName: 'CM',
    category: 'density',
    description: 'Sum of absolute differences between split and join counts.',
    formula: '|AND-splits - AND-joins| + |XOR-splits - XOR-joins|',
    threshold: { good: 0, warning: 2, bad: 5 },
    unit: '',
  },
  {
    id: 'avgConnectorDegree',
    name: 'Average Connector Degree',
    shortName: 'ACD',
    category: 'density',
    description: 'Average number of inputs/outputs for split/join operators.',
    threshold: { good: 2, warning: 4, bad: 6 },
    unit: '',
  },

  // Quality Metrics
  {
    id: 'separability',
    name: 'Separability',
    shortName: 'Sep',
    category: 'quality',
    description: 'Ratio of cut vertices (articulation points) to total nodes.',
    threshold: { good: 0.2, warning: 0.4, bad: 0.6 },
    unit: '',
  },
  {
    id: 'sequentiality',
    name: 'Sequentiality',
    shortName: 'Seq',
    category: 'quality',
    description: 'Ratio of arcs between non-connector nodes to total arcs.',
    threshold: { good: 0.7, warning: 0.4, bad: 0.2, lowerIsBetter: false },
    unit: '',
  },
  {
    id: 'tokenComplexity',
    name: 'Token Complexity',
    shortName: 'TC',
    category: 'quality',
    description: 'Total number of tokens in the initial marking.',
    threshold: { good: 1, warning: 3, bad: 5 },
    unit: '',
  },
  {
    id: 'piMetric',
    name: 'Pi Metric',
    shortName: 'π',
    category: 'quality',
    description: 'Ratio of places to total nodes. Balanced nets have values around 0.5.',
    threshold: { good: 0.5, warning: 0.7, bad: 0.8 },
    unit: '',
  },
]

/**
 * Get metric definition by ID
 */
export function getMetricDefinition(id: string): MetricDefinition | undefined {
  return METRIC_DEFINITIONS.find((m) => m.id === id)
}

/**
 * Get metrics by category
 */
export function getMetricsByCategory(category: MetricCategory): MetricDefinition[] {
  return METRIC_DEFINITIONS.filter((m) => m.category === category)
}

/**
 * Category display labels
 */
export const CATEGORY_LABELS: Record<MetricCategory, string> = {
  size: 'Size Metrics',
  complexity: 'Complexity Metrics',
  density: 'Density Metrics',
  quality: 'Quality Metrics',
}

/**
 * Empty metrics report
 */
export const EMPTY_METRICS_REPORT: MetricsReport = {
  timestamp: 0,
  netId: '',
  netName: '',
  metrics: [],
  summary: {
    totalMetrics: 0,
    good: 0,
    warning: 0,
    bad: 0,
    neutral: 0,
  },
}
