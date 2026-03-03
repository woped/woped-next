<script setup>
import { ref, computed, reactive, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { usePetriNetStore } from '@/stores/petriNet'
import { buildCoverabilityGraph } from '@/services/analysis/soundnessAnalyzer'

const { t } = useI18n()
const petriNetStore = usePetriNetStore()
const { net } = storeToRefs(petriNetStore)

const graph = ref(null)
const svgContainer = ref(null)
const isBuilding = ref(false)

const NODE_RADIUS = 28
const LAYER_HEIGHT = 150
const NODE_SPACING = 160

const transform = reactive({ x: 0, y: 0, scale: 1 })
const isPanning = ref(false)
const panStart = reactive({ x: 0, y: 0 })

function buildGraph() {
  isBuilding.value = true
  setTimeout(() => {
    const initialMarking = {}
    for (const place of net.value.places) {
      if (place.tokens > 0) {
        initialMarking[place.id] = place.tokens
      }
    }
    graph.value = buildCoverabilityGraph(net.value, initialMarking)
    isBuilding.value = false
    nextTick(() => centerView())
  }, 10)
}

const nodePositions = computed(() => {
  if (!graph.value) return new Map()

  const positions = new Map()
  const depths = new Map()
  const nodes = graph.value.nodes
  const edges = graph.value.edges

  if (nodes.length === 0) return positions

  const initial = nodes.find((n) => n.isInitial) || nodes[0]
  depths.set(initial.id, 0)
  const queue = [initial.id]

  while (queue.length > 0) {
    const cur = queue.shift()
    const curDepth = depths.get(cur)
    for (const e of edges) {
      if (e.from === cur && !depths.has(e.to)) {
        depths.set(e.to, curDepth + 1)
        queue.push(e.to)
      }
    }
  }

  for (const n of nodes) {
    if (!depths.has(n.id)) depths.set(n.id, 0)
  }

  const layers = new Map()
  for (const [nodeId, depth] of depths) {
    if (!layers.has(depth)) layers.set(depth, [])
    layers.get(depth).push(nodeId)
  }

  for (const [depth, ids] of layers) {
    const count = ids.length
    const totalWidth = (count - 1) * NODE_SPACING
    const startX = -totalWidth / 2
    ids.forEach((id, i) => {
      positions.set(id, {
        x: startX + i * NODE_SPACING,
        y: depth * LAYER_HEIGHT,
      })
    })
  }

  return positions
})

const edgeRenderData = computed(() => {
  if (!graph.value) return []

  const positions = nodePositions.value
  const pairCounts = new Map()
  const pairCurrentIdx = new Map()

  for (const e of graph.value.edges) {
    const key = e.from + '|' + e.to
    pairCounts.set(key, (pairCounts.get(key) || 0) + 1)
  }

  const bidirectional = new Set()
  for (const key of pairCounts.keys()) {
    const parts = key.split('|')
    if (pairCounts.has(parts[1] + '|' + parts[0])) {
      bidirectional.add(key)
    }
  }

  const result = []
  for (const edge of graph.value.edges) {
    const fromPos = positions.get(edge.from)
    const toPos = positions.get(edge.to)
    if (!fromPos || !toPos) continue

    const key = edge.from + '|' + edge.to
    const idx = pairCurrentIdx.get(key) || 0
    pairCurrentIdx.set(key, idx + 1)
    const total = pairCounts.get(key) || 1
    const isBidir = bidirectional.has(key)

    if (edge.from === edge.to) {
      const { path, labelPos } = computeSelfLoop(fromPos)
      result.push({ edge, path, labelPos })
    } else {
      let curveOffset = 0
      if (isBidir) curveOffset = 25
      if (total > 1) curveOffset += (idx - (total - 1) / 2) * 30

      const { path, labelPos } = computeEdgePath(fromPos, toPos, curveOffset)
      result.push({ edge, path, labelPos })
    }
  }

  return result
})

function computeSelfLoop(pos) {
  const r = NODE_RADIUS
  const exitAngle = -Math.PI / 3
  const enterAngle = Math.PI / 3
  const sx = pos.x + r * Math.cos(exitAngle)
  const sy = pos.y + r * Math.sin(exitAngle)
  const ex = pos.x + r * Math.cos(enterAngle)
  const ey = pos.y + r * Math.sin(enterAngle)
  const cpOffset = 50
  const cx1 = pos.x + r + cpOffset
  const cy1 = pos.y - cpOffset
  const cx2 = pos.x + r + cpOffset
  const cy2 = pos.y + cpOffset
  return {
    path: `M ${sx} ${sy} C ${cx1} ${cy1} ${cx2} ${cy2} ${ex} ${ey}`,
    labelPos: { x: pos.x + r + cpOffset + 8, y: pos.y },
  }
}

function computeEdgePath(from, to, curveOffset) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dist = Math.sqrt(dx * dx + dy * dy) || 1
  const nx = dx / dist
  const ny = dy / dist
  const px = -ny
  const py = nx

  if (Math.abs(curveOffset) < 1) {
    const sx = from.x + nx * NODE_RADIUS
    const sy = from.y + ny * NODE_RADIUS
    const ex = to.x - nx * NODE_RADIUS
    const ey = to.y - ny * NODE_RADIUS
    return {
      path: `M ${sx} ${sy} L ${ex} ${ey}`,
      labelPos: {
        x: (sx + ex) / 2 + px * 14,
        y: (sy + ey) / 2 + py * 14,
      },
    }
  }

  const midCx = (from.x + to.x) / 2 + px * curveOffset
  const midCy = (from.y + to.y) / 2 + py * curveOffset

  const sdx = midCx - from.x
  const sdy = midCy - from.y
  const sDist = Math.sqrt(sdx * sdx + sdy * sdy) || 1
  const sx = from.x + (sdx / sDist) * NODE_RADIUS
  const sy = from.y + (sdy / sDist) * NODE_RADIUS

  const edx = to.x - midCx
  const edy = to.y - midCy
  const eDist = Math.sqrt(edx * edx + edy * edy) || 1
  const ex = to.x - (edx / eDist) * NODE_RADIUS
  const ey = to.y - (edy / eDist) * NODE_RADIUS

  return {
    path: `M ${sx} ${sy} Q ${midCx} ${midCy} ${ex} ${ey}`,
    labelPos: {
      x: (sx + 2 * midCx + ex) / 4,
      y: (sy + 2 * midCy + ey) / 4,
    },
  }
}

