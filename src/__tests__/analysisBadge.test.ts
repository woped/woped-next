import { describe, it, expect } from 'vitest'
import { getAnalysisBadge, getAnalysisBadgeKind } from '@/utils/analysisBadge'
import type { AnalysisIssue } from '@/types/analysis'

function issue(severity: AnalysisIssue['severity']): AnalysisIssue {
  return {
    severity,
    code: 'WF001',
    message: 'test',
    affectedElements: [],
  }
}

describe('analysisBadge', () => {
  it('shows valid when there are no issues', () => {
    expect(getAnalysisBadgeKind([])).toBe('valid')
    expect(getAnalysisBadge([])).toEqual({ kind: 'valid', icon: '✓' })
  })

  it('shows info when only informational findings exist', () => {
    expect(getAnalysisBadgeKind([issue('info')])).toBe('info')
    expect(getAnalysisBadge([issue('info')]).icon).toBe('ℹ')
  })

  it('shows warning when warnings exist without errors', () => {
    expect(getAnalysisBadgeKind([issue('warning')])).toBe('warning')
    expect(getAnalysisBadge([issue('warning')]).icon).toBe('⚠')
  })

  it('shows invalid when errors exist', () => {
    const issues = [issue('info'), issue('warning'), issue('error')]
    expect(getAnalysisBadgeKind(issues)).toBe('invalid')
    expect(getAnalysisBadge(issues).icon).toBe('✗')
  })
})
