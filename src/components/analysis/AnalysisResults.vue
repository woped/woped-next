<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAnalysisBadge } from '@/utils/analysisBadge'
import IssueList from './IssueList.vue'

const { t } = useI18n()

const props = defineProps({
  title: { type: String, required: true },
  result: { type: Object, default: null },
  isAnalyzing: { type: Boolean, default: false },
})

const emit = defineEmits(['run'])

const badge = computed(() => (props.result ? getAnalysisBadge(props.result.issues ?? []) : null))

function formatDuration(ms) {
  if (ms < 1) return '< 1ms'
  return `${ms.toFixed(1)}ms`
}
</script>

<template>
  <div class="analysis-results">
    <div class="ar-header" @click="$emit('toggle')">
      <span class="ar-title">{{ title }}</span>
      <span
        v-if="badge"
        :class="['badge', badge.kind]"
      >
        {{ badge.icon }}
      </span>
      <button class="btn-run-small" :disabled="isAnalyzing" @click.stop="emit('run')">
        {{ $t('analysis.run') }}
      </button>
    </div>
    <div v-if="result" class="ar-content">
      <div class="ar-meta">{{ $t('analysis.duration') }}: {{ formatDuration(result.duration) }}</div>
      <IssueList :issues="result.issues" :no-issues-text="$t('analysis.noIssues')" />
    </div>
  </div>
</template>

<style scoped>
.analysis-results {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  margin-bottom: 8px;
  overflow: hidden;
}
.ar-header {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; background: var(--color-bg); cursor: pointer;
}
.ar-header:hover { background: var(--color-bg-tertiary); }
.ar-title { flex: 1; font-weight: 500; font-size: 12px; color: var(--color-text-secondary); }
.badge { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 500; }
.badge.valid { background: #dcfce7; color: #166534; }
.badge.invalid { background: #fee2e2; color: #991b1b; }
.badge.warning { background: #fffbeb; color: #92400e; }
.badge.info { background: #eff6ff; color: #1d4ed8; }
:global(.dark) .badge.valid { background: rgba(34,197,94,.2); color: #4ade80; }
:global(.dark) .badge.invalid { background: rgba(239,68,68,.2); color: #f87171; }
:global(.dark) .badge.warning { background: rgba(245,158,11,.2); color: #fbbf24; }
:global(.dark) .badge.info { background: rgba(59,130,246,.2); color: #60a5fa; }
.btn-run-small {
  padding: 2px 8px; background: var(--color-bg-secondary);
  border: 1px solid var(--color-border); border-radius: 4px;
  font-size: 10px; color: var(--color-text); cursor: pointer;
}
.btn-run-small:hover:not(:disabled) { background: var(--color-bg-tertiary); }
.btn-run-small:disabled { opacity: 0.5; }
.ar-content { padding: 10px; border-top: 1px solid var(--color-border); }
.ar-meta { font-size: 11px; color: var(--color-text-muted); margin-bottom: 8px; }
</style>
