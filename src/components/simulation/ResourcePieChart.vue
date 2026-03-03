<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSimulationStore } from '@/stores/simulation'

const simulationStore = useSimulationStore()
const { result } = storeToRefs(simulationStore)

const PALETTE = [
  '#3b82f6', '#22c55e', '#f97316', '#a855f7',
  '#ec4899', '#14b8a6', '#eab308', '#ef4444',
  '#6366f1', '#84cc16', '#06b6d4', '#f43f5e',
]

const SIZE = 200
const CENTER = SIZE / 2
const RADIUS = 75
const INNER_RADIUS = 40

const stats = computed(() => result.value?.statistics)
const resourceStats = computed(() => stats.value?.resourceStats ?? [])
const hasData = computed(() => resourceStats.value.length > 0)

const totalUtilization = computed(() => {
  const sum = resourceStats.value.reduce((acc, r) => acc + r.utilization, 0)
  return sum || 1
})

const slices = computed(() => {
  if (!hasData.value) return []
  const total = totalUtilization.value
  let cumAngle = -Math.PI / 2

  return resourceStats.value.map((r, i) => {
    const fraction = r.utilization / total
    const angle = fraction * Math.PI * 2
    const startAngle = cumAngle
    const endAngle = cumAngle + angle
    cumAngle = endAngle

    const largeArc = angle > Math.PI ? 1 : 0
    const x1 = CENTER + RADIUS * Math.cos(startAngle)
    const y1 = CENTER + RADIUS * Math.sin(startAngle)
    const x2 = CENTER + RADIUS * Math.cos(endAngle)
    const y2 = CENTER + RADIUS * Math.sin(endAngle)
    const ix1 = CENTER + INNER_RADIUS * Math.cos(startAngle)
    const iy1 = CENTER + INNER_RADIUS * Math.sin(startAngle)
    const ix2 = CENTER + INNER_RADIUS * Math.cos(endAngle)
    const iy2 = CENTER + INNER_RADIUS * Math.sin(endAngle)

    const path = [
      `M ${ix1} ${iy1}`,
      `L ${x1} ${y1}`,
      `A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      'Z',
    ].join(' ')

    const midAngle = startAngle + angle / 2
    const labelR = (RADIUS + INNER_RADIUS) / 2
    const labelX = CENTER + labelR * Math.cos(midAngle)
    const labelY = CENTER + labelR * Math.sin(midAngle)

    return {
      path,
      color: PALETTE[i % PALETTE.length],
      resourceName: r.resourceName,
      utilization: r.utilization,
      percentage: (fraction * 100).toFixed(1),
      labelX,
      labelY,
      showLabel: fraction > 0.08,
      busyTime: r.totalBusyTime,
      idleTime: r.totalIdleTime,
      contentionCount: r.contentionCount,
    }
  })
})

const tooltip = ref({ show: false, x: 0, y: 0, lines: [] })

const showTooltip = (event, slice) => {
  const svg = event.target.closest('svg')
  if (!svg) return
  const pt = svg.createSVGPoint()
  pt.x = event.clientX
  pt.y = event.clientY
  const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse())

  tooltip.value = {
    show: true,
    x: svgPt.x,
    y: svgPt.y - 10,
    lines: [
      slice.resourceName,
      `Utilization: ${(slice.utilization * 100).toFixed(1)}%`,
      `Busy: ${slice.busyTime.toFixed(1)} / Idle: ${slice.idleTime.toFixed(1)}`,
      `Contention: ${slice.contentionCount}`,
    ],
  }
}

const hideTooltip = () => {
  tooltip.value.show = false
}

const tooltipWidth = computed(() => {
  if (!tooltip.value.lines.length) return 120
  const maxLen = Math.max(...tooltip.value.lines.map(l => l.length))
  return Math.max(120, maxLen * 7 + 16)
})

const tooltipHeight = computed(() => tooltip.value.lines.length * 14 + 12)
</script>

<template>
  <div class="resource-pie-chart">
    <h4>Resource Utilization</h4>

    <div v-if="!hasData" class="empty-state">
      <div class="empty-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
      </div>
      <p>No resource statistics available</p>
      <span>Configure resources and run the simulation to see utilization data.</span>
    </div>

    <div v-else class="chart-layout">
      <div class="chart-wrapper">
        <svg :width="SIZE" :height="SIZE" class="pie-svg">
          <g v-for="(slice, i) in slices" :key="i">
            <path
              :d="slice.path"
              :fill="slice.color"
              class="pie-slice"
              @mouseenter="showTooltip($event, slice)"
              @mouseleave="hideTooltip"
            />
            <text
              v-if="slice.showLabel"
              :x="slice.labelX"
              :y="slice.labelY + 4"
              text-anchor="middle"
              class="slice-label"
            >
              {{ slice.percentage }}%
            </text>
          </g>

          <!-- Center label -->
          <text :x="CENTER" :y="CENTER - 4" text-anchor="middle" class="center-label">
            {{ resourceStats.length }}
          </text>
          <text :x="CENTER" :y="CENTER + 10" text-anchor="middle" class="center-sublabel">
            {{ resourceStats.length === 1 ? 'resource' : 'resources' }}
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
              :class="['tooltip-text', { 'tooltip-title': li === 0 }]"
            >
              {{ line }}
            </text>
          </g>
        </svg>
      </div>

      <!-- Legend -->
      <div class="legend">
        <div v-for="(slice, i) in slices" :key="i" class="legend-item">
          <span class="legend-swatch" :style="{ background: slice.color }"></span>
          <span class="legend-name">{{ slice.resourceName }}</span>
          <span class="legend-pct">{{ (slice.utilization * 100).toFixed(1) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resource-pie-chart {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
}

.resource-pie-chart h4 {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 12px;
  text-align: center;
}

.empty-icon {
  color: var(--color-text-muted);
  opacity: 0.4;
  margin-bottom: 8px;
}

.empty-state p {
  margin: 0 0 4px 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
}

.empty-state span {
  font-size: 10px;
  color: var(--color-text-muted);
  opacity: 0.7;
}

.chart-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.chart-wrapper {
  display: flex;
  justify-content: center;
}

.pie-svg {
  display: block;
}

.pie-slice {
  cursor: pointer;
  transition: opacity 0.15s;
  stroke: var(--color-bg);
  stroke-width: 1.5;
}

.pie-slice:hover {
  opacity: 0.8;
}

.slice-label {
  font-size: 9px;
  fill: white;
  font-weight: 600;
  pointer-events: none;
}

.center-label {
  font-size: 16px;
  font-weight: 700;
  fill: var(--color-text);
}

.center-sublabel {
  font-size: 9px;
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

.tooltip-title {
  font-weight: 600;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  justify-content: center;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
  width: 100%;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-swatch {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-name {
  font-size: 10px;
  color: var(--color-text);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-pct {
  font-size: 10px;
  color: var(--color-text-muted);
  font-weight: 500;
}
</style>
