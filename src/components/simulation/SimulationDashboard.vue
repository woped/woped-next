<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useSimulationStore } from '@/stores/simulation'
import SimulationCharts from './SimulationCharts.vue'
import BottleneckAnalysis from './BottleneckAnalysis.vue'
import ThroughputLineChart from './ThroughputLineChart.vue'
import SimulationTimeline from './SimulationTimeline.vue'
import ResourcePieChart from './ResourcePieChart.vue'

const { t } = useI18n()
const simulationStore = useSimulationStore()
const { result } = storeToRefs(simulationStore)

const stats = computed(() => result.value?.statistics)

const metricCards = computed(() => {
  if (!stats.value) return []
  return [
    {
      label: t('simulation.throughput'),
      value: stats.value.throughput?.toFixed(2) ?? '-',
      unit: '/h',
      color: '#3b82f6',
    },
    {
      label: t('simulation.avgCycleTime'),
      value: stats.value.cycleTime?.avg?.toFixed(1) ?? '-',
      unit: 'min',
      color: '#8b5cf6',
    },
    {
      label: t('simulation.completionRate'),
      value: ((stats.value.completionRate ?? 0) * 100).toFixed(0),
      unit: '%',
      color: stats.value.completionRate >= 0.8 ? '#22c55e' : '#f59e0b',
    },
    {
      label: t('simulation.totalCases'),
      value: result.value?.cases?.length ?? 0,
      unit: '',
      color: '#6366f1',
    },
  ]
})
</script>

<template>
  <div v-if="result" class="simulation-dashboard">
    <div class="sd-cards">
      <div
        v-for="card in metricCards"
        :key="card.label"
        class="sd-card"
      >
        <div class="sd-card-value" :style="{ color: card.color }">
          {{ card.value }}<span class="sd-card-unit">{{ card.unit }}</span>
        </div>
        <div class="sd-card-label">{{ card.label }}</div>
      </div>
    </div>

    <SimulationCharts />
    <ThroughputLineChart />
    <ResourcePieChart />
    <SimulationTimeline />
    <BottleneckAnalysis />
  </div>
</template>

<style scoped>
.simulation-dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sd-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.sd-card {
  padding: 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  text-align: center;
}

.sd-card-value {
  font-size: 20px;
  font-weight: 700;
  font-family: monospace;
}

.sd-card-unit {
  font-size: 12px;
  font-weight: 400;
  opacity: 0.7;
  margin-left: 2px;
}

.sd-card-label {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 4px;
}
</style>
