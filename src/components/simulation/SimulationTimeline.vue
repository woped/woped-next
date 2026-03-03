<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSimulationStore } from '@/stores/simulation'

const simulationStore = useSimulationStore()
const { result } = storeToRefs(simulationStore)

const MAX_CASES = 50
const LANE_HEIGHT = 20
const LANE_GAP = 4
const PADDING = { top: 30, right: 20, bottom: 50, left: 70 }
const EVENT_RADIUS = 4

const containerRef = ref(null)
const containerWidth = ref(600)

const eventColors = {
  arrival: '#22c55e',
  start: '#3b82f6',
  complete: '#a855f7',
  depart: '#9ca3af',
}

const eventLabels = {
  arrival: 'Arrival',
  start: 'Start',
  complete: 'Complete',
  depart: 'Depart',
}

const zoom = ref(1)
const panOffset = ref(0)

const cases = computed(() => {
  if (!result.value) return []
  return result.value.cases.slice(0, MAX_CASES)
})

const totalCases = computed(() => result.value?.cases.length ?? 0)
const showingSubset = computed(() => totalCases.value > MAX_CASES)

const timeExtent = computed(() => {
  if (!cases.value.length) return { min: 0, max: 1 }
  let min = Infinity
  let max = -Infinity
  for (const c of cases.value) {
    for (const e of c.events) {
      if (e.time < min) min = e.time
      if (e.time > max) max = e.time
    }
    if (c.startTime < min) min = c.startTime
    if (c.endTime > 0 && c.endTime > max) max = c.endTime
  }
  if (!isFinite(min)) min = 0
  if (!isFinite(max) || max <= min) max = min + 1
  return { min, max }
})

const innerWidth = computed(() => {
  const base = containerWidth.value - PADDING.left - PADDING.right
  return base * zoom.value
})

const svgWidth = computed(() => innerWidth.value + PADDING.left + PADDING.right)
const svgHeight = computed(() => PADDING.top + cases.value.length * (LANE_HEIGHT + LANE_GAP) + PADDING.bottom)

const timeScale = computed(() => {
  const { min, max } = timeExtent.value
  const range = max - min
  return (t) => PADDING.left + ((t - min) / range) * innerWidth.value
})

const timeTicks = computed(() => {
  const { min, max } = timeExtent.value
  const range = max - min
  const targetCount = Math.max(4, Math.min(12, Math.floor(innerWidth.value / 80)))
  const rawStep = range / targetCount
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const normalized = rawStep / magnitude
  let step
  if (normalized <= 1.5) step = magnitude
  else if (normalized <= 3.5) step = 2 * magnitude
  else if (normalized <= 7.5) step = 5 * magnitude
  else step = 10 * magnitude

  const ticks = []
  const start = Math.ceil(min / step) * step
  for (let t = start; t <= max; t += step) {
    ticks.push({ value: t, x: timeScale.value(t) })
  }
  return ticks
})

const lanes = computed(() => {
  return cases.value.map((c, i) => {
    const y = PADDING.top + i * (LANE_HEIGHT + LANE_GAP)
    const x1 = timeScale.value(c.startTime)
    const x2 = c.endTime > 0 ? timeScale.value(c.endTime) : timeScale.value(timeExtent.value.max)

    const events = c.events.map(e => ({
      cx: timeScale.value(e.time),
      cy: y + LANE_HEIGHT / 2,
      color: eventColors[e.type],
      type: e.type,
      time: e.time,
      transitionId: e.transitionId,
      placeId: e.placeId,
      caseId: e.caseId,
    }))

    return {
      id: c.id,
      y,
      x1,
      x2,
      width: Math.max(x2 - x1, 2),
      completed: c.completed,
      events,
    }
  })
})

const tooltip = ref({ show: false, x: 0, y: 0, lines: [] })

const showTooltip = (event, data) => {
  const svg = event.target.closest('svg')
  if (!svg) return
  const pt = svg.createSVGPoint()
  pt.x = event.clientX
  pt.y = event.clientY
  const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse())

  const lines = [
    `Type: ${eventLabels[data.type]}`,
    `Time: ${data.time.toFixed(2)}`,
    `Case: ${data.caseId}`,
  ]
  if (data.transitionId) lines.push(`Transition: ${data.transitionId}`)
  if (data.placeId) lines.push(`Place: ${data.placeId}`)

  tooltip.value = { show: true, x: svgPt.x, y: svgPt.y - 12, lines }
}

const hideTooltip = () => {
  tooltip.value.show = false
}

const onWheel = (e) => {
  if (!e.ctrlKey && !e.metaKey) return
  e.preventDefault()
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  zoom.value = Math.max(1, Math.min(10, zoom.value * delta))
}

const updateWidth = () => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth
  }
}

