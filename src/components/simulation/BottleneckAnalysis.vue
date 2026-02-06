<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useSimulationStore } from '@/stores/simulation'

const { t } = useI18n()
const simulationStore = useSimulationStore()
const { result, config } = storeToRefs(simulationStore)

// Get bottleneck info
const bottlenecks = computed(() => result.value?.statistics?.bottlenecks || [])
const hasBottlenecks = computed(() => bottlenecks.value.length > 0)

// Format percentage
const formatPercent = (value) => `${(value * 100).toFixed(1)}%`

// Format time
const formatTime = (value) => {
  if (value === undefined || value === null) return '-'
  return `${value.toFixed(2)} ${config.value.timeUnit}`
}
</script>

<template>
  <div v-if="hasBottlenecks" class="bottleneck-analysis">
    <h4>{{ $t('simulation.bottlenecks') }}</h4>
    
    <div class="bottleneck-list">
      <div
        v-for="bottleneck in bottlenecks"
        :key="bottleneck.transitionId"
        :class="['bottleneck-item', { critical: bottleneck.isCritical }]"
      >
        <div class="bottleneck-header">
          <span class="bottleneck-name">{{ bottleneck.transitionName }}</span>
          <span
            v-if="bottleneck.isCritical"
            class="critical-badge"
          >
            {{ $t('simulation.criticalBottleneck') }}
          </span>
        </div>
        
        <div class="bottleneck-metrics">
          <div class="metric">
            <span class="metric-label">{{ $t('simulation.utilization') }}</span>
            <span class="metric-value">{{ formatPercent(bottleneck.utilization) }}</span>
            <div class="utilization-bar">
              <div
                class="utilization-fill"
                :class="{ critical: bottleneck.isCritical }"
                :style="{ width: `${Math.min(bottleneck.utilization * 100, 100)}%` }"
              ></div>
            </div>
          </div>
          
          <div class="metric">
            <span class="metric-label">{{ $t('simulation.avgWaitTime') }}</span>
            <span class="metric-value">{{ formatTime(bottleneck.avgWaitTime) }}</span>
          </div>
          
          <div class="metric">
            <span class="metric-label">{{ $t('simulation.casesAffected') }}</span>
            <span class="metric-value">{{ bottleneck.casesAffected }}</span>
          </div>
        </div>
        
        <div
          v-if="bottleneck.suggestedCapacityIncrease"
          class="suggestion"
        >
          💡 {{ $t('simulation.suggestedIncrease') }}: ×{{ bottleneck.suggestedCapacityIncrease }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bottleneck-analysis {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.bottleneck-analysis h4 {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
}

.bottleneck-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bottleneck-item {
  padding: 12px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.bottleneck-item.critical {
  border-color: #fecaca;
  background: #fef2f2;
}

:global(.dark) .bottleneck-item.critical {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.1);
}

.bottleneck-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.bottleneck-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--color-text);
}

.critical-badge {
  padding: 2px 8px;
  background: #ef4444;
  color: white;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.bottleneck-metrics {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 8px;
}

.metric {
  font-size: 11px;
}

.metric-label {
  display: block;
  color: var(--color-text-muted);
  margin-bottom: 2px;
}

.metric-value {
  display: block;
  font-weight: 600;
  color: var(--color-text);
}

.utilization-bar {
  height: 4px;
  background: var(--color-bg-tertiary);
  border-radius: 2px;
  margin-top: 4px;
  overflow: hidden;
}

.utilization-fill {
  height: 100%;
  background: #f97316;
  border-radius: 2px;
}

.utilization-fill.critical {
  background: #ef4444;
}

.suggestion {
  margin-top: 8px;
  padding: 8px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 4px;
  font-size: 11px;
  color: #92400e;
}

:global(.dark) .suggestion {
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.3);
  color: #fcd34d;
}
</style>
