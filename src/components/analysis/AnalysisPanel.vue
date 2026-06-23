<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { usePetriNetStore } from '@/stores/petriNet'
import { analyzeWorkflow, analyzeSoundness, computeStatistics } from '@/services/analysis'
import MetricsSection from './MetricsSection.vue'
import AnalysisResults from './AnalysisResults.vue'
import CoverabilityGraphView from './CoverabilityGraphView.vue'
import CustomMetricsBuilder from './CustomMetricsBuilder.vue'
import ProcessTree from '@/components/editor/ProcessTree.vue'
import HelpTooltip from '@/components/help/HelpTooltip.vue'

const { t } = useI18n()
const petriNetStore = usePetriNetStore()
const { net } = storeToRefs(petriNetStore)

// Conference: UI entry points disabled (analysis logic is preserved and can be
// re-enabled by flipping these flags back to true).
const SHOW_SOUNDNESS_CHECK = false
const SHOW_CUSTOM_METRICS = false

// Analysis results
const workflowResult = ref(null)
const soundnessResult = ref(null)
const isAnalyzing = ref(false)

// Collapsed states
const showStatistics = ref(false)
const showFreeChoice = ref(false)
const showCoverability = ref(false)
const showProcessTree = ref(false)
const showCustomMetrics = ref(false)

// Current statistics
const statistics = computed(() => computeStatistics(net.value))

// Run workflow analysis
const runWorkflowAnalysis = () => {
  isAnalyzing.value = true
  setTimeout(() => {
    workflowResult.value = analyzeWorkflow(net.value)
    isAnalyzing.value = false
  }, 50)
}

// Run soundness analysis
const runSoundnessAnalysis = () => {
  isAnalyzing.value = true
  setTimeout(() => {
    soundnessResult.value = analyzeSoundness(net.value)
    isAnalyzing.value = false
  }, 50)
}

// Run all analyses
const runAllAnalyses = () => {
  isAnalyzing.value = true
  setTimeout(() => {
    workflowResult.value = analyzeWorkflow(net.value)
    soundnessResult.value = analyzeSoundness(net.value)
    isAnalyzing.value = false
  }, 50)
}

// Clear results
const clearResults = () => {
  workflowResult.value = null
  soundnessResult.value = null
}

// Highlight element on canvas
const highlightElement = (elementId) => {
  petriNetStore.clearSelection()
  petriNetStore.select(elementId, false)
}

// Get severity icon
const getSeverityIcon = (severity) => {
  switch (severity) {
    case 'error':
      return '✗'
    case 'warning':
      return '⚠'
    case 'info':
      return 'ℹ'
    default:
      return '•'
  }
}

// Format duration
const formatDuration = (ms) => {
  if (ms < 1) return '< 1ms'
  return `${ms.toFixed(1)}ms`
}
</script>