let resizeObserver = null
onMounted(() => {
  updateWidth()
  resizeObserver = new ResizeObserver(updateWidth)
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

const formatTick = (value) => {
  if (Math.abs(value) >= 1000) return value.toFixed(0)
  if (Math.abs(value) >= 1) return value.toFixed(1)
  return value.toFixed(2)
}

const tooltipWidth = computed(() => {
  if (!tooltip.value.lines.length) return 120
  const maxLen = Math.max(...tooltip.value.lines.map(l => l.length))
  return Math.max(120, maxLen * 7 + 16)
})

const tooltipHeight = computed(() => tooltip.value.lines.length * 14 + 12)
</script>

<template>
  <div class="simulation-timeline" v-if="result">
    <div class="timeline-header">
      <h4>Event Timeline</h4>
      <div class="zoom-controls">
        <button class="zoom-btn" @click="zoom = Math.max(1, zoom * 0.8)" :disabled="zoom <= 1">−</button>
        <span class="zoom-label">{{ (zoom * 100).toFixed(0) }}%</span>
        <button class="zoom-btn" @click="zoom = Math.min(10, zoom * 1.25)">+</button>
      </div>
    </div>

    <div v-if="showingSubset" class="subset-note">
      Showing {{ MAX_CASES }} of {{ totalCases }} cases
    </div>

    <div ref="containerRef" class="timeline-scroll" @wheel="onWheel">
      <svg :width="svgWidth" :height="svgHeight" class="timeline-svg">
        <!-- Lane backgrounds -->
        <g v-for="(lane, i) in lanes" :key="'bg-' + lane.id">
          <rect
            :x="PADDING.left"
            :y="lane.y"
            :width="innerWidth"
            :height="LANE_HEIGHT"
            :class="['lane-bg', { even: i % 2 === 0 }]"
          />
          <!-- Case label -->
          <text
            :x="PADDING.left - 6"
            :y="lane.y + LANE_HEIGHT / 2 + 3"
            text-anchor="end"
            class="lane-label"
          >
            {{ lane.id.length > 6 ? lane.id.slice(-6) : lane.id }}
          </text>
          <!-- Case bar -->
          <rect
            :x="lane.x1"
            :y="lane.y + 4"
            :width="lane.width"
            :height="LANE_HEIGHT - 8"
            :class="['case-bar', { completed: lane.completed, incomplete: !lane.completed }]"
            rx="3"
          />
        </g>

        <!-- Events -->
        <g v-for="lane in lanes" :key="'ev-' + lane.id">
          <circle
            v-for="(ev, j) in lane.events"
            :key="j"
            :cx="ev.cx"
            :cy="ev.cy"
            :r="EVENT_RADIUS"
            :fill="ev.color"
            class="event-dot"
            @mouseenter="showTooltip($event, ev)"
            @mouseleave="hideTooltip"
          />
        </g>

        <!-- Time axis -->
        <line
          :x1="PADDING.left"
          :y1="svgHeight - PADDING.bottom + 10"
          :x2="PADDING.left + innerWidth"
          :y2="svgHeight - PADDING.bottom + 10"
          class="axis-line"
        />
        <g v-for="tick in timeTicks" :key="'t-' + tick.value">
          <line
            :x1="tick.x"
            :y1="svgHeight - PADDING.bottom + 10"
            :x2="tick.x"
            :y2="svgHeight - PADDING.bottom + 16"
            class="tick-line"
          />
          <text
            :x="tick.x"
            :y="svgHeight - PADDING.bottom + 28"
            text-anchor="middle"
            class="tick-label"
          >
            {{ formatTick(tick.value) }}
          </text>
        </g>
        <text
          :x="PADDING.left + innerWidth / 2"
          :y="svgHeight - 6"
          text-anchor="middle"
          class="axis-title"
        >
          Time
        </text>

        <!-- Tooltip -->
        <g v-if="tooltip.show" class="tooltip-group">
          <rect
            :x="tooltip.x - tooltipWidth / 2"
            :y="tooltip.y - tooltipHeight"
            :width="tooltipWidth"
            :height="tooltipHeight"
            rx="4"
            class="tooltip-bg"
          />
          <text
            v-for="(line, li) in tooltip.lines"
            :key="li"
            :x="tooltip.x - tooltipWidth / 2 + 8"
            :y="tooltip.y - tooltipHeight + 14 + li * 14"
            class="tooltip-text"
          >
            {{ line }}
          </text>
        </g>
      </svg>
    </div>

    <!-- Legend -->
    <div class="legend">
      <div v-for="(color, type) in eventColors" :key="type" class="legend-item">
        <span class="legend-dot" :style="{ background: color }"></span>
        <span class="legend-label">{{ eventLabels[type] }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.simulation-timeline {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.timeline-header h4 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.zoom-btn {
  width: 22px;
  height: 22px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
}

.zoom-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.zoom-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.zoom-label {
  font-size: 10px;
  color: var(--color-text-muted);
  min-width: 36px;
  text-align: center;
}

.subset-note {
  font-size: 10px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
  padding: 4px 8px;
  background: var(--color-bg-secondary);
  border-radius: 4px;
  text-align: center;
}

.timeline-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg-secondary);
}

.timeline-svg {
  display: block;
}

.lane-bg {
  fill: transparent;
}

.lane-bg.even {
  fill: var(--color-bg);
  opacity: 0.4;
}

.lane-label {
  font-size: 9px;
  fill: var(--color-text-muted);
  font-family: monospace;
}

.case-bar {
  opacity: 0.3;
}

.case-bar.completed {
  fill: #22c55e;
}

.case-bar.incomplete {
  fill: #f97316;
}

.event-dot {
  cursor: pointer;
  stroke: var(--color-bg);
  stroke-width: 1;
  transition: r 0.1s;
}

.event-dot:hover {
  r: 6;
}

.axis-line {
  stroke: var(--color-border);
  stroke-width: 1;
}

.tick-line {
  stroke: var(--color-border);
  stroke-width: 1;
}

.tick-label {
  font-size: 9px;
  fill: var(--color-text-muted);
}

.axis-title {
  font-size: 10px;
  fill: var(--color-text-muted);
}

.tooltip-group {
  pointer-events: none;
}

.tooltip-bg {
  fill: var(--color-bg-secondary);
  stroke: var(--color-border);
  stroke-width: 1;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.15));
}

.tooltip-text {
  font-size: 10px;
  fill: var(--color-text);
}

.legend {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  font-size: 10px;
  color: var(--color-text-muted);
}
</style>
