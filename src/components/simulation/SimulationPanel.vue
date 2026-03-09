<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useSimulationStore } from '@/stores/simulation'
import { usePetriNetStore } from '@/stores/petriNet'
import SimulationConfig from './SimulationConfig.vue'
import SimulationResults from './SimulationResults.vue'
import TimeModelConfig from './TimeModelConfig.vue'
import ResourceConfig from './ResourceConfig.vue'
import HelpTooltip from '@/components/help/HelpTooltip.vue'

const { t } = useI18n()
const simulationStore = useSimulationStore()
const petriNetStore = usePetriNetStore()

const { status, progress, error, hasResults, isRunning } = storeToRefs(simulationStore)

// Active tab
const activeTab = ref('config')

// Run simulation
const handleRun = async () => {
  await simulationStore.runSimulation()
  if (simulationStore.hasResults) {
    activeTab.value = 'results'
  }
}

// Clear results
const handleClear = () => {
  simulationStore.clearResults()
  activeTab.value = 'config'
}

// Progress percentage
const progressPercent = computed(() => Math.round(progress.value * 100))
</script>

<template>
  <div class="simulation-panel">
    <div class="panel-header">
      <h3>{{ $t('simulation.title') }}
        <HelpTooltip
          title-key="help.tooltips.simulation.title"
          content-key="help.tooltips.simulation.content"
          article-id="simulation-overview"
        />
      </h3>
      <div class="header-actions">
        <button
          v-if="!isRunning"
          class="run-btn"
          :disabled="isRunning"
          @click="handleRun"
        >
          ▶ {{ $t('simulation.run') }}
        </button>
        <div v-else class="running-indicator">
          <span class="spinner"></span>
          {{ progressPercent }}%
        </div>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="error-message">
      <span class="error-icon">⚠</span>
      {{ error }}
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button
        :class="['tab', { active: activeTab === 'config' }]"
        @click="activeTab = 'config'"
      >
        {{ $t('simulation.configuration') }}
      </button>
      <button
        :class="['tab', { active: activeTab === 'times' }]"
        @click="activeTab = 'times'"
      >
        {{ $t('simulation.times') }}
      </button>
      <button
        :class="['tab', { active: activeTab === 'resources' }]"
        @click="activeTab = 'resources'"
      >
        {{ $t('simulation.resources') }}
      </button>
      <button
        :class="['tab', { active: activeTab === 'results' }]"
        :disabled="!hasResults"
        @click="activeTab = 'results'"
      >
        {{ $t('simulation.results') }}
      </button>
    </div>

    <!-- Tab content -->
    <div class="tab-content">
      <SimulationConfig v-if="activeTab === 'config'" />
      <TimeModelConfig v-else-if="activeTab === 'times'" />
      <ResourceConfig v-else-if="activeTab === 'resources'" />
      <SimulationResults v-else-if="activeTab === 'results'" @clear="handleClear" />
    </div>
  </div>
</template>

<style scoped>
.simulation-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.run-btn {
  padding: 8px 16px;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.run-btn:hover:not(:disabled) {
  background: #16a34a;
}

.run-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.running-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #fef2f2;
  border-bottom: 1px solid #fecaca;
  color: #991b1b;
  font-size: 12px;
}

:global(.dark) .error-message {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.error-icon {
  font-size: 14px;
}

.tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
}

.tab {
  flex: 1;
  padding: 10px 12px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.tab:hover:not(:disabled) {
  color: var(--color-text);
  background: var(--color-bg-hover);
}

.tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
</style>