function nodeColor(node) {
  if (node.isInitial) return '#22c55e'
  if (node.isFinal) return '#3b82f6'
  if (node.isDeadlock) return '#ef4444'
  return '#6b7280'
}

function nodeStroke(node) {
  if (node.isInitial) return '#16a34a'
  if (node.isFinal) return '#2563eb'
  if (node.isDeadlock) return '#dc2626'
  return '#4b5563'
}

function formatMarking(marking) {
  const entries = Object.entries(marking)
    .filter(([, v]) => v !== 0)
    .sort(([a], [b]) => a.localeCompare(b))
  if (entries.length === 0) return '∅'
  return entries
    .map(([id, v]) => {
      const place = net.value.places.find((p) => p.id === id)
      const label = place?.name || id
      return `${label}:${v === 'omega' ? 'ω' : v}`
    })
    .join(', ')
}

function onMouseDown(e) {
  if (e.button !== 0) return
  isPanning.value = true
  panStart.x = e.clientX - transform.x
  panStart.y = e.clientY - transform.y
  e.preventDefault()
}

function onMouseMove(e) {
  if (!isPanning.value) return
  transform.x = e.clientX - panStart.x
  transform.y = e.clientY - panStart.y
}

function onMouseUp() {
  isPanning.value = false
}

function onWheel(e) {
  e.preventDefault()
  const container = svgContainer.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  const delta = e.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(0.1, Math.min(5, transform.scale * delta))
  const ratio = newScale / transform.scale

  transform.x = mouseX - (mouseX - transform.x) * ratio
  transform.y = mouseY - (mouseY - transform.y) * ratio
  transform.scale = newScale
}

function centerView() {
  const container = svgContainer.value
  if (!container || !graph.value) {
    transform.x = 0
    transform.y = 0
    transform.scale = 1
    return
  }

  const positions = nodePositions.value
  if (positions.size === 0) return

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const pos of positions.values()) {
    minX = Math.min(minX, pos.x)
    maxX = Math.max(maxX, pos.x)
    minY = Math.min(minY, pos.y)
    maxY = Math.max(maxY, pos.y)
  }

  const pad = NODE_RADIUS + 80
  minX -= pad
  maxX += pad
  minY -= pad
  maxY += pad

  const graphW = maxX - minX
  const graphH = maxY - minY
  const containerW = container.clientWidth
  const containerH = container.clientHeight

  const scaleX = containerW / graphW
  const scaleY = containerH / graphH
  const scale = Math.min(scaleX, scaleY, 1.5)

  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  transform.scale = scale
  transform.x = containerW / 2 - centerX * scale
  transform.y = containerH / 2 - centerY * scale
}

function resetView() {
  centerView()
}

const transformStr = computed(
  () => `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`
)

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})
</script>

