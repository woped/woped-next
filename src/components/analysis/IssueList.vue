<script setup>
import { useI18n } from 'vue-i18n'
import { usePetriNetStore } from '@/stores/petriNet'

defineProps({
  issues: { type: Array, default: () => [] },
  noIssuesText: { type: String, default: 'No issues found' },
})

const { t } = useI18n()
const store = usePetriNetStore()

function getSeverityIcon(severity) {
  switch (severity) {
    case 'error': return '✗'
    case 'warning': return '⚠'
    case 'info': return 'ℹ'
    default: return '•'
  }
}

function issueMessage(issue) {
  if (issue.messageKey) return t(issue.messageKey, issue.messageParams ?? {})
  return issue.message
}

function issueDetails(issue) {
  if (issue.detailItems?.length) {
    return issue.detailItems.map((item) => t(item.key, item.params ?? {})).join(' ')
  }
  if (issue.detailsKey) return t(issue.detailsKey, issue.detailsParams ?? {})
  return issue.details
}

function highlightElement(elementId) {
  store.clearSelection()
  store.select(elementId, false)
}
</script>

<template>
  <div class="issues-list">
    <div
      v-for="(issue, index) in issues"
      :key="index"
      :class="['issue', `issue-${issue.severity}`]"
    >
      <span class="issue-icon">{{ getSeverityIcon(issue.severity) }}</span>
      <div class="issue-content">
        <span class="issue-message">{{ issueMessage(issue) }}</span>
        <span v-if="issueDetails(issue)" class="issue-details">{{ issueDetails(issue) }}</span>
        <div v-if="issue.affectedElements?.length > 0" class="affected-elements">
          <button
            v-for="id in issue.affectedElements.slice(0, 3)"
            :key="id"
            class="element-btn"
            @click="highlightElement(id)"
          >
            {{ id.substring(0, 8) }}...
          </button>
          <span v-if="issue.affectedElements.length > 3" class="more">
            +{{ issue.affectedElements.length - 3 }}
          </span>
        </div>
      </div>
    </div>
    <div v-if="issues.length === 0" class="no-issues">
      {{ noIssuesText }}
    </div>
  </div>
</template>

<style scoped>
.issues-list { display: flex; flex-direction: column; gap: 8px; }
.issue { display: flex; gap: 8px; padding: 8px; border-radius: 4px; font-size: 12px; }
.issue-error { background: #fef2f2; border: 1px solid #fecaca; }
.issue-warning { background: #fffbeb; border: 1px solid #fde68a; }
.issue-info { background: #eff6ff; border: 1px solid #bfdbfe; }
:global(.dark) .issue-error { background: rgba(239,68,68,.15); border-color: rgba(239,68,68,.3); }
:global(.dark) .issue-warning { background: rgba(245,158,11,.15); border-color: rgba(245,158,11,.3); }
:global(.dark) .issue-info { background: rgba(59,130,246,.15); border-color: rgba(59,130,246,.3); }
.issue-icon { font-size: 14px; line-height: 1; }
.issue-error .issue-icon { color: #dc2626; }
.issue-warning .issue-icon { color: #d97706; }
.issue-info .issue-icon { color: #2563eb; }
:global(.dark) .issue-error .issue-icon { color: #f87171; }
:global(.dark) .issue-warning .issue-icon { color: #fbbf24; }
:global(.dark) .issue-info .issue-icon { color: #60a5fa; }
.issue-content { flex: 1; min-width: 0; }
.issue-message { display: block; color: var(--color-text); }
.issue-details { display: block; font-size: 11px; color: var(--color-text-muted); margin-top: 4px; }
.affected-elements { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.element-btn { padding: 2px 6px; background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 3px; font-size: 10px; font-family: monospace; color: var(--color-text); cursor: pointer; }
.element-btn:hover { background: var(--color-bg-tertiary); border-color: var(--color-primary); }
.more { font-size: 10px; color: var(--color-text-muted); align-self: center; }
.no-issues { text-align: center; color: #166534; background: #dcfce7; border-radius: 4px; font-size: 12px; padding: 12px; }
:global(.dark) .no-issues { color: #4ade80; background: rgba(34,197,94,.15); }
</style>
