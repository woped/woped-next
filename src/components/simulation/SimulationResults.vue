<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useSimulationStore } from '@/stores/simulation'
import { usePetriNetStore } from '@/stores/petriNet'
import { xesExporter } from '@/services/simulation/XESExporter'
import SimulationCharts from './SimulationCharts.vue'
import BottleneckAnalysis from './BottleneckAnalysis.vue'
import SimulationDashboard from './SimulationDashboard.vue'
import SimulationTimeline from './SimulationTimeline.vue'

const emit = defineEmits(['clear'])
const timelineExpanded = ref(false)

const { t } = useI18n()
const simulationStore = useSimulationStore()
const petriNetStore = usePetriNetStore()
const { result, config } = storeToRefs(simulationStore)

// Formatted statistics
const stats = computed(() => {
  if (!result.value) return null
  return result.value.statistics
})

// Format number with precision
const formatNumber = (value, precision = 2) => {
  if (value === undefined || value === null) return '-'
  return value.toFixed(precision)
}

// Format percentage
const formatPercent = (value) => {
  if (value === undefined || value === null) return '-'
  return `${(value * 100).toFixed(1)}%`
}

// Format time with unit
const formatTime = (value) => {
  if (value === undefined || value === null) return '-'
  return `${formatNumber(value)} ${config.value.timeUnit}`
}