<template>
  <div class="cg-container">
    <div class="cg-toolbar">
      <button class="cg-btn cg-btn-primary" :disabled="isBuilding" @click="buildGraph">
        {{ isBuilding ? 'Building...' : 'Build Graph' }}
      </button>
      <button v-if="graph" class="cg-btn" @click="resetView">Reset View</button>
    </div>

    <div v-if="graph" class="cg-summary">
      <span class="cg-tag">States: {{ graph.nodes.length }}</span>
      <span class="cg-tag" :class="graph.bounded ? 'cg-tag-ok' : 'cg-tag-warn'">
        {{ graph.bounded ? 'Bounded' : 'Unbounded' }}
      </span>
      <span
        class="cg-tag"
        :class="graph.deadlockNodes.length > 0 ? 'cg-tag-err' : 'cg-tag-ok'"
      >
        Deadlocks: {{ graph.deadlockNodes.length }}
      </span>
      <span class="cg-tag">Final states: {{ graph.reachableFinalStates }}</span>
    </div>

    <div v-if="graph" class="cg-legend">
      <span class="cg-legend-item">
        <span class="cg-dot cg-dot-initial" /> Initial
      </span>
      <span class="cg-legend-item">
        <span class="cg-dot cg-dot-final" /> Final
      </span>
      <span class="cg-legend-item">
        <span class="cg-dot cg-dot-deadlock" /> Deadlock
      </span>
      <span class="cg-legend-item">
        <span class="cg-dot cg-dot-other" /> Other
      </span>
    </div>

    <div
      v-if="graph"
      ref="svgContainer"
      class="cg-viewport"
      :class="{ 'cg-grabbing': isPanning }"
      @mousedown="onMouseDown"
      @wheel.prevent="onWheel"
    >
      <svg width="100%" height="100%">
        <defs>
          <marker
            id="cg-arrowhead"
            viewBox="0 0 10 8"
            refX="10"
            refY="4"
            markerWidth="10"
            markerHeight="8"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M 0 0 L 10 4 L 0 8 z" fill="var(--color-text-muted)" />
          </marker>
        </defs>

        <g :transform="transformStr">
          <g v-for="(ed, i) in edgeRenderData" :key="'edge-' + i">
            <path
              :d="ed.path"
              fill="none"
              stroke="var(--color-text-muted)"
              stroke-width="1.5"
              marker-end="url(#cg-arrowhead)"
            />
            <text
              :x="ed.labelPos.x"
              :y="ed.labelPos.y"
              text-anchor="middle"
              dominant-baseline="middle"
              class="cg-edge-label"
            >
              {{ ed.edge.transitionName }}
            </text>
          </g>

          <g v-for="node in graph.nodes" :key="node.id">
            <circle
              :cx="nodePositions.get(node.id)?.x"
              :cy="nodePositions.get(node.id)?.y"
              :r="NODE_RADIUS"
              :fill="nodeColor(node)"
              fill-opacity="0.15"
              :stroke="nodeStroke(node)"
              stroke-width="2.5"
            />
            <text
              :x="nodePositions.get(node.id)?.x"
              :y="nodePositions.get(node.id)?.y"
              text-anchor="middle"
              dominant-baseline="central"
              class="cg-node-id"
            >
              {{ node.id }}
            </text>
            <text
              :x="nodePositions.get(node.id)?.x"
              :y="(nodePositions.get(node.id)?.y ?? 0) + NODE_RADIUS + 14"
              text-anchor="middle"
              dominant-baseline="hanging"
              class="cg-node-marking"
            >
              {{ formatMarking(node.marking) }}
            </text>
          </g>
        </g>
      </svg>
    </div>

    <div v-if="!graph" class="cg-empty">
      Click "Build Graph" to generate the coverability / reachability graph from the current net.
    </div>
  </div>
</template>

<style scoped>
.cg-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cg-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.cg-btn {
  padding: 4px 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 12px;
  color: var(--color-text);
  cursor: pointer;
}

.cg-btn:hover {
  background: var(--color-bg-secondary);
}

.cg-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cg-btn-primary {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.cg-btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.cg-summary {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.cg-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  background: var(--color-bg);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.cg-tag-ok {
  background: #dcfce7;
  color: #166534;
  border-color: #bbf7d0;
}

.cg-tag-warn {
  background: #fffbeb;
  color: #92400e;
  border-color: #fde68a;
}

.cg-tag-err {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fecaca;
}

:global(.dark) .cg-tag-ok {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border-color: rgba(34, 197, 94, 0.3);
}

:global(.dark) .cg-tag-warn {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.3);
}

:global(.dark) .cg-tag-err {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.3);
}

.cg-legend {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--color-text-muted);
}

.cg-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cg-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  border: 1.5px solid;
}

.cg-dot-initial {
  background: rgba(34, 197, 94, 0.15);
  border-color: #16a34a;
}

.cg-dot-final {
  background: rgba(59, 130, 246, 0.15);
  border-color: #2563eb;
}

.cg-dot-deadlock {
  background: rgba(239, 68, 68, 0.15);
  border-color: #dc2626;
}

.cg-dot-other {
  background: rgba(107, 114, 128, 0.15);
  border-color: #4b5563;
}

.cg-viewport {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  height: 380px;
  cursor: grab;
  user-select: none;
}

.cg-viewport.cg-grabbing {
  cursor: grabbing;
}

.cg-viewport svg {
  display: block;
}

.cg-node-id {
  font-size: 11px;
  font-weight: 600;
  fill: var(--color-text);
  pointer-events: none;
}

.cg-node-marking {
  font-size: 9px;
  fill: var(--color-text-muted);
  pointer-events: none;
}

.cg-edge-label {
  font-size: 9px;
  fill: var(--color-text-muted);
  pointer-events: none;
}

.cg-empty {
  padding: 32px 16px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 13px;
  border: 1px dashed var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
}
</style>
