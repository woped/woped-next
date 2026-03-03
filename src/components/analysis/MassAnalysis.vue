<script setup>
import { ref, computed } from 'vue'
import { usePetriNetStore } from '@/stores/petriNet'
import { analyzeWorkflow, analyzeSoundness, metricsCalculator } from '@/services/analysis'

const petriNetStore = usePetriNetStore()

const selectedNetIds = ref(new Set())
const isRunning = ref(false)
const progress = ref({ current: 0, total: 0 })
const results = ref(new Map())
const expandedRows = ref(new Set())

const allNets = computed(() => {
  return Object.values(petriNetStore.nets).map((n) => ({ id: n.id, name: n.name }))
})

const hasSelection = computed(() => selectedNetIds.value.size > 0)
const allSelected = computed(() => allNets.value.length > 0 && selectedNetIds.value.size === allNets.value.length)

function toggleNet(id) {
  const s = new Set(selectedNetIds.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selectedNetIds.value = s
}

function selectAll() {
  selectedNetIds.value = new Set(allNets.value.map((n) => n.id))
}

function deselectAll() {
  selectedNetIds.value = new Set()
}

function toggleRow(id) {
  const s = new Set(expandedRows.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  expandedRows.value = s
}

async function runAnalysis() {
  const ids = [...selectedNetIds.value]
  if (!ids.length) return

  isRunning.value = true
  progress.value = { current: 0, total: ids.length }
  results.value = new Map()

  for (const id of ids) {
    const net = petriNetStore.nets[id]
    if (!net) continue

    await new Promise((r) => setTimeout(r, 0))

    const workflow = analyzeWorkflow(net)
    const soundness = analyzeSoundness(net)
    const metrics = metricsCalculator.calculate(net)

    results.value.set(id, { workflow, soundness, metrics })
    progress.value = { ...progress.value, current: progress.value.current + 1 }
  }

  isRunning.value = false
}

function issueCount(entry) {
  return (entry.workflow.issues?.length || 0) + (entry.soundness.issues?.length || 0)
}

function allIssues(entry) {
  return [
    ...(entry.workflow.issues || []).map((i) => ({ ...i, source: 'Workflow' })),
    ...(entry.soundness.issues || []).map((i) => ({ ...i, source: 'Soundness' })),
  ]
}

function metricsSummaryText(entry) {
  const s = entry.metrics.summary
  const parts = []
  if (s.bad > 0) parts.push(`${s.bad} bad`)
  if (s.warning > 0) parts.push(`${s.warning} warn`)
  if (s.good > 0) parts.push(`${s.good} good`)
  return parts.join(', ') || '–'
}

const sortedResults = computed(() => {
  return allNets.value
    .filter((n) => results.value.has(n.id))
    .map((n) => ({ ...n, data: results.value.get(n.id) }))
})

function exportCSV() {
  const rows = [['Net', 'Workflow Valid', 'Soundness Valid', 'Issues', 'Good', 'Warning', 'Bad'].join(',')]
  for (const r of sortedResults.value) {
    rows.push([
      `"${r.name}"`,
      r.data.workflow.valid ? 'Yes' : 'No',
      r.data.soundness.valid ? 'Yes' : 'No',
      issueCount(r.data),
      r.data.metrics.summary.good,
      r.data.metrics.summary.warning,
      r.data.metrics.summary.bad,
    ].join(','))
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'mass-analysis.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function severityClass(severity) {
  return `severity-${severity}`
}
</script>

<template>
  <div class="mass-analysis">
    <div class="panel-header">
      <span class="title">Batch Analysis</span>
    </div>

    <!-- Net selection -->
    <div class="selection-section">
      <div class="selection-actions">
        <button class="btn-sm" @click="selectAll">Select All</button>
        <button class="btn-sm" @click="deselectAll">Deselect All</button>
        <span class="selection-count">{{ selectedNetIds.size }} / {{ allNets.length }} selected</span>
      </div>

      <div class="net-list">
        <label
          v-for="n in allNets"
          :key="n.id"
          class="net-item"
        >
          <input
            type="checkbox"
            :checked="selectedNetIds.has(n.id)"
            @change="toggleNet(n.id)"
          />
          <span class="net-name">{{ n.name }}</span>
        </label>
      </div>

      <div v-if="!allNets.length" class="empty-state">No nets available.</div>
    </div>

    <!-- Run button and progress -->
    <div class="run-section">
      <button
        class="btn-run"
        :disabled="!hasSelection || isRunning"
        @click="runAnalysis"
      >
        {{ isRunning ? 'Analyzing...' : 'Run Analysis' }}
      </button>

      <div v-if="isRunning" class="progress-wrapper">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: (progress.total ? (progress.current / progress.total) * 100 : 0) + '%' }"
          />
        </div>
        <span class="progress-text">{{ progress.current }} / {{ progress.total }}</span>
      </div>
    </div>

    <!-- Results table -->
    <div v-if="sortedResults.length" class="results-section">
      <div class="results-header">
        <span class="results-title">Results</span>
        <button class="btn-sm" @click="exportCSV">Export CSV</button>
      </div>

      <table class="results-table">
        <thead>
          <tr>
            <th class="col-expand"></th>
            <th class="col-name">Net</th>
            <th class="col-badge">Workflow</th>
            <th class="col-badge">Soundness</th>
            <th class="col-num">Issues</th>
            <th class="col-metrics">Metrics</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="r in sortedResults" :key="r.id">
            <tr class="result-row" @click="toggleRow(r.id)">
              <td class="col-expand">
                <span class="expand-icon">{{ expandedRows.has(r.id) ? '▼' : '▶' }}</span>
              </td>
              <td class="col-name">{{ r.name }}</td>
              <td class="col-badge">
                <span :class="['badge', r.data.workflow.valid ? 'valid' : 'invalid']">
                  {{ r.data.workflow.valid ? '✓' : '✗' }}
                </span>
              </td>
              <td class="col-badge">
                <span :class="['badge', r.data.soundness.valid ? 'valid' : 'invalid']">
                  {{ r.data.soundness.valid ? '✓' : '✗' }}
                </span>
              </td>
              <td class="col-num">{{ issueCount(r.data) }}</td>
              <td class="col-metrics">{{ metricsSummaryText(r.data) }}</td>
            </tr>
            <tr v-if="expandedRows.has(r.id)" class="detail-row">
              <td colspan="6">
                <div class="detail-content">
                  <div v-if="allIssues(r.data).length" class="issues-list">
                    <div
                      v-for="(issue, idx) in allIssues(r.data)"
                      :key="idx"
                      class="issue-item"
                    >
                      <span :class="['issue-severity', severityClass(issue.severity)]">{{ issue.severity }}</span>
                      <span class="issue-source">{{ issue.source }}</span>
                      <span class="issue-code">{{ issue.code }}</span>
                      <span class="issue-msg">{{ issue.message }}</span>
                    </div>
                  </div>
                  <div v-else class="no-issues">No issues found.</div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.mass-analysis {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.title {
  font-weight: 500;
  color: var(--color-text);
  font-size: 13px;
}

/* --- Selection --- */

.selection-section {
  padding: 10px;
  border-bottom: 1px solid var(--color-border);
}

.selection-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.selection-count {
  margin-left: auto;
  font-size: 11px;
  color: var(--color-text-muted);
}

.btn-sm {
  padding: 3px 10px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 11px;
  color: var(--color-text);
  cursor: pointer;
}

.btn-sm:hover {
  background: var(--color-bg);
}

.net-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 180px;
  overflow-y: auto;
}

.net-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: var(--color-text);
}

.net-item:hover {
  background: var(--color-bg-secondary);
}

.net-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  padding: 16px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 12px;
}

