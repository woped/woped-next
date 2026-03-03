<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSimulationStore } from '@/stores/simulation'

const simulationStore = useSimulationStore()
const { result, config } = storeToRefs(simulationStore)

const chartWidth = 320
const chartHeight = 180
const padding = { top: 20, right: 20, bottom: 40, left: 50 }
const innerW = chartWidth - padding.left - padding.right
const innerH = chartHeight - padding.top - padding.bottom

const bucketCount = 20

const dataPoints = computed(() => {
  if (!result.value) return []

  const completedCases = result.value.cases.filter(c => c.completed)
  if (completedCases.length === 0) return []

  const times = completedCases.map(c => c.endTime).sort((a, b) => a - b)
  const minT = times[0]
  const maxT = times[times.length - 1]
  const range = maxT - minT || 1
  const bucketSize = range / bucketCount

  const points = []
  for (let i = 0; i < bucketCount; i++) {
    const bucketStart = minT + i * bucketSize
    const bucketEnd = bucketStart + bucketSize
    const count = times.filter(t => t >= bucketStart && t < bucketEnd).length
    const throughput = count / bucketSize
    points.push({
      time: bucketStart + bucketSize / 2,
      throughput,
      label: `${bucketStart.toFixed(0)}-${bucketEnd.toFixed(0)}`,
    })
  }
  return points
})

const maxThroughput = computed(() => {
  if (dataPoints.value.length === 0) return 1
  return Math.max(...dataPoints.value.map(p => p.throughput), 0.01)
})

const minTime = computed(() => {
  if (dataPoints.value.length === 0) return 0
  return dataPoints.value[0].time
})

const maxTime = computed(() => {
  if (dataPoints.value.length === 0) return 1
  return dataPoints.value[dataPoints.value.length - 1].time
})

const timeRange = computed(() => maxTime.value - minTime.value || 1)

const scaleX = (t) => padding.left + ((t - minTime.value) / timeRange.value) * innerW
const scaleY = (v) => padding.top + innerH - (v / maxThroughput.value) * innerH

const linePath = computed(() => {
  if (dataPoints.value.length === 0) return ''
  return dataPoints.value
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.time).toFixed(1)} ${scaleY(p.throughput).toFixed(1)}`)
    .join(' ')
})

const areaPath = computed(() => {
  if (dataPoints.value.length === 0) return ''
  const bottom = padding.top + innerH
  const pts = dataPoints.value
  return [
    `M ${scaleX(pts[0].time).toFixed(1)} ${bottom}`,
    ...pts.map(p => `L ${scaleX(p.time).toFixed(1)} ${scaleY(p.throughput).toFixed(1)}`),
    `L ${scaleX(pts[pts.length - 1].time).toFixed(1)} ${bottom}`,
    'Z',
  ].join(' ')
})

const yTicks = computed(() => {
  const max = maxThroughput.value
  const step = max / 4
  return [0, step, step * 2, step * 3, max].map(v => ({
    value: v,
    label: v.toFixed(2),
    y: scaleY(v),
  }))
})

const xTicks = computed(() => {
  if (dataPoints.value.length === 0) return []
  const step = timeRange.value / 4
  return [0, 1, 2, 3, 4].map(i => {
    const t = minTime.value + i * step
    return { value: t, label: t.toFixed(0), x: scaleX(t) }
  })
})

const tooltip = ref({ show: false, x: 0, y: 0, content: '' })

const showTooltip = (event, point) => {
  const svg = event.target.closest('svg')
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  const clientRect = event.target.getBoundingClientRect()
  tooltip.value = {
    show: true,
    x: clientRect.left - rect.left + clientRect.width / 2,
    y: clientRect.top - rect.top - 8,
    content: `${point.label}: ${point.throughput.toFixed(3)} cases/${config.value.timeUnit}`,
  }
}

const hideTooltip = () => { tooltip.value.show = false }
</script>

<template>
  <div class="throughput-chart">
    <div class="chart-title">Throughput over Time</div>

    <div v-if="dataPoints.length === 0" class="empty-state">
      No completed cases to display
    </div>

    <svg v-else :width="chartWidth" :height="chartHeight" class="chart">
      <!-- Grid lines -->
      <line
        v-for="tick in yTicks"
        :key="'yg' + tick.value"
        :x1="padding.left"
        :y1="tick.y"
        :x2="chartWidth - padding.right"
        :y2="tick.y"
        class="grid-line"
      />

      <!-- Y-axis -->
      <line
        :x1="padding.left"
        :y1="padding.top"
        :x2="padding.left"
        :y2="padding.top + innerH"
        class="axis-line"
      />
      <text
        v-for="tick in yTicks"
        :key="'yl' + tick.value"
        :x="padding.left - 6"
        :y="tick.y + 3"
        text-anchor="end"
        class="tick-label"
      >
        {{ tick.label }}
      </text>

      <!-- X-axis -->
      <line
        :x1="padding.left"
        :y1="padding.top + innerH"
        :x2="chartWidth - padding.right"
        :y2="padding.top + innerH"
        class="axis-line"
      />
      <text
        v-for="tick in xTicks"
        :key="'xl' + tick.value"
        :x="tick.x"
        :y="padding.top + innerH + 16"
        text-anchor="middle"
        class="tick-label"
      >
        {{ tick.label }}
      </text>
      <text
        :x="padding.left + innerW / 2"
        :y="chartHeight - 4"
        text-anchor="middle"
        class="axis-label"
      >
        Time ({{ config.timeUnit }})
      </text>

      <!-- Area fill -->
      <path :d="areaPath" class="area-fill" />

      <!-- Line -->
      <path :d="linePath" class="line-path" />

      <!-- Data points -->
      <circle
        v-for="(point, i) in dataPoints"
        :key="i"
        :cx="scaleX(point.time)"
        :cy="scaleY(point.throughput)"
        r="3"
        class="data-point"
        @mouseenter="showTooltip($event, point)"
        @mouseleave="hideTooltip"
      />

      <!-- Tooltip -->
      <g v-if="tooltip.show" class="tooltip-group">
        <rect
          :x="tooltip.x - 70"
          :y="tooltip.y - 24"
          width="140"
          height="20"
          rx="4"
          class="tooltip-bg"
        />
        <text
          :x="tooltip.x"
          :y="tooltip.y - 10"
          text-anchor="middle"
          class="tooltip-text"
        >
          {{ tooltip.content }}
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.throughput-chart {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
}

.chart-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: var(--color-text-muted);
  font-size: 12px;
}

.chart {
  display: block;
}

.axis-line {
  stroke: var(--color-border);
  stroke-width: 1;
}

.grid-line {
  stroke: var(--color-border);
  stroke-width: 0.5;
  stroke-dasharray: 2, 2;
  opacity: 0.5;
}

.tick-label {
  font-size: 9px;
  fill: var(--color-text-muted);
}

.axis-label {
  font-size: 10px;
  fill: var(--color-text-muted);
}

.area-fill {
  fill: var(--color-primary);
  opacity: 0.1;
}

.line-path {
  fill: none;
  stroke: var(--color-primary);
  stroke-width: 2;
  stroke-linejoin: round;
}

.data-point {
  fill: var(--color-primary);
  cursor: pointer;
  transition: r 0.15s;
}

.data-point:hover {
  r: 5;
}

.tooltip-bg {
  fill: var(--color-bg-secondary);
  stroke: var(--color-border);
  stroke-width: 1;
}

.tooltip-text {
  font-size: 10px;
  fill: var(--color-text);
}
</style>
