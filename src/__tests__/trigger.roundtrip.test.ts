import { describe, it, expect } from 'vitest'
import { PNMLParser } from '@/services/file/pnmlParser'
import { PNMLWriter } from '@/services/file/pnmlWriter'
import { JSONParser, JSONWriter } from '@/services/file/jsonParser'
import type { PetriNet } from '@/types/petri-net'
import type { Trigger, TimeTrigger, ResourceTrigger, MessageTrigger } from '@/types/triggers'

const pnmlParser = new PNMLParser()
const pnmlWriter = new PNMLWriter()
const jsonParser = new JSONParser()
const jsonWriter = new JSONWriter()

function createNetWithTriggers(): PetriNet {
  return {
    id: 'trigger-net',
    name: 'Trigger Test',
    places: [
      { id: 'p1', name: 'Start', position: { x: 0, y: 0 }, tokens: 1 },
      { id: 'p2', name: 'End', position: { x: 300, y: 0 }, tokens: 0 },
    ],
    transitions: [
      {
        id: 't1',
        name: 'With Triggers',
        position: { x: 150, y: 0 },
        triggers: [
          { id: 'trig-time', type: 'time', delay: 10, timeUnit: 'minutes' } as TimeTrigger,
          { id: 'trig-res', type: 'resource', resourceId: 'res-1', quantity: 2 } as ResourceTrigger,
          { id: 'trig-msg', type: 'message', messageType: 'order_received', source: 'ERP' } as MessageTrigger,
        ],
      },
    ],
    operators: [],
    subProcesses: [],
    arcs: [
      { id: 'a1', sourceId: 'p1', targetId: 't1', weight: 1, waypoints: [] },
      { id: 'a2', sourceId: 't1', targetId: 'p2', weight: 1, waypoints: [] },
    ],
  }
}

describe('Trigger Roundtrip — PNML', () => {
  it('should write triggers into PNML and parse them back', () => {
    const original = createNetWithTriggers()
    const pnml = pnmlWriter.write(original, { includeLayout: true })

    expect(pnml).toContain('<trigger')
    expect(pnml).toContain('type="time"')
    expect(pnml).toContain('type="resource"')
    expect(pnml).toContain('type="message"')

    const result = pnmlParser.parse(pnml)
    expect(result.success).toBe(true)

    const t1 = result.net!.transitions.find((t) => t.id === 't1')
    expect(t1).toBeDefined()
    expect(t1!.triggers).toBeDefined()
    expect(t1!.triggers).toHaveLength(3)

    const timeTrigger = t1!.triggers!.find((tr) => tr.type === 'time') as TimeTrigger
    expect(timeTrigger).toBeDefined()
    expect(timeTrigger.delay).toBe(10)
    expect(timeTrigger.timeUnit).toBe('minutes')

    const resTrigger = t1!.triggers!.find((tr) => tr.type === 'resource') as ResourceTrigger
    expect(resTrigger).toBeDefined()
    expect(resTrigger.resourceId).toBe('res-1')
    expect(resTrigger.quantity).toBe(2)

    const msgTrigger = t1!.triggers!.find((tr) => tr.type === 'message') as MessageTrigger
    expect(msgTrigger).toBeDefined()
    expect(msgTrigger.messageType).toBe('order_received')
    expect(msgTrigger.source).toBe('ERP')
  })

  it('should handle transitions without triggers', () => {
    const net: PetriNet = {
      id: 'no-trigger',
      name: 'No Triggers',
      places: [{ id: 'p1', name: 'P', position: { x: 0, y: 0 }, tokens: 0 }],
      transitions: [{ id: 't1', name: 'T', position: { x: 100, y: 0 } }],
      operators: [],
      subProcesses: [],
      arcs: [],
    }

    const pnml = pnmlWriter.write(net, { includeLayout: true })
    expect(pnml).not.toContain('<trigger')

    const result = pnmlParser.parse(pnml)
    expect(result.success).toBe(true)
    const t = result.net!.transitions[0]
    expect(!t.triggers || t.triggers.length === 0).toBe(true)
  })
})

describe('Trigger Roundtrip — JSON', () => {
  it('should preserve triggers through JSON write/parse', () => {
    const original = createNetWithTriggers()
    const json = jsonWriter.write(original, {})
    const result = jsonParser.parse(json)

    expect(result.success).toBe(true)

    const t1 = result.net!.transitions.find((t) => t.id === 't1')
    expect(t1).toBeDefined()
    expect(t1!.triggers).toBeDefined()
    expect(t1!.triggers).toHaveLength(3)

    const types = t1!.triggers!.map((tr) => tr.type).sort()
    expect(types).toEqual(['message', 'resource', 'time'])
  })

  it('should handle transitions without triggers in JSON', () => {
    const net: PetriNet = {
      id: 'empty',
      name: 'Empty',
      places: [],
      transitions: [{ id: 't1', name: 'T', position: { x: 0, y: 0 } }],
      operators: [],
      subProcesses: [],
      arcs: [],
    }

    const json = jsonWriter.write(net, {})
    const result = jsonParser.parse(json)

    expect(result.success).toBe(true)
    const t = result.net!.transitions[0]
    expect(!t.triggers || t.triggers.length === 0).toBe(true)
  })
})
