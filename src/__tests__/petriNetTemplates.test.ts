import { describe, it, expect } from 'vitest'
import { templates } from '@/services/templates/petriNetTemplates'

describe('petriNetTemplates', () => {
  it('loads Loan Application template from PNML', () => {
    const template = templates.find(t => t.id === 'loanApplication')
    expect(template).toBeDefined()

    const net = template!.create()

    expect(net.name).toBe('Loan Application')
    expect(net.places.length).toBeGreaterThan(0)
    expect(net.transitions.length).toBeGreaterThan(0)
    expect(net.operators.length).toBeGreaterThan(0)
    expect(net.arcs.length).toBeGreaterThan(0)
  })
})
