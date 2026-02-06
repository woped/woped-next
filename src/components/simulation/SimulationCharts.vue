<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useSimulationStore } from '@/stores/simulation'

const { t } = useI18n()
const simulationStore = useSimulationStore()
const { result, config } = storeToRefs(simulationStore)

// Active chart tab
const activeChart = ref('utilization')

// Chart dimensions
const chartWidth = 280
const chartHeight = 160
const chartPadding = { top: 20, right: 20, bottom: 40, left: 40 }

// Get stats
const stats = computed(() => result.value?.statistics)

// Utilization chart data
const utilizationData = computed(() => {
  if (!stats.value) return []
  return stats.value.activityStats
    .map(a => ({
      name: a.transitionName.length > 12 
        ? a.transitionName.substring(0, 10) + '...'
        : a.transitionName,
      fullName: a.transitionName,
      value: Math.min(a.utilization, 1), // Cap at 100%
    }))
    .slice(0, 8) // Limit to 8 items
})

// Cycle time histogram data (buckets)
const cycleTimeHistogram = computed(() => {
  if (!result.value) return []
  
  const cycleTimes = result.value.cases
    .filter(c => c.completed)
    .map(c => c.completionTime - c.arrivalTime)
  
  if (cycleTimes.length === 0) return []
  
  const min = Math.min(...cycleTimes)
  const max = Math.max(...cycleTimes)
  const range = max - min || 1
  const bucketCount = 8
  const bucketSize = range / bucketCount
  
  const buckets = Array(bucketCount).fill(0).map((_, i) => ({
    min: min + i * bucketSize,
    max: min + (i + 1) * bucketSize,
    count: 0,
    label: `${(min + i * bucketSize).toFixed(1)}`,
  }))
  
  for (const time of cycleTimes) {
    const bucketIndex = Math.min(
      Math.floor((time - min) / bucketSize),
      bucketCount - 1
    )
    buckets[bucketIndex].count++
  }
  
  return buckets
})

