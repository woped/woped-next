<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { usePetriNetStore } from '@/stores/petriNet'
import { useViewport } from '@/composables/useViewport'
import { VISUAL } from '@/types/petri-net'

const { t } = useI18n()

const props = defineProps({
  canvasWidth: {
    type: Number,
    default: 800,
  },
  canvasHeight: {
    type: Number,
    default: 600,
  },
})

const store = usePetriNetStore()
const { places, transitions, operators, arcs, viewport } = storeToRefs(store)
const subProcesses = computed(() => store.subProcesses)
const { elementBounds, screenToWorld } = useViewport()

// Canvas ref
const canvasRef = ref(null)
const ctx = ref(null)

// Overview dimensions
const OVERVIEW_WIDTH = 200
const OVERVIEW_HEIGHT = 150

// Calculate scale to fit all elements in overview
const overviewScale = computed(() => {
  if (!elementBounds.value) return 0.1
  
  const scaleX = (OVERVIEW_WIDTH - 20) / elementBounds.value.width
  const scaleY = (OVERVIEW_HEIGHT - 20) / elementBounds.value.height
  return Math.min(scaleX, scaleY, 0.5)
})

// Calculate offset to center the view
const overviewOffset = computed(() => {
  if (!elementBounds.value) return { x: 10, y: 10 }
  
  const scaledWidth = elementBounds.value.width * overviewScale.value
  const scaledHeight = elementBounds.value.height * overviewScale.value
  
  return {
    x: (OVERVIEW_WIDTH - scaledWidth) / 2 - elementBounds.value.minX * overviewScale.value,
    y: (OVERVIEW_HEIGHT - scaledHeight) / 2 - elementBounds.value.minY * overviewScale.value,
  }
})

// Viewport rectangle in overview coordinates
const viewportRect = computed(() => {
  const scale = overviewScale.value
  const offset = overviewOffset.value
  
  // World coordinates of visible area
  const worldTopLeft = screenToWorld({ x: 0, y: 0 })
  const worldBottomRight = screenToWorld({ x: props.canvasWidth, y: props.canvasHeight })
  
  return {
    x: worldTopLeft.x * scale + offset.x,
    y: worldTopLeft.y * scale + offset.y,
    width: (worldBottomRight.x - worldTopLeft.x) * scale,
    height: (worldBottomRight.y - worldTopLeft.y) * scale,
  }
})

