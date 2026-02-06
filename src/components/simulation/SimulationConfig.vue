<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useSimulationStore } from '@/stores/simulation'

const { t } = useI18n()
const simulationStore = useSimulationStore()
const { config } = storeToRefs(simulationStore)

const timeUnits = [
  { value: 'seconds', label: t('simulation.seconds') },
  { value: 'minutes', label: t('simulation.minutes') },
  { value: 'hours', label: t('simulation.hours') },
]

// Update handlers
const updateArrivalRate = (e) => {
  simulationStore.setConfig({ arrivalRate: parseFloat(e.target.value) || 1 })
}

const updateSimulationTime = (e) => {
  simulationStore.setConfig({ simulationTime: parseFloat(e.target.value) || 100 })
}

const updateWarmupTime = (e) => {
  simulationStore.setConfig({ warmupTime: parseFloat(e.target.value) || 0 })
}

const updateReplications = (e) => {
  simulationStore.setConfig({ replications: parseInt(e.target.value) || 1 })
}

const updateTimeUnit = (e) => {
  simulationStore.setConfig({ timeUnit: e.target.value })
}

const updateSeed = (e) => {
  const value = e.target.value.trim()
  simulationStore.setConfig({ seed: value ? parseInt(value) : undefined })
}

const handleReset = () => {
  simulationStore.resetConfig()
}
</script>

<template>
  <div class="simulation-config">
    <div class="config-section">
      <h4>{{ $t('simulation.arrivalSettings') }}</h4>
      
      <div class="config-row">
        <label>{{ $t('simulation.arrivalRate') }}</label>
        <div class="input-group">
          <input
            type="number"
            :value="config.arrivalRate"
            min="0.1"
            step="0.1"
            @change="updateArrivalRate"
          />
          <span class="unit">cases/{{ config.timeUnit }}</span>
        </div>
      </div>
    </div>

    <div class="config-section">
      <h4>{{ $t('simulation.timeSettings') }}</h4>
      
      <div class="config-row">
        <label>{{ $t('simulation.simulationTime') }}</label>
        <div class="input-group">
          <input
            type="number"
            :value="config.simulationTime"
            min="1"
            step="100"
            @change="updateSimulationTime"
          />
          <span class="unit">{{ config.timeUnit }}</span>
        </div>
      </div>

      <div class="config-row">
        <label>{{ $t('simulation.warmupTime') }}</label>
        <div class="input-group">
          <input
            type="number"
            :value="config.warmupTime"
            min="0"
            step="10"
            @change="updateWarmupTime"
          />
          <span class="unit">{{ config.timeUnit }}</span>
        </div>
      </div>

      <div class="config-row">
        <label>{{ $t('simulation.timeUnit') }}</label>
        <select :value="config.timeUnit" @change="updateTimeUnit">
          <option v-for="unit in timeUnits" :key="unit.value" :value="unit.value">
            {{ unit.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="config-section">
      <h4>{{ $t('simulation.advancedSettings') }}</h4>

      <div class="config-row">
        <label>{{ $t('simulation.replications') }}</label>
        <input
          type="number"
          :value="config.replications"
          min="1"
          max="100"
          @change="updateReplications"
        />
      </div>

      <div class="config-row">
        <label>{{ $t('simulation.seed') }}</label>
        <input
          type="number"
          :value="config.seed"
          :placeholder="$t('simulation.randomSeed')"
          @change="updateSeed"
        />
      </div>
    </div>

    <div class="config-actions">
      <button class="reset-btn" @click="handleReset">
        {{ $t('simulation.reset') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.simulation-config {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-section h4 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.config-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-row label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.config-row input,
.config-row select {
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 13px;
}

.config-row input:focus,
.config-row select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-group input {
  flex: 1;
}

.unit {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.config-actions {
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.reset-btn {
  padding: 8px 16px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.reset-btn:hover {
  background: var(--color-bg-hover);
}
</style>
