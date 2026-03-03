<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { usePetriNetStore } from '@/stores/petriNet'
import { analyzeWorkflow, analyzeSoundness, metricsCalculator } from '@/services/analysis'

const { t } = useI18n()
const petriNetStore = usePetriNetStore()
const { net } = storeToRefs(petriNetStore)

const step = ref(0)
const isAnalyzing = ref(false)

const selectedAnalyses = ref({
  workflow: true,
  soundness: true,
  metrics: true,
})

const results = ref({
  workflow: null,
  soundness: null,
  metrics: null,
})

const steps = computed(() => [
  { id: 'select', label: t('analysis.wizard.selectAnalyses') },
  { id: 'run', label: t('analysis.wizard.running') },
  { id: 'results', label: t('analysis.wizard.results') },
])

const canProceed = computed(() => {
  if (step.value === 0) {
    return selectedAnalyses.value.workflow || selectedAnalyses.value.soundness || selectedAnalyses.value.metrics
  }
  return true
})

const runAnalyses = async () => {
  step.value = 1
  isAnalyzing.value = true
  results.value = { workflow: null, soundness: null, metrics: null }

  await new Promise(r => setTimeout(r, 50))

  if (selectedAnalyses.value.workflow) {
    results.value.workflow = analyzeWorkflow(net.value)
  }
  if (selectedAnalyses.value.soundness) {
    results.value.soundness = analyzeSoundness(net.value)
  }
  if (selectedAnalyses.value.metrics) {
    results.value.metrics = metricsCalculator.calculate(net.value)
  }

  isAnalyzing.value = false
  step.value = 2
}

const restart = () => {
  step.value = 0
  results.value = { workflow: null, soundness: null, metrics: null }
}

const formatDuration = (ms) => ms < 1 ? '< 1ms' : `${ms.toFixed(1)}ms`
</script>

<template>
  <div class="analysis-wizard">
    <div class="wizard-header">
      <h3>{{ t('analysis.wizard.title') }}</h3>
      <div class="steps-indicator">
        <span
          v-for="(s, i) in steps"
          :key="s.id"
          :class="['step-dot', { active: i === step, done: i < step }]"
        >
          {{ i < step ? '✓' : i + 1 }}
        </span>
      </div>
    </div>

    <!-- Step 0: Select analyses -->
    <div v-if="step === 0" class="wizard-step">
      <p class="step-description">{{ t('analysis.wizard.selectDescription') }}</p>
      <label class="checkbox-item">
        <input type="checkbox" v-model="selectedAnalyses.workflow" />
        <span>{{ t('analysis.workflowCheck') }}</span>
      </label>
      <label class="checkbox-item">
        <input type="checkbox" v-model="selectedAnalyses.soundness" />
        <span>{{ t('analysis.soundnessCheck') }}</span>
      </label>
      <label class="checkbox-item">
        <input type="checkbox" v-model="selectedAnalyses.metrics" />
        <span>{{ t('metrics.title') }}</span>
      </label>
      <button class="btn-primary" :disabled="!canProceed" @click="runAnalyses">
        {{ t('analysis.wizard.start') }}
      </button>
    </div>

    <!-- Step 1: Running -->
    <div v-else-if="step === 1" class="wizard-step">
      <div class="running-indicator">
        <div class="spinner" />
        <span>{{ t('analysis.analyzing') }}</span>
      </div>
    </div>

    <!-- Step 2: Results -->
    <div v-else class="wizard-step results-step">
      <div v-if="results.workflow" class="result-card">
        <div class="result-header">
          <span class="result-badge" :class="results.workflow.valid ? 'valid' : 'invalid'">
            {{ results.workflow.valid ? '✓' : '✗' }}
          </span>
          <span class="result-title">{{ t('analysis.workflowCheck') }}</span>
          <span class="result-duration">{{ formatDuration(results.workflow.duration) }}</span>
        </div>
        <div class="result-issues">
          <div
            v-for="issue in results.workflow.issues.filter(i => i.severity !== 'info')"
            :key="issue.code"
            :class="['issue', issue.severity]"
          >
            {{ issue.severity === 'error' ? '✗' : '⚠' }} {{ issue.message }}
          </div>
          <div v-if="results.workflow.issues.filter(i => i.severity !== 'info').length === 0" class="no-issues">
            {{ t('analysis.noIssues') }}
          </div>
        </div>
      </div>

      <div v-if="results.soundness" class="result-card">
        <div class="result-header">
          <span class="result-badge" :class="results.soundness.valid ? 'valid' : 'invalid'">
            {{ results.soundness.valid ? '✓' : '✗' }}
          </span>
          <span class="result-title">{{ t('analysis.soundnessCheck') }}</span>
          <span class="result-duration">{{ formatDuration(results.soundness.duration) }}</span>
        </div>
        <div class="result-issues">
          <div
            v-for="issue in results.soundness.issues.filter(i => i.severity !== 'info')"
            :key="issue.code"
            :class="['issue', issue.severity]"
          >
            {{ issue.severity === 'error' ? '✗' : '⚠' }} {{ issue.message }}
          </div>
          <div v-if="results.soundness.issues.filter(i => i.severity !== 'info').length === 0" class="no-issues">
            {{ t('analysis.noIssues') }}
          </div>
        </div>
      </div>

      <div v-if="results.metrics" class="result-card">
        <div class="result-header">
          <span class="result-title">{{ t('metrics.title') }}</span>
        </div>
        <div class="metrics-summary">
          <span class="metric-badge good">{{ results.metrics.summary.good }} good</span>
          <span class="metric-badge warning">{{ results.metrics.summary.warning }} warn</span>
          <span class="metric-badge bad">{{ results.metrics.summary.bad }} bad</span>
        </div>
      </div>

      <button class="btn-secondary" @click="restart">
        {{ t('analysis.wizard.restart') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.analysis-wizard {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  font-size: 13px;
}

.wizard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.wizard-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.steps-indicator {
  display: flex;
  gap: 8px;
}

.step-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  color: var(--color-text-muted);
}

.step-dot.active {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.step-dot.done {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.wizard-step {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.step-description {
  color: var(--color-text-muted);
  margin: 0 0 4px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
}

.checkbox-item:hover {
  background: var(--color-bg);
}

.btn-primary {
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  margin-top: 8px;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 8px 16px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text);
}

.running-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  color: var(--color-text-muted);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.result-card {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 10px;
  background: var(--color-bg);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.result-badge {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: white;
}

.result-badge.valid {
  background: #22c55e;
}

.result-badge.invalid {
  background: #ef4444;
}

.result-title {
  font-weight: 600;
  flex: 1;
}

.result-duration {
  font-size: 11px;
  color: var(--color-text-muted);
}

.issue {
  font-size: 12px;
  padding: 3px 0;
}

.issue.error {
  color: #ef4444;
}

.issue.warning {
  color: #f59e0b;
}

.no-issues {
  color: #22c55e;
  font-size: 12px;
}

.metrics-summary {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.metric-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.metric-badge.good {
  background: #dcfce7;
  color: #166534;
}

.metric-badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.metric-badge.bad {
  background: #fecaca;
  color: #991b1b;
}
</style>