// Draw the overview
function draw() {
  if (!canvasRef.value || !ctx.value) return
  
  const context = ctx.value
  const scale = overviewScale.value
  const offset = overviewOffset.value
  
  // Clear
  context.clearRect(0, 0, OVERVIEW_WIDTH, OVERVIEW_HEIGHT)
  
  // Background
  context.fillStyle = '#fafafa'
  context.fillRect(0, 0, OVERVIEW_WIDTH, OVERVIEW_HEIGHT)
  
  // All positionable elements for arc lookups
  const allElements = [...places.value, ...transitions.value, ...operators.value, ...subProcesses.value]

  // Draw arcs
  context.strokeStyle = '#999'
  context.lineWidth = 1
  for (const arc of arcs.value) {
    const source = allElements.find((el) => el.id === arc.sourceId)
    const target = allElements.find((el) => el.id === arc.targetId)
    
    if (source && target) {
      context.beginPath()
      context.moveTo(
        source.position.x * scale + offset.x,
        source.position.y * scale + offset.y
      )
      context.lineTo(
        target.position.x * scale + offset.x,
        target.position.y * scale + offset.y
      )
      context.stroke()
    }
  }
  
  // Draw places (circles)
  context.fillStyle = 'white'
  context.strokeStyle = '#333'
  context.lineWidth = 1
  for (const place of places.value) {
    const x = place.position.x * scale + offset.x
    const y = place.position.y * scale + offset.y
    const r = Math.max(VISUAL.place.radius * scale, 3)
    
    context.beginPath()
    context.arc(x, y, r, 0, Math.PI * 2)
    context.fill()
    context.stroke()
    
    // Draw tokens as dot
    if (place.tokens > 0) {
      context.fillStyle = '#333'
      context.beginPath()
      context.arc(x, y, r * 0.5, 0, Math.PI * 2)
      context.fill()
      context.fillStyle = 'white'
    }
  }
  
  // Draw transitions (rectangles)
  context.fillStyle = 'white'
  context.strokeStyle = '#333'
  for (const trans of transitions.value) {
    const x = trans.position.x * scale + offset.x
    const y = trans.position.y * scale + offset.y
    const w = Math.max(VISUAL.transition.width * scale, 4)
    const h = Math.max(VISUAL.transition.height * scale, 3)
    
    context.fillRect(x - w / 2, y - h / 2, w, h)
    context.strokeRect(x - w / 2, y - h / 2, w, h)
  }
  
  // Draw operators (diamonds)
  context.fillStyle = '#e8f5e9'
  context.strokeStyle = '#4CAF50'
  for (const op of operators.value) {
    const x = op.position.x * scale + offset.x
    const y = op.position.y * scale + offset.y
    const s = Math.max(VISUAL.operator.size * scale * 0.5, 3)
    
    context.beginPath()
    context.moveTo(x, y - s)
    context.lineTo(x + s, y)
    context.lineTo(x, y + s)
    context.lineTo(x - s, y)
    context.closePath()
    context.fill()
    context.stroke()
  }
  
  // Draw subprocesses (double-border rectangles)
  context.fillStyle = '#eff6ff'
  context.strokeStyle = '#3b82f6'
  for (const sp of subProcesses.value) {
    const x = sp.position.x * scale + offset.x
    const y = sp.position.y * scale + offset.y
    const w = Math.max(VISUAL.subprocess.width * scale, 6)
    const h = Math.max(VISUAL.subprocess.height * scale, 4)
    
    context.fillRect(x - w / 2, y - h / 2, w, h)
    context.strokeRect(x - w / 2, y - h / 2, w, h)
    context.strokeRect(x - w / 2 + 2, y - h / 2 + 2, w - 4, h - 4)
  }
  
  // Draw viewport rectangle
  const vp = viewportRect.value
  context.strokeStyle = '#3b82f6'
  context.lineWidth = 2
  context.setLineDash([4, 2])
  context.strokeRect(vp.x, vp.y, vp.width, vp.height)
  context.setLineDash([])
  
  // Semi-transparent fill
  context.fillStyle = 'rgba(59, 130, 246, 0.1)'
  context.fillRect(vp.x, vp.y, vp.width, vp.height)
}

// Handle click to navigate
const isDragging = ref(false)

function handleMouseDown(e) {
  isDragging.value = true
  navigateToPosition(e)
}

function handleMouseMove(e) {
  if (isDragging.value) {
    navigateToPosition(e)
  }
}

function handleMouseUp() {
  isDragging.value = false
}

function navigateToPosition(e) {
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  const scale = overviewScale.value
  const offset = overviewOffset.value
  
  // Convert to world coordinates
  const worldX = (x - offset.x) / scale
  const worldY = (y - offset.y) / scale
  
  // Center viewport on this position
  const newX = props.canvasWidth / 2 - worldX * viewport.value.scale
  const newY = props.canvasHeight / 2 - worldY * viewport.value.scale
  
  store.setViewport({ x: newX, y: newY })
}

// Initialize canvas
onMounted(() => {
  if (canvasRef.value) {
    ctx.value = canvasRef.value.getContext('2d')
    draw()
  }
})

// Redraw when data changes
watch(
  [places, transitions, operators, subProcesses, arcs, viewport],
  () => {
    draw()
  },
  { deep: true }
)

// Also redraw on canvas size change
watch(
  () => [props.canvasWidth, props.canvasHeight],
  () => {
    draw()
  }
)
</script>

<template>
  <div class="overview-panel">
    <div class="overview-header">
      <span>{{ $t('overview.title') }}</span>
    </div>
    <canvas
      ref="canvasRef"
      :width="OVERVIEW_WIDTH"
      :height="OVERVIEW_HEIGHT"
      :class="['overview-canvas', { dragging: isDragging }]"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    />
  </div>
</template>

<style scoped>
.overview-panel {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.overview-header {
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.overview-canvas {
  display: block;
  cursor: grab;
}

.overview-canvas:active {
  cursor: grabbing;
}

.overview-canvas.dragging {
  cursor: grabbing;
}
</style>