/* --- Run --- */

.run-section {
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--color-border);
}

.btn-run {
  padding: 6px 16px;
  background: var(--color-primary);
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.btn-run:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-run:disabled {
  opacity: 0.5;
  cursor: default;
}

.progress-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--color-bg-secondary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 3px;
  transition: width 0.2s ease;
}

.progress-text {
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* --- Results --- */

.results-section {
  padding: 0;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.results-title {
  font-weight: 500;
  font-size: 12px;
  color: var(--color-text);
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.results-table th {
  text-align: left;
  padding: 6px 8px;
  font-weight: 500;
  font-size: 11px;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.results-table td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
}

.col-expand {
  width: 24px;
  text-align: center;
}

.expand-icon {
  font-size: 9px;
  color: var(--color-text-muted);
}

.col-name {
  min-width: 80px;
}

.col-badge {
  width: 70px;
  text-align: center;
}

.col-num {
  width: 50px;
  text-align: center;
}

.col-metrics {
  white-space: nowrap;
}

.result-row {
  cursor: pointer;
}

.result-row:hover td {
  background: var(--color-bg-secondary);
}

.badge {
  display: inline-block;
  padding: 1px 8px;
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

:global(.dark) .badge.valid {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

:global(.dark) .badge.invalid {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

/* --- Detail row --- */

.detail-row td {
  padding: 0;
  background: var(--color-bg-secondary);
}

.detail-content {
  padding: 8px 12px 8px 34px;
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.issue-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.issue-severity {
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
}

.severity-error {
  background: #fee2e2;
  color: #991b1b;
}

.severity-warning {
  background: #fef3c7;
  color: #92400e;
}

.severity-info {
  background: #dbeafe;
  color: #1e40af;
}

:global(.dark) .severity-error {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

:global(.dark) .severity-warning {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

:global(.dark) .severity-info {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.issue-source {
  color: var(--color-text-muted);
  font-size: 10px;
}

.issue-code {
  font-family: monospace;
  font-size: 10px;
  color: var(--color-text-muted);
}

.issue-msg {
  color: var(--color-text);
}

.no-issues {
  font-size: 11px;
  color: var(--color-text-muted);
}
</style>
