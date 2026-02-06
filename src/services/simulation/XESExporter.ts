import type { SimulationResult, SimCase, SimEvent } from '@/types/simulation'

/**
 * XES (eXtensible Event Stream) Exporter
 * Exports simulation results in XES format for process mining tools
 */
export class XESExporter {
  /**
   * Export simulation result to XES XML string
   */
  export(result: SimulationResult, netName: string = 'Petri Net'): string {
    const traces = result.cases
      .filter(c => c.completed)
      .map(c => this.caseToTrace(c))

    return `<?xml version="1.0" encoding="UTF-8"?>
<log xes.version="1.0" xes.features="nested-attributes" openxes.version="1.0RC7">
  <extension name="Concept" prefix="concept" uri="http://www.xes-standard.org/concept.xesext"/>
  <extension name="Time" prefix="time" uri="http://www.xes-standard.org/time.xesext"/>
  <extension name="Lifecycle" prefix="lifecycle" uri="http://www.xes-standard.org/lifecycle.xesext"/>
  <extension name="Organizational" prefix="org" uri="http://www.xes-standard.org/org.xesext"/>
  
  <global scope="trace">
    <string key="concept:name" value="DEFAULT"/>
  </global>
  <global scope="event">
    <string key="concept:name" value="DEFAULT"/>
    <date key="time:timestamp" value="1970-01-01T00:00:00.000+00:00"/>
    <string key="lifecycle:transition" value="complete"/>
  </global>
  
  <classifier name="Activity" keys="concept:name"/>
  <classifier name="Activity classifier" keys="concept:name lifecycle:transition"/>
  
  <string key="concept:name" value="${this.escapeXml(netName)}"/>
  <string key="source" value="WoPeD Simulation"/>
  <string key="lifecycle:model" value="standard"/>
  
${traces.join('\n')}
</log>`
  }

  /**
   * Convert a simulation case to an XES trace
   */
  private caseToTrace(simCase: SimCase): string {
    // Filter to only start and complete events for activities
    const activityEvents = simCase.events.filter(
      e => (e.type === 'start' || e.type === 'complete') && e.transitionId
    )

    // Group events by transition to create activity lifecycle
    const eventStrings = activityEvents.map(e => this.eventToXES(e, simCase.startTime))

    return `  <trace>
    <string key="concept:name" value="${this.escapeXml(simCase.id)}"/>
    <date key="time:timestamp" value="${this.formatTimestamp(simCase.startTime)}"/>
${eventStrings.join('\n')}
  </trace>`
  }

  /**
   * Convert a simulation event to an XES event
   */
  private eventToXES(event: SimEvent, baseTime: number): string {
    const lifecycle = event.type === 'start' ? 'start' : 'complete'
    const timestamp = this.formatTimestamp(event.time)
    const activityName = event.transitionId

    return `    <event>
      <string key="concept:name" value="${this.escapeXml(activityName)}"/>
      <date key="time:timestamp" value="${timestamp}"/>
      <string key="lifecycle:transition" value="${lifecycle}"/>
    </event>`
  }

  /**
   * Format simulation time as ISO timestamp
   * Assumes simulation time is in minutes, starting from a base date
   */
  private formatTimestamp(simTime: number): string {
    // Base date: 2024-01-01 00:00:00 UTC
    const baseDate = new Date('2024-01-01T00:00:00Z')
    // Assume simTime is in minutes
    const timestamp = new Date(baseDate.getTime() + simTime * 60 * 1000)
    return timestamp.toISOString()
  }

  /**
   * Escape special XML characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  /**
   * Download XES file
   */
  downloadXES(result: SimulationResult, filename: string = 'simulation-log.xes', netName?: string): void {
    const xml = this.export(result, netName)
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}

// Singleton instance
export const xesExporter = new XESExporter()
