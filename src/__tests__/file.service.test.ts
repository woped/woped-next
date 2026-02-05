import { describe, it, expect } from 'vitest'
import { PNMLParser } from '@/services/file/pnmlParser'
import { PNMLWriter } from '@/services/file/pnmlWriter'
import { JSONParser, JSONWriter } from '@/services/file/jsonParser'
import type { PetriNet } from '@/types/petri-net'

// Create instances
const pnmlParser = new PNMLParser()
const pnmlWriter = new PNMLWriter()
const jsonParser = new JSONParser()
const jsonWriter = new JSONWriter()

describe('File Services', () => {
  // Sample PNML content
  const samplePNML = `<?xml version="1.0" encoding="UTF-8"?>
<pnml>
  <net id="test-net" type="http://www.pnml.org/version-2009/grammar/ptnet">
    <name><text>Test Net</text></name>
    <place id="p1">
      <name><text>Place 1</text></name>
      <graphics><position x="100" y="100"/></graphics>
      <initialMarking><text>1</text></initialMarking>
    </place>
    <place id="p2">
      <name><text>Place 2</text></name>
      <graphics><position x="300" y="100"/></graphics>
    </place>
    <transition id="t1">
      <name><text>Transition 1</text></name>
      <graphics><position x="200" y="100"/></graphics>
    </transition>
    <arc id="a1" source="p1" target="t1">
      <inscription><text>1</text></inscription>
    </arc>
    <arc id="a2" source="t1" target="p2">
      <inscription><text>1</text></inscription>
    </arc>
  </net>
</pnml>`

  // Sample net for testing
  function createSampleNet(): PetriNet {
    return {
      id: 'test-net',
      name: 'Test Net',
      places: [
        { id: 'p1', name: 'Place 1', position: { x: 100, y: 100 }, tokens: 1 },
        { id: 'p2', name: 'Place 2', position: { x: 300, y: 100 }, tokens: 0 },
      ],
      transitions: [
        { id: 't1', name: 'Transition 1', position: { x: 200, y: 100 } },
      ],
      operators: [],
      arcs: [
        { id: 'a1', sourceId: 'p1', targetId: 't1', weight: 1, waypoints: [] },
        { id: 'a2', sourceId: 't1', targetId: 'p2', weight: 1, waypoints: [] },
      ],
    }
  }

  describe('PNMLParser', () => {
    it('should parse valid PNML', () => {
      const result = pnmlParser.parse(samplePNML)

      expect(result.success).toBe(true)
      expect(result.net).toBeDefined()
      expect(result.net!.name).toBe('Test Net')
    })

    it('should parse places correctly', () => {
      const result = pnmlParser.parse(samplePNML)

      expect(result.net!.places).toHaveLength(2)
      
      const p1 = result.net!.places.find(p => p.id === 'p1')
      expect(p1).toBeDefined()
      expect(p1!.name).toBe('Place 1')
      expect(p1!.tokens).toBe(1)
      expect(p1!.position.x).toBe(100)
    })

    it('should parse transitions correctly', () => {
      const result = pnmlParser.parse(samplePNML)

      expect(result.net!.transitions).toHaveLength(1)
      
      const t1 = result.net!.transitions.find(t => t.id === 't1')
      expect(t1).toBeDefined()
      expect(t1!.name).toBe('Transition 1')
    })

    it('should parse arcs correctly', () => {
      const result = pnmlParser.parse(samplePNML)

      expect(result.net!.arcs).toHaveLength(2)
      
      const a1 = result.net!.arcs.find(a => a.id === 'a1')
      expect(a1).toBeDefined()
      expect(a1!.sourceId).toBe('p1')
      expect(a1!.targetId).toBe('t1')
    })

    it('should handle invalid XML', () => {
      const result = pnmlParser.parse('not valid xml <<>>')

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle empty net', () => {
      const result = pnmlParser.parse(`<?xml version="1.0"?>
        <pnml><net id="empty"></net></pnml>`)

      expect(result.success).toBe(true)
      expect(result.net!.places).toHaveLength(0)
      expect(result.net!.transitions).toHaveLength(0)
    })
  })

  describe('PNMLWriter', () => {
    it('should write PNML with net element', () => {
      const net = createSampleNet()
      const pnml = pnmlWriter.write(net, { includeLayout: true })

      expect(pnml).toContain('<?xml')
      expect(pnml).toContain('<net')
      expect(pnml).toContain('</net>')
    })

    it('should include all places', () => {
      const net = createSampleNet()
      const pnml = pnmlWriter.write(net, { includeLayout: true })

      expect(pnml).toContain('Place 1')
      expect(pnml).toContain('Place 2')
    })

    it('should include all transitions', () => {
      const net = createSampleNet()
      const pnml = pnmlWriter.write(net, { includeLayout: true })

      expect(pnml).toContain('Transition 1')
    })

    it('should include arcs', () => {
      const net = createSampleNet()
      const pnml = pnmlWriter.write(net, { includeLayout: true })

      expect(pnml).toContain('<arc')
      expect(pnml).toContain('source="p1"')
      expect(pnml).toContain('target="t1"')
    })

    it('should include layout when requested', () => {
      const net = createSampleNet()
      const pnml = pnmlWriter.write(net, { includeLayout: true })

      expect(pnml).toContain('<graphics')
      expect(pnml).toContain('<position')
    })

    it('should be parseable by PNMLParser', () => {
      const originalNet = createSampleNet()

      const pnml = pnmlWriter.write(originalNet, { includeLayout: true })
      const result = pnmlParser.parse(pnml)

      expect(result.success).toBe(true)
      expect(result.net!.places).toHaveLength(originalNet.places.length)
      expect(result.net!.transitions).toHaveLength(originalNet.transitions.length)
      expect(result.net!.arcs).toHaveLength(originalNet.arcs.length)
    })
  })

  describe('JSONParser', () => {
    it('should parse valid JSON', () => {
      const net = createSampleNet()
      const json = JSON.stringify(net)
      
      const result = jsonParser.parse(json)

      expect(result.success).toBe(true)
      expect(result.net).toBeDefined()
      expect(result.net!.name).toBe('Test Net')
    })

    it('should handle missing optional fields', () => {
      const minimalNet = {
        places: [{ id: 'p1' }],
        transitions: [],
        arcs: [],
      }
      const json = JSON.stringify(minimalNet)

      const result = jsonParser.parse(json)

      expect(result.success).toBe(true)
      // Should have default values
      expect(result.net!.places[0].name).toBeDefined()
      expect(result.net!.places[0].position).toBeDefined()
    })

    it('should handle invalid JSON', () => {
      const result = jsonParser.parse('not valid json {{{')

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('JSONWriter', () => {
    it('should write valid JSON', () => {
      const net = createSampleNet()
      const json = jsonWriter.write(net, {})

      expect(() => JSON.parse(json)).not.toThrow()
    })

    it('should preserve all data', () => {
      const net = createSampleNet()
      const json = jsonWriter.write(net, {})
      const parsed = JSON.parse(json)

      expect(parsed.places).toHaveLength(2)
      expect(parsed.transitions).toHaveLength(1)
      expect(parsed.arcs).toHaveLength(2)
    })

    it('should be parseable by JSONParser', () => {
      const originalNet = createSampleNet()
      const json = jsonWriter.write(originalNet, {})
      const result = jsonParser.parse(json)

      expect(result.success).toBe(true)
      expect(result.net!.places).toHaveLength(originalNet.places.length)
    })
  })
})