// Activity count chart data
const activityCountData = computed(() => {
  if (!stats.value) return []
  return stats.value.activityStats
    .map(a => ({
      name: a.transitionName.length > 12 
        ? a.transitionName.substring(0, 10) + '...'
        : a.transitionName,
      fullName: a.transitionName,
      value: a.count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
})

// Calculate bar chart positions
const getBarChartLayout = (data, maxValue = null) => {
  if (!data.length) return { bars: [], maxVal: 0 }
  
  const innerWidth = chartWidth - chartPadding.left - chartPadding.right
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom
  const barWidth = (innerWidth / data.length) * 0.7
  const gap = (innerWidth / data.length) * 0.3
  
  const max = maxValue || Math.max(...data.map(d => d.value), 0.01)
  
  const bars = data.map((d, i) => ({
    x: chartPadding.left + i * (barWidth + gap) + gap / 2,
    y: chartPadding.top + innerHeight - (d.value / max) * innerHeight,
    width: barWidth,
    height: (d.value / max) * innerHeight,
    ...d,
  }))
  
  return { bars, maxVal: max }
}

// Utilization chart layout
const utilizationLayout = computed(() => getBarChartLayout(utilizationData.value, 1))

// Histogram layout  
const histogramLayout = computed(() => {
  const data = cycleTimeHistogram.value.map(b => ({
    name: b.label,
    value: b.count,
  }))
  return getBarChartLayout(data)
})

// Activity count layout
const activityCountLayout = computed(() => getBarChartLayout(activityCountData.value))

// Y-axis ticks for utilization (0%, 50%, 100%)
const utilizationYTicks = [0, 0.5, 1].map(v => ({
  value: v,
  label: `${(v * 100).toFixed(0)}%`,
  y: chartPadding.top + (chartHeight - chartPadding.top - chartPadding.bottom) * (1 - v),
}))

// Y-axis ticks for histogram
const histogramYTicks = computed(() => {
  const max = histogramLayout.value.maxVal
  if (max === 0) return []
  const step = Math.ceil(max / 4)
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom
  return [0, step, step * 2, step * 3, max].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 5).map(v => ({
    value: v,
    label: v.toString(),
    y: chartPadding.top + innerHeight * (1 - v / max),
  }))
})

// Y-axis ticks for activity count
const activityCountYTicks = computed(() => {
  const max = activityCountLayout.value.maxVal
  if (max === 0) return []
  const step = Math.ceil(max / 4)
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom
  return [0, step, step * 2, step * 3, max].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 5).map(v => ({
    value: v,
    label: v.toString(),
    y: chartPadding.top + innerHeight * (1 - v / max),
  }))
})

// Chart tabs
const chartTabs = [
  { id: 'utilization', label: 'Utilization' },
  { id: 'histogram', label: 'Cycle Times' },
  { id: 'activity', label: 'Activity Count' },
]

// Tooltip state
const tooltip = ref({ show: false, x: 0, y: 0, content: '' })

const showTooltip = (event, content) => {
  const rect = event.target.getBoundingClientRect()
  const parentRect = event.target.closest('svg').getBoundingClientRect()
  tooltip.value = {
    show: true,
    x: rect.left - parentRect.left + rect.width / 2,
    y: rect.top - parentRect.top - 8,
    content,
  }
}

const hideTooltip = () => {
  tooltip.value.show = false
}
</script>

<template>
  <div class="simulation-charts" v-if="stats">
    <!-- Chart Tabs -->
    <div class="chart-tabs">
      <button
        v-for="tab in chartTabs"
        :key="tab.id"
        :class="['tab-btn', { active: activeChart === tab.id }]"
        @click="activeChart = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Utilization Chart -->
    <div v-if="activeChart === 'utilization'" class="chart-container">
      <svg :width="chartWidth" :height="chartHeight" class="chart">
        <!-- Y-axis -->
        <line
          :x1="chartPadding.left"
          :y1="chartPadding.top"
          :x2="chartPadding.left"
          :y2="chartHeight - chartPadding.bottom"
          class="axis-line"
        />
        <!-- Y-axis ticks -->
        <g v-for="tick in utilizationYTicks" :key="tick.value">
          <line
            :x1="chartPadding.left - 4"
            :y1="tick.y"
            :x2="chartPadding.left"
            :y2="tick.y"
            class="tick-line"
          />
          <text
            :x="chartPadding.left - 8"
            :y="tick.y + 4"
            text-anchor="end"
            class="tick-label"
          >
            {{ tick.label }}
          </text>
          <line
            :x1="chartPadding.left"
            :y1="tick.y"
            :x2="chartWidth - chartPadding.right"
            :y2="tick.y"
            class="grid-line"
          />
        </g>
        <!-- Bars -->
        <g v-for="(bar, i) in utilizationLayout.bars" :key="i">
          <rect
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="Math.max(bar.height, 1)"
            class="bar utilization-bar"
            @mouseenter="showTooltip($event, `${bar.fullName}: ${(bar.value * 100).toFixed(1)}%`)"
            @mouseleave="hideTooltip"
          />
          <text
            :x="bar.x + bar.width / 2"
            :y="chartHeight - chartPadding.bottom + 16"
            text-anchor="middle"
            class="bar-label"
            :transform="`rotate(-45, ${bar.x + bar.width / 2}, ${chartHeight - chartPadding.bottom + 16})`"
          >
            {{ bar.name }}
          </text>
        </g>
        <!-- Tooltip -->
        <g v-if="tooltip.show" class="tooltip-group">
          <rect
            :x="tooltip.x - 60"
            :y="tooltip.y - 24"
            width="120"
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

    <!-- Cycle Time Histogram -->
    <div v-if="activeChart === 'histogram'" class="chart-container">
      <svg :width="chartWidth" :height="chartHeight" class="chart">
        <!-- Y-axis -->
        <line
          :x1="chartPadding.left"
          :y1="chartPadding.top"
          :x2="chartPadding.left"
          :y2="chartHeight - chartPadding.bottom"
          class="axis-line"
        />
        <!-- Y-axis ticks -->
        <g v-for="tick in histogramYTicks" :key="tick.value">
          <line
            :x1="chartPadding.left - 4"
            :y1="tick.y"
            :x2="chartPadding.left"
            :y2="tick.y"
            class="tick-line"
          />
          <text
            :x="chartPadding.left - 8"
            :y="tick.y + 4"
            text-anchor="end"
            class="tick-label"
          >
            {{ tick.label }}
          </text>
          <line
            :x1="chartPadding.left"
            :y1="tick.y"
            :x2="chartWidth - chartPadding.right"
            :y2="tick.y"
            class="grid-line"
          />
        </g>
        <!-- Bars -->
        <g v-for="(bar, i) in histogramLayout.bars" :key="i">
          <rect
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="Math.max(bar.height, 1)"
            class="bar histogram-bar"
            @mouseenter="showTooltip($event, `${bar.value} cases`)"
            @mouseleave="hideTooltip"
          />
          <text
            v-if="i % 2 === 0"
            :x="bar.x + bar.width / 2"
            :y="chartHeight - chartPadding.bottom + 12"
            text-anchor="middle"
            class="bar-label"
          >
            {{ bar.name }}
          </text>
        </g>
        <!-- Tooltip -->
        <g v-if="tooltip.show" class="tooltip-group">
          <rect
            :x="tooltip.x - 40"
            :y="tooltip.y - 24"
            width="80"
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
      <div class="chart-footer">
        <span>{{ $t('simulation.cycleTimeDetails') }} ({{ config.timeUnit }})</span>
      </div>
    </div>

    <!-- Activity Count Chart -->
    <div v-if="activeChart === 'activity'" class="chart-container">
      <svg :width="chartWidth" :height="chartHeight" class="chart">
        <!-- Y-axis -->
        <line
          :x1="chartPadding.left"
          :y1="chartPadding.top"
          :x2="chartPadding.left"
          :y2="chartHeight - chartPadding.bottom"
          class="axis-line"
        />
        <!-- Y-axis ticks -->
        <g v-for="tick in activityCountYTicks" :key="tick.value">
          <line
            :x1="chartPadding.left - 4"
            :y1="tick.y"
            :x2="chartPadding.left"
            :y2="tick.y"
            class="tick-line"
          />
          <text
            :x="chartPadding.left - 8"
            :y="tick.y + 4"
            text-anchor="end"
            class="tick-label"
          >
            {{ tick.label }}
          </text>
          <line
            :x1="chartPadding.left"
            :y1="tick.y"
            :x2="chartWidth - chartPadding.right"
            :y2="tick.y"
            class="grid-line"
          />
        </g>
        <!-- Bars -->
        <g v-for="(bar, i) in activityCountLayout.bars" :key="i">
          <rect
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="Math.max(bar.height, 1)"
            class="bar activity-bar"
            @mouseenter="showTooltip($event, `${bar.fullName}: ${bar.value}`)"
            @mouseleave="hideTooltip"
          />
          <text
            :x="bar.x + bar.width / 2"
            :y="chartHeight - chartPadding.bottom + 16"
            text-anchor="middle"
            class="bar-label"
            :transform="`rotate(-45, ${bar.x + bar.width / 2}, ${chartHeight - chartPadding.bottom + 16})`"
          >
            {{ bar.name }}
          </text>
        </g>
        <!-- Tooltip -->
        <g v-if="tooltip.show" class="tooltip-group">
          <rect
            :x="tooltip.x - 60"
            :y="tooltip.y - 24"
            width="120"
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
  </div>
</template>

<style scoped>
.simulation-charts {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.chart-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.tab-btn {
  flex: 1;
  padding: 6px 8px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 11px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.tab-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}

.tab-btn.active {
  background: var(--color-primary);
  color: white;
}

.chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chart {
  display: block;
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

.grid-line {
  stroke: var(--color-border);
  stroke-width: 0.5;
  stroke-dasharray: 2, 2;
  opacity: 0.5;
}

.bar {
  cursor: pointer;
  transition: opacity 0.15s;
}

.bar:hover {
  opacity: 0.8;
}

.utilization-bar {
  fill: var(--color-primary);
}

.histogram-bar {
  fill: #22c55e;
}

.activity-bar {
  fill: #f97316;
}

.bar-label {
  font-size: 8px;
  fill: var(--color-text-muted);
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

.chart-footer {
  font-size: 10px;
  color: var(--color-text-muted);
  margin-top: 4px;
}
</style>