// Export results as CSV
const exportCSV = () => {
  if (!result.value) return

  const lines = [
    'Metric,Value',
    `Throughput,${stats.value.throughput}`,
    `Avg Cycle Time,${stats.value.cycleTime.avg}`,
    `Min Cycle Time,${stats.value.cycleTime.min}`,
    `Max Cycle Time,${stats.value.cycleTime.max}`,
    `Std Dev,${stats.value.cycleTime.stdDev}`,
    `Completion Rate,${stats.value.completionRate}`,
    `Cases Started,${stats.value.casesStarted}`,
    `Cases Completed,${stats.value.casesCompleted}`,
    '',
    'Activity,Count,Avg Time,Min Time,Max Time,Utilization',
    ...stats.value.activityStats.map(a => 
      `${a.transitionName},${a.count},${a.avgTime},${a.minTime},${a.maxTime},${a.utilization}`
    ),
  ]

  const csv = lines.join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'simulation-results.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// Export as XES
const exportXES = () => {
  if (!result.value) return
  const netName = petriNetStore.net?.name || 'Petri Net'
  xesExporter.downloadXES(result.value, 'simulation-log.xes', netName)
}
</script>

<template>
  <div class="simulation-results" v-if="stats">
    <!-- Summary Metrics -->
    <div class="metrics-grid">
      <div class="metric-card">
        <span class="metric-value">{{ formatNumber(stats.throughput) }}</span>
        <span class="metric-label">{{ $t('simulation.throughput') }}</span>
        <span class="metric-unit">cases/{{ config.timeUnit }}</span>
      </div>
      <div class="metric-card">
        <span class="metric-value">{{ formatNumber(stats.cycleTime.avg) }}</span>
        <span class="metric-label">{{ $t('simulation.avgCycleTime') }}</span>
        <span class="metric-unit">{{ config.timeUnit }}</span>
      </div>
      <div class="metric-card">
        <span class="metric-value">{{ formatPercent(stats.completionRate) }}</span>
        <span class="metric-label">{{ $t('simulation.completionRate') }}</span>
      </div>
      <div class="metric-card">
        <span class="metric-value">{{ stats.casesCompleted }}</span>
        <span class="metric-label">{{ $t('simulation.casesCompleted') }}</span>
        <span class="metric-unit">/ {{ stats.casesStarted }}</span>
      </div>
    </div>

    <!-- Dashboard with MetricCards + Charts -->
    <SimulationDashboard />

    <!-- Cycle Time Details -->
    <div class="results-section">
      <h4>{{ $t('simulation.cycleTimeDetails') }}</h4>
      <div class="details-grid">
        <div class="detail-row">
          <span class="detail-label">{{ $t('simulation.minimum') }}</span>
          <span class="detail-value">{{ formatTime(stats.cycleTime.min) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ $t('simulation.maximum') }}</span>
          <span class="detail-value">{{ formatTime(stats.cycleTime.max) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ $t('simulation.stdDev') }}</span>
          <span class="detail-value">{{ formatTime(stats.cycleTime.stdDev) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ $t('simulation.median') }}</span>
          <span class="detail-value">{{ formatTime(stats.cycleTime.median) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">P90</span>
          <span class="detail-value">{{ formatTime(stats.cycleTime.p90) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">P95</span>
          <span class="detail-value">{{ formatTime(stats.cycleTime.p95) }}</span>
        </div>
      </div>
    </div>

    <!-- Activity Statistics -->
    <div class="results-section" v-if="stats.activityStats.length > 0">
      <h4>{{ $t('simulation.activityStats') }}</h4>
      <div class="activity-table">
        <div class="table-header">
          <span>{{ $t('simulation.activity') }}</span>
          <span>{{ $t('simulation.count') }}</span>
          <span>{{ $t('simulation.avgTime') }}</span>
          <span>{{ $t('simulation.utilization') }}</span>
        </div>
        <div
          v-for="activity in stats.activityStats"
          :key="activity.transitionId"
          class="table-row"
        >
          <span class="activity-name">{{ activity.transitionName }}</span>
          <span>{{ activity.count }}</span>
          <span>{{ formatNumber(activity.avgTime) }}</span>
          <span class="utilization-cell">
            <span class="utilization-bar">
              <span
                class="utilization-fill"
                :style="{ width: `${Math.min(activity.utilization * 100, 100)}%` }"
              ></span>
            </span>
            <span class="utilization-value">{{ formatPercent(activity.utilization) }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Bottleneck Analysis -->
    <BottleneckAnalysis />

    <!-- Event Timeline -->
    <div class="results-section">
      <h4
        class="collapsible-header"
        @click="timelineExpanded = !timelineExpanded"
      >
        <span class="collapse-arrow" :class="{ expanded: timelineExpanded }">▶</span>
        {{ $t('simulation.timeline') }}
      </h4>
      <SimulationTimeline v-if="timelineExpanded" />
    </div>

    <!-- Execution Info -->
    <div class="results-section execution-info">
      <span>{{ $t('simulation.executionTime') }}: {{ result.executionTimeMs.toFixed(0) }}ms</span>
      <span>{{ $t('simulation.seed') }}: {{ result.seed }}</span>
    </div>

    <!-- Actions -->
    <div class="results-actions">
      <button class="export-btn" @click="exportCSV">
        📊 CSV
      </button>
      <button class="export-btn" @click="exportXES">
        📋 XES
      </button>
      <button class="clear-btn" @click="emit('clear')">
        {{ $t('simulation.clearResults') }}
      </button>
    </div>
  </div>

  <div v-else class="no-results">
    {{ $t('simulation.noResults') }}
  </div>
</template>

<style scoped>
.simulation-results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  text-align: center;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
}

.metric-label {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.metric-unit {
  font-size: 10px;
  color: var(--color-text-muted);
}

.results-section {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
}

.results-section h4 {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 12px;
}

.detail-label {
  color: var(--color-text-muted);
}

.detail-value {
  font-weight: 500;
  color: var(--color-text);
  font-family: monospace;
}

.activity-table {
  font-size: 12px;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 2fr;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
  font-weight: 600;
  color: var(--color-text-muted);
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 2fr;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
  align-items: center;
}

.table-row:last-child {
  border-bottom: none;
}

.activity-name {
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.utilization-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.utilization-bar {
  width: 40px;
  height: 6px;
  background: var(--color-bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
}

.utilization-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 3px;
  max-width: 100%;
}

.utilization-value {
  font-size: 11px;
  min-width: 40px;
}

.execution-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--color-text-muted);
  padding: 12px 16px;
}

.results-actions {
  display: flex;
  gap: 8px;
}

.export-btn,
.clear-btn {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.export-btn:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.clear-btn:hover {
  background: var(--color-bg-hover);
}

.collapsible-header {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  user-select: none;
}

.collapsible-header:hover {
  color: var(--color-primary);
}

.collapse-arrow {
  font-size: 10px;
  transition: transform 0.2s;
  display: inline-block;
}

.collapse-arrow.expanded {
  transform: rotate(90deg);
}

.no-results {
  padding: 40px 20px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 13px;
}
</style>
