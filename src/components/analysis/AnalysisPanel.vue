<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePetriNetStore } from '@/stores/petriNet'
import { analyzeWorkflow, analyzeSoundness, computeStatistics } from '@/services/analysis'

const petriNetStore = usePetriNetStore()
const { net } = storeToRefs(petriNetStore)

// Analysis results
const workflowResult = ref(null)
const soundnessResult = ref(null)
const isAnalyzing = ref(false)

// Collapsed states
const showWorkflow = ref(true)
const showSoundness = ref(true)
const showStatistics = ref(false)

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
      <h3>Analysis</h3>
      <div class="header-actions">
        <button
          class="btn-run"
          :disabled="isAnalyzing"
          @click="runAllAnalyses"
        >
          {{ isAnalyzing ? 'Analyzing...' : '▶ Run All' }}
        </button>
        <button
          v-if="workflowResult || soundnessResult"
          class="btn-clear"
          @click="clearResults"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Statistics Section -->
    <div class="section">
      <div class="section-header" @click="showStatistics = !showStatistics">
        <span class="toggle">{{ showStatistics ? '▼' : '▶' }}</span>
        <span class="section-title">Statistics</span>
      </div>
      <div v-if="showStatistics" class="section-content">
        <div class="stats-grid">
          <div class="stat">
            <span class="stat-value">{{ statistics.places }}</span>
            <span class="stat-label">Places</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ statistics.transitions }}</span>
            <span class="stat-label">Transitions</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ statistics.arcs }}</span>
            <span class="stat-label">Arcs</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ statistics.operators }}</span>
            <span class="stat-label">Operators</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ statistics.totalTokens }}</span>
            <span class="stat-label">Tokens</span>
          </div>
        </div>
        <div class="stat-props">
          <div class="prop" :class="{ active: statistics.freeChoice }">
            Free Choice: {{ statistics.freeChoice ? 'Yes' : 'No' }}
          </div>
          <div class="prop" :class="{ active: statistics.stronglyConnected }">
            Connected: {{ statistics.stronglyConnected ? 'Yes' : 'No' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Workflow Analysis Section -->
    <div class="section">
      <div class="section-header" @click="showWorkflow = !showWorkflow">
        <span class="toggle">{{ showWorkflow ? '▼' : '▶' }}</span>
        <span class="section-title">Workflow Check</span>
        <span
          v-if="workflowResult"
          :class="['badge', workflowResult.valid ? 'valid' : 'invalid']"
        >
          {{ workflowResult.valid ? '✓ Valid' : '✗ Invalid' }}
        </span>
        <button
          class="btn-run-small"
          :disabled="isAnalyzing"
          @click.stop="runWorkflowAnalysis"
        >
          Run
        </button>
      </div>
      <div v-if="showWorkflow && workflowResult" class="section-content">
        <div class="result-meta">
          <span>Duration: {{ formatDuration(workflowResult.duration) }}</span>
        </div>
        <div class="issues-list">
          <div
            v-for="(issue, index) in workflowResult.issues"
            :key="index"
            :class="['issue', `issue-${issue.severity}`]"
          >
            <span class="issue-icon">{{ getSeverityIcon(issue.severity) }}</span>
            <div class="issue-content">
              <span class="issue-message">{{ issue.message }}</span>
              <span v-if="issue.details" class="issue-details">{{ issue.details }}</span>
              <div v-if="issue.affectedElements.length > 0" class="affected-elements">
                <button
                  v-for="id in issue.affectedElements.slice(0, 3)"
                  :key="id"
                  class="element-btn"
                  @click="highlightElement(id)"
                >
                  {{ id.substring(0, 8) }}...
                </button>
                <span v-if="issue.affectedElements.length > 3" class="more">
                  +{{ issue.affectedElements.length - 3 }} more
                </span>
              </div>
            </div>
          </div>
          <div v-if="workflowResult.issues.length === 0" class="no-issues">
            No issues found
          </div>
        </div>
      </div>
    </div>

    <!-- Soundness Analysis Section -->
    <div class="section">
      <div class="section-header" @click="showSoundness = !showSoundness">
        <span class="toggle">{{ showSoundness ? '▼' : '▶' }}</span>
        <span class="section-title">Soundness Check</span>
        <span
          v-if="soundnessResult"
          :class="['badge', soundnessResult.valid ? 'valid' : 'invalid']"
        >
          {{ soundnessResult.valid ? '✓ Sound' : '✗ Unsound' }}
        </span>
        <button
          class="btn-run-small"
          :disabled="isAnalyzing"
          @click.stop="runSoundnessAnalysis"
        >
          Run
        </button>
      </div>
      <div v-if="showSoundness && soundnessResult" class="section-content">
        <div class="result-meta">
          <span>Duration: {{ formatDuration(soundnessResult.duration) }}</span>
        </div>
        <div class="issues-list">
          <div
            v-for="(issue, index) in soundnessResult.issues"
            :key="index"
            :class="['issue', `issue-${issue.severity}`]"
          >
            <span class="issue-icon">{{ getSeverityIcon(issue.severity) }}</span>
            <div class="issue-content">
              <span class="issue-message">{{ issue.message }}</span>
              <span v-if="issue.details" class="issue-details">{{ issue.details }}</span>
              <div v-if="issue.affectedElements.length > 0" class="affected-elements">
                <button
                  v-for="id in issue.affectedElements.slice(0, 3)"
                  :key="id"
                  class="element-btn"
                  @click="highlightElement(id)"
                >
                  {{ id.substring(0, 8) }}...
                </button>
                <span v-if="issue.affectedElements.length > 3" class="more">
                  +{{ issue.affectedElements.length - 3 }} more
                </span>
              </div>
            </div>
          </div>
          <div v-if="soundnessResult.issues.length === 0" class="no-issues">
            No issues found
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.analysis-panel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  max-width: 360px;
  max-height: 500px;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-run {
  padding: 5px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.btn-run:hover:not(:disabled) {
  background: #2563eb;
}

.btn-run:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-clear {
  padding: 5px 10px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.btn-clear:hover {
  background: #f3f4f6;
}

.section {
  margin-bottom: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #f9fafb;
  cursor: pointer;
  border-radius: 5px 5px 0 0;
}

.section-header:hover {
  background: #f3f4f6;
}

.toggle {
  font-size: 10px;
  color: #6b7280;
  width: 12px;
}

.section-title {
  flex: 1;
  font-weight: 500;
  color: #374151;
}

.badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.badge.valid {
  background: #dcfce7;
  color: #166534;
}

.badge.invalid {
  background: #fee2e2;
  color: #991b1b;
}

.btn-run-small {
  padding: 2px 8px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
}

.btn-run-small:hover:not(:disabled) {
  background: #f3f4f6;
}

.btn-run-small:disabled {
  opacity: 0.5;
}

.section-content {
  padding: 10px;
  border-top: 1px solid #e5e7eb;
}

.result-meta {
  font-size: 11px;
  color: #6b7280;
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
  background: #f9fafb;
  border-radius: 4px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.stat-label {
  display: block;
  font-size: 10px;
  color: #6b7280;
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
  background: #f3f4f6;
  border-radius: 4px;
  color: #6b7280;
}

.prop.active {
  background: #dcfce7;
  color: #166534;
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

.affected-elements {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.element-btn {
  padding: 2px 6px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 3px;
  font-size: 10px;
  font-family: monospace;
  cursor: pointer;
}

.element-btn:hover {
  background: #f3f4f6;
  border-color: #3b82f6;
}

.more {
  font-size: 10px;
  color: #6b7280;
  align-self: center;
}

.no-issues {
  text-align: center;
  color: #6b7280;
  font-size: 12px;
  padding: 12px;
}
</style>
