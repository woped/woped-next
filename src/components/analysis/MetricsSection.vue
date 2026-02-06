<script setup>
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { usePetriNetStore } from '@/stores/petriNet'
import { metricsCalculator } from '@/services/analysis/metricsCalculator'
import { CATEGORY_LABELS, getMetricDefinition, getMetricsByCategory } from '@/types/metrics'

const { t } = useI18n()
const petriNetStore = usePetriNetStore()
const { net } = storeToRefs(petriNetStore)

// Metrics report
const metricsReport = ref(null)
const isCalculating = ref(false)

// Expanded categories
const expandedCategories = ref({
  size: true,
  complexity: true,
  density: false,
  quality: false,
})

// Calculate metrics
const calculateMetrics = () => {
  isCalculating.value = true
  setTimeout(() => {
    metricsReport.value = metricsCalculator.calculate(net.value)
    isCalculating.value = false
  }, 10)
}

// Auto-calculate on net change
watch(() => [net.value.places.length, net.value.transitions.length, net.value.arcs.length, net.value.operators.length], () => {
  if (metricsReport.value) {
    calculateMetrics()
  }
}, { deep: false })

// Get metrics grouped by category
const metricsByCategory = computed(() => {
  if (!metricsReport.value) return {}
  
  const grouped = {}
  for (const category of ['size', 'complexity', 'density', 'quality']) {
    grouped[category] = metricsReport.value.metrics.filter(m => {
      const def = getMetricDefinition(m.metricId)
      return def?.category === category
    })
  }
  return grouped
})

// Toggle category
const toggleCategory = (category) => {
  expandedCategories.value[category] = !expandedCategories.value[category]
}

// Get rating class
const getRatingClass = (rating) => {
  return `rating-${rating}`
}

// Get definition for a metric result
const getDefinitionForMetric = (metricResult) => {
  return getMetricDefinition(metricResult.metricId)
}

// Format category label
const formatCategoryLabel = (category) => {
  return CATEGORY_LABELS[category] || category
}

// Get summary badge class
const getSummaryClass = (report) => {
  if (!report) return ''
  if (report.summary.bad > 0) return 'summary-bad'
  if (report.summary.warning > 0) return 'summary-warning'
  return 'summary-good'
}
</script>

<template>
  <div class="metrics-section">
    <!-- Header -->
    <div class="metrics-header">
      <div class="header-left">
        <span class="title">{{ $t('metrics.title') }}</span>
        <span v-if="metricsReport" :class="['summary-badge', getSummaryClass(metricsReport)]">
          <span v-if="metricsReport.summary.bad > 0" class="count bad">{{ metricsReport.summary.bad }}</span>
          <span v-if="metricsReport.summary.warning > 0" class="count warning">{{ metricsReport.summary.warning }}</span>
          <span class="count good">{{ metricsReport.summary.good }}</span>
        </span>
      </div>
      <button
        class="btn-calculate"
        :disabled="isCalculating"
        @click="calculateMetrics"
      >
        {{ isCalculating ? '...' : '▶' }}
      </button>
    </div>

    <!-- No Results -->
    <div v-if="!metricsReport" class="no-results">
      <p>{{ $t('metrics.clickToCalculate') }}</p>
    </div>

    <!-- Metrics by Category -->
    <div v-else class="metrics-categories">
      <div
        v-for="category in ['size', 'complexity', 'density', 'quality']"
        :key="category"
        class="category"
      >
        <div class="category-header" @click="toggleCategory(category)">
          <span class="toggle">{{ expandedCategories[category] ? '▼' : '▶' }}</span>
          <span class="category-name">{{ formatCategoryLabel(category) }}</span>
          <span class="category-count">({{ metricsByCategory[category]?.length || 0 }})</span>
        </div>

        <div v-if="expandedCategories[category]" class="category-metrics">
          <div
            v-for="metric in metricsByCategory[category]"
            :key="metric.metricId"
            class="metric-item"
          >
            <div class="metric-info">
              <span class="metric-name">{{ getDefinitionForMetric(metric)?.shortName }}</span>
              <span class="metric-tooltip" :title="getDefinitionForMetric(metric)?.description">ⓘ</span>
            </div>
            <div class="metric-value">
              <span :class="['value', getRatingClass(metric.rating)]">
                {{ metric.formattedValue }}
              </span>
              <span :class="['indicator', getRatingClass(metric.rating)]">
                {{ metric.rating === 'good' ? '✓' : metric.rating === 'warning' ? '!' : metric.rating === 'bad' ? '✗' : '–' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.metrics-section {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
}

.metrics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title {
  font-weight: 500;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.summary-badge {
  display: flex;
  gap: 4px;
}

.count {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
}

.count.good {
  background: #dcfce7;
  color: #166534;
}

.count.warning {
  background: #fef3c7;
  color: #92400e;
}

.count.bad {
  background: #fee2e2;
  color: #991b1b;
}

:global(.dark) .count.good {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

:global(.dark) .count.warning {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

:global(.dark) .count.bad {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.btn-calculate {
  padding: 3px 8px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 11px;
  color: var(--color-text);
  cursor: pointer;
}

.btn-calculate:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
}

.btn-calculate:disabled {
  opacity: 0.5;
}

.no-results {
  padding: 20px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 12px;
}

.no-results p {
  margin: 0;
}

.metrics-categories {
  padding: 4px;
}

.category {
  margin-bottom: 2px;
}

.category:last-child {
  margin-bottom: 0;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
}

.category-header:hover {
  background: var(--color-bg-tertiary);
}

.toggle {
  font-size: 9px;
  color: var(--color-text-muted);
  width: 10px;
}

.category-name {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.category-count {
  font-size: 11px;
  color: var(--color-text-muted);
}

.category-metrics {
  padding: 4px 8px 8px 24px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid var(--color-border);
}

.metric-item:last-child {
  border-bottom: none;
}

.metric-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.metric-name {
  font-size: 12px;
  color: var(--color-text);
}

.metric-tooltip {
  font-size: 10px;
  color: var(--color-text-muted);
  cursor: help;
}

.metric-value {
  display: flex;
  align-items: center;
  gap: 6px;
}

.value {
  font-size: 12px;
  font-weight: 600;
  font-family: monospace;
}

.value.rating-good {
  color: #166534;
}

.value.rating-warning {
  color: #92400e;
}

.value.rating-bad {
  color: #991b1b;
}

.value.rating-neutral {
  color: var(--color-text);
}

:global(.dark) .value.rating-good {
  color: #4ade80;
}

:global(.dark) .value.rating-warning {
  color: #fbbf24;
}

:global(.dark) .value.rating-bad {
  color: #f87171;
}

.indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
}

.indicator.rating-good {
  background: #dcfce7;
  color: #166534;
}

.indicator.rating-warning {
  background: #fef3c7;
  color: #92400e;
}

.indicator.rating-bad {
  background: #fee2e2;
  color: #991b1b;
}

.indicator.rating-neutral {
  background: var(--color-bg-tertiary);
  color: var(--color-text-muted);
}

:global(.dark) .indicator.rating-good {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

:global(.dark) .indicator.rating-warning {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

:global(.dark) .indicator.rating-bad {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}
</style>