<template>
  <div class="analysis-panel">
    <!-- Header -->
    <div class="panel-header">
      <h3>{{ $t('analysis.title') }}
        <HelpTooltip
          title-key="help.tooltips.analysis.title"
          content-key="help.tooltips.analysis.content"
          article-id="analysis-overview"
        />
      </h3>
      <div class="header-actions">
        <button
          class="btn-run"
          :disabled="isAnalyzing"
          @click="runAllAnalyses"
        >
          {{ isAnalyzing ? $t('analysis.analyzing') : '▶ ' + $t('analysis.runAll') }}
        </button>
        <button
          v-if="workflowResult || soundnessResult"
          class="btn-clear"
          @click="clearResults"
        >
          {{ $t('analysis.clear') }}
        </button>
      </div>
    </div>

    <!-- Process Metrics Section -->
    <MetricsSection />

    <!-- Process Structure -->
    <div class="section">
      <div class="section-header" @click="showProcessTree = !showProcessTree">
        <span class="toggle">{{ showProcessTree ? '▼' : '▶' }}</span>
        <span class="section-title">{{ $t('analysis.processTree') }}</span>
      </div>
      <div v-if="showProcessTree" class="section-content">
        <ProcessTree />
      </div>
    </div>

    <!-- Statistics Section -->
    <div class="section">
      <div class="section-header" @click="showStatistics = !showStatistics">
        <span class="toggle">{{ showStatistics ? '▼' : '▶' }}</span>
        <span class="section-title">{{ $t('analysis.statistics') }}</span>
      </div>
      <div v-if="showStatistics" class="section-content">
        <div class="stats-grid">
          <div class="stat">
            <span class="stat-value">{{ statistics.places }}</span>
            <span class="stat-label">{{ $t('properties.places') }}</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ statistics.transitions }}</span>
            <span class="stat-label">{{ $t('properties.transitions') }}</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ statistics.arcs }}</span>
            <span class="stat-label">{{ $t('properties.arcs') }}</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ statistics.operators }}</span>
            <span class="stat-label">{{ $t('properties.operators') }}</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ statistics.totalTokens }}</span>
            <span class="stat-label">{{ $t('properties.tokens') }}</span>
          </div>
        </div>
        <div class="stat-props">
          <div class="prop" :class="{ active: statistics.stronglyConnected }">
            {{ $t('analysis.connected') }}: {{ statistics.stronglyConnected ? $t('common.yes') : $t('common.no') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Workflow Analysis -->
    <AnalysisResults
      :title="$t('analysis.workflowCheck')"
      :result="workflowResult"
      :is-analyzing="isAnalyzing"
      @run="runWorkflowAnalysis"
    />

    <!-- Soundness Analysis (UI disabled for conference; logic preserved) -->
    <AnalysisResults
      v-if="SHOW_SOUNDNESS_CHECK"
      :title="$t('analysis.soundnessCheck')"
      :result="soundnessResult"
      :is-analyzing="isAnalyzing"
      @run="runSoundnessAnalysis"
    />

    <!-- Free Choice (coming soon) -->
    <div class="section">
      <div class="section-header" @click="showFreeChoice = !showFreeChoice">
        <span class="toggle">{{ showFreeChoice ? '▼' : '▶' }}</span>
        <span class="section-title">{{ $t('analysis.freeChoice') }}</span>
      </div>
      <div v-if="showFreeChoice" class="section-content">
        <p class="coming-soon">{{ $t('common.comingSoon') }}</p>
      </div>
    </div>

    <!-- State Space Graphs -->
    <div class="section">
      <div class="section-header" @click="showCoverability = !showCoverability">
        <span class="toggle">{{ showCoverability ? '▼' : '▶' }}</span>
        <span class="section-title">{{ $t('analysis.stateSpaceGraphs') }}</span>
      </div>
      <div v-if="showCoverability" class="section-content">
        <CoverabilityGraphView />
      </div>
    </div>

    <!-- Custom Metrics (UI disabled for conference; component preserved) -->
    <div v-if="SHOW_CUSTOM_METRICS" class="section">
      <div class="section-header" @click="showCustomMetrics = !showCustomMetrics">
        <span class="toggle">{{ showCustomMetrics ? '▼' : '▶' }}</span>
        <span class="section-title">{{ $t('analysis.customMetrics') }}</span>
      </div>
      <div v-if="showCustomMetrics" class="section-content">
        <CustomMetricsBuilder />
      </div>
    </div>
  </div>
</template>

<style scoped>
.analysis-panel {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-run {
  padding: 5px 12px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.btn-run:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-run:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-clear {
  padding: 5px 10px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 12px;
  color: var(--color-text);
  cursor: pointer;
}

.btn-clear:hover {
  background: var(--color-bg-tertiary);
}

.section {
  margin-bottom: 8px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--color-bg);
  cursor: pointer;
  border-radius: 5px 5px 0 0;
}

.section-header:hover {
  background: var(--color-bg-tertiary);
}

.toggle {
  font-size: 10px;
  color: var(--color-text-muted);
  width: 12px;
}

.section-title {
  flex: 1;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.badge.valid {
  background: var(--color-success-bg, #dcfce7);
  color: var(--color-success-text, #166534);
}

.badge.invalid {
  background: var(--color-error-bg, #fee2e2);
  color: var(--color-error-text, #991b1b);
}

:global(.dark) .badge.valid {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

:global(.dark) .badge.invalid {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.btn-run-small {
  padding: 2px 8px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 10px;
  color: var(--color-text);
  cursor: pointer;
}

.btn-run-small:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
}

.btn-run-small:disabled {
  opacity: 0.5;
}

.section-content {
  padding: 10px;
  border-top: 1px solid var(--color-border);
}

.result-meta {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

.stat {
  text-align: center;
  padding: 8px;
  background: var(--color-bg);
  border-radius: 4px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}

.stat-label {
  display: block;
  font-size: 10px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.stat-props {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.prop {
  font-size: 11px;
  padding: 3px 8px;
  background: var(--color-bg-tertiary);
  border-radius: 4px;
  color: var(--color-text-muted);
}

.prop.active {
  background: #dcfce7;
  color: #166534;
}

:global(.dark) .prop.active {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.issue {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
}

.issue-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.issue-warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.issue-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

:global(.dark) .issue-error {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
}

:global(.dark) .issue-warning {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.3);
}

:global(.dark) .issue-info {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
}

.issue-icon {
  font-size: 14px;
  line-height: 1;
}

.issue-error .issue-icon {
  color: #dc2626;
}

.issue-warning .issue-icon {
  color: #d97706;
}

.issue-info .issue-icon {
  color: #2563eb;
}

:global(.dark) .issue-error .issue-icon {
  color: #f87171;
}

:global(.dark) .issue-warning .issue-icon {
  color: #fbbf24;
}

:global(.dark) .issue-info .issue-icon {
  color: #60a5fa;
}

.issue-content {
  flex: 1;
  min-width: 0;
}

.issue-message {
  display: block;
  color: #374151;
}

.issue-details {
  display: block;
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
}

:global(.dark) .issue-message {
  color: #e5e7eb;
}

:global(.dark) .issue-details {
  color: #9ca3af;
}

:global(.dark) .issue-error .issue-message {
  color: #fecaca;
}

:global(.dark) .issue-warning .issue-message {
  color: #fde68a;
}

:global(.dark) .issue-info .issue-message {
  color: #bfdbfe;
}

.affected-elements {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.element-btn {
  padding: 2px 6px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  font-size: 10px;
  font-family: monospace;
  color: var(--color-text);
  cursor: pointer;
}

.element-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-primary);
}

.more {
  font-size: 10px;
  color: var(--color-text-muted);
  align-self: center;
}

.no-issues {
  text-align: center;
  color: #166534;
  background: #dcfce7;
  border-radius: 4px;
  font-size: 12px;
  padding: 12px;
}

.coming-soon {
  margin: 0;
  padding: 10px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-style: italic;
  color: var(--color-text-muted);
  background: var(--color-bg-tertiary);
  text-align: center;
}

:global(.dark) .no-issues {
  color: #4ade80;
  background: rgba(34, 197, 94, 0.15);
}
</style>
