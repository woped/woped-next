import type { AnalysisIssue } from '@/types/analysis'

export type AnalysisBadgeKind = 'valid' | 'invalid' | 'warning' | 'info'

export function getAnalysisBadgeKind(issues: AnalysisIssue[]): AnalysisBadgeKind {
  if (issues.length === 0) return 'valid'
  if (issues.some((issue) => issue.severity === 'error')) return 'invalid'
  if (issues.some((issue) => issue.severity === 'warning')) return 'warning'
  return 'info'
}

export function getAnalysisBadgeIcon(kind: AnalysisBadgeKind): string {
  switch (kind) {
    case 'valid':
      return '✓'
    case 'invalid':
      return '✗'
    case 'warning':
      return '⚠'
    case 'info':
      return 'ℹ'
  }
}

export function getAnalysisBadge(issues: AnalysisIssue[]): { kind: AnalysisBadgeKind; icon: string } {
  const kind = getAnalysisBadgeKind(issues)
  return { kind, icon: getAnalysisBadgeIcon(kind) }
}
