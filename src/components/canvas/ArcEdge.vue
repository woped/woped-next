<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePetriNetStore } from '@/stores/petriNet'
import { useConfigStore } from '@/stores/config'
import { VISUAL } from '@/types/petri-net'
import { calculateArcEndpoints, calculateArrowHead, angle } from '@/utils/geometry'
import { orthogonalRoute, bezierRoute, sampleBezierCurve, pointsToArray } from '@/utils/routing'

const props = defineProps({
  arc: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
  isTemp: {
    type: Boolean,
    default: false,
  },
  tempEnd: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['click', 'dblclick'])

const store = usePetriNetStore()
const configStore = useConfigStore()

// Theme colors
const colors = computed(() => {
  const dark = configStore.isDarkMode
  return {
    stroke: dark ? '#9ca3af' : '#374151',
    tempStroke: dark ? '#6b7280' : '#9ca3af',
    selectedStroke: '#3b82f6',
    labelFill: dark ? '#e5e7eb' : '#374151',
  }
})
const { places, transitions, operators, subProcesses } = storeToRefs(store)

const { operatorNotation } = storeToRefs(configStore)

// Get routing mode (default to 'direct')
const routingMode = computed(() => props.arc.routingMode || 'direct')

// Get source element position and type
const sourceElement = computed(() => {
  const place = places.value.find((p) => p.id === props.arc.sourceId)
  if (place) return { position: place.position, type: 'place' }

  const transition = transitions.value.find((t) => t.id === props.arc.sourceId)
  if (transition) return { position: transition.position, type: 'transition' }

  // Operators behave like transitions for arc connections
  const operator = operators.value.find((o) => o.id === props.arc.sourceId)
  if (operator) return { position: operator.position, type: 'transition' }

  // Subprocesses behave like transitions for arc connections
  const subprocess = subProcesses.value.find((s) => s.id === props.arc.sourceId)
  if (subprocess) return { position: subprocess.position, type: 'subprocess' }

  return null
})

// Get target element position and type
const targetElement = computed(() => {
  if (props.isTemp && props.tempEnd) {
    return { position: props.tempEnd, type: null }
  }

  const place = places.value.find((p) => p.id === props.arc.targetId)
  if (place) return { position: place.position, type: 'place' }

  const transition = transitions.value.find((t) => t.id === props.arc.targetId)
  if (transition) return { position: transition.position, type: 'transition' }

  // Operators behave like transitions for arc connections
  const operator = operators.value.find((o) => o.id === props.arc.targetId)
  if (operator) return { position: operator.position, type: 'transition' }

  // Subprocesses behave like transitions for arc connections
  const subprocess = subProcesses.value.find((s) => s.id === props.arc.targetId)
  if (subprocess) return { position: subprocess.position, type: 'subprocess' }

  return null
})

// Calculate endpoints on element borders
const endpoints = computed(() => {
  if (!sourceElement.value || !targetElement.value) {
    return null
  }

  const sourcePos = sourceElement.value.position
  const targetPos = targetElement.value.position

  if (props.isTemp || !targetElement.value.type) {
    // For temp arc, draw directly to mouse position
    const result = calculateArcEndpoints(
      sourcePos,
      targetPos,
      sourceElement.value.type,
      sourceElement.value.type === 'place' ? 'transition' : 'place',
      operatorNotation.value
    )
    return {
      start: result.start,
      end: targetPos,
    }
  }

  return calculateArcEndpoints(
    sourcePos,
    targetPos,
    sourceElement.value.type,
    targetElement.value.type,
    operatorNotation.value
  )
})

// Calculate line points based on routing mode
const linePoints = computed(() => {
  if (!endpoints.value) {
    return [0, 0, 0, 0]
  }

  const { start, end } = endpoints.value

  // For temp arcs, always use direct routing
  if (props.isTemp) {
    return [start.x, start.y, end.x, end.y]
  }

  switch (routingMode.value) {
    case 'manual': {
      const wp = props.arc.waypoints || []
      if (wp.length === 0) return [start.x, start.y, end.x, end.y]
      return pointsToArray([start, ...wp, end])
    }
    case 'orthogonal': {
      const route = orthogonalRoute(
        start,
        end,
        sourceElement.value?.type || 'place',
        targetElement.value?.type || 'transition'
      )
      return pointsToArray(route)
    }
    case 'bezier': {
      const bezierPoints = bezierRoute(start, end)
      const sampledPoints = sampleBezierCurve(
        bezierPoints[0],
        bezierPoints[1],
        bezierPoints[2],
        20
      )
      return pointsToArray(sampledPoints)
    }
    case 'direct':
    default:
      return [start.x, start.y, end.x, end.y]
  }
})

// Calculate arrow head points
const arrowPoints = computed(() => {
  if (!endpoints.value || linePoints.value.length < 4) {
    return []
  }

  // Get the last two points for arrow direction
  const pointCount = linePoints.value.length
  const endX = linePoints.value[pointCount - 2]
  const endY = linePoints.value[pointCount - 1]
  const prevX = linePoints.value[pointCount - 4] || linePoints.value[0]
  const prevY = linePoints.value[pointCount - 3] || linePoints.value[1]

  const ang = angle({ x: prevX, y: prevY }, { x: endX, y: endY })
  const arrowHead = calculateArrowHead({ x: endX, y: endY }, ang, VISUAL.arc.arrowSize)

  return arrowHead.flatMap((p) => [p.x, p.y])
})

// Line config
const lineConfig = computed(() => ({
  points: linePoints.value,
  stroke: props.isSelected ? colors.value.selectedStroke : props.isTemp ? colors.value.tempStroke : colors.value.stroke,
  strokeWidth: props.isSelected ? 3 : VISUAL.arc.strokeWidth,
  lineCap: 'round',
  lineJoin: 'round',
  dash: props.isTemp ? [5, 5] : undefined,
  tension: routingMode.value === 'bezier' ? 0 : 0, // Konva tension (0 for line segments)
}))

// Arrow config
const arrowConfig = computed(() => ({
  points: arrowPoints.value,
  fill: props.isSelected ? colors.value.selectedStroke : props.isTemp ? colors.value.tempStroke : colors.value.stroke,
  closed: true,
}))

// Weight label config (only show if weight > 1)
const showWeight = computed(() => props.arc.weight > 1 && !props.isTemp)

const weightLabelConfig = computed(() => {
  if (!showWeight.value) return null

  // Calculate the true midpoint of the arc
  // For simple lines [x1, y1, x2, y2], midpoint is ((x1+x2)/2, (y1+y2)/2)
  // For multi-segment lines, find the middle segment
  const points = linePoints.value
  const pointCount = points.length
  
  let midX, midY
  
  if (pointCount === 4) {
    // Simple line: calculate exact midpoint
    midX = (points[0] + points[2]) / 2
    midY = (points[1] + points[3]) / 2
  } else {
    // Multi-segment line: find middle point
    const midIndex = Math.floor(pointCount / 4) * 2 // Round to even index (x coordinate)
    const nextIndex = Math.min(midIndex + 2, pointCount - 2)
    midX = (points[midIndex] + points[nextIndex]) / 2
    midY = (points[midIndex + 1] + points[nextIndex + 1]) / 2
  }

  return {
    x: midX,
    y: midY - 12, // Position slightly above the line
    text: String(props.arc.weight),
    fontSize: 12,
    fontFamily: 'system-ui, sans-serif',
    fontStyle: 'bold',
    fill: colors.value.labelFill,
    align: 'center',
    offsetX: 4, // Center the text horizontally
  }
})

// Waypoint handle configs for manual mode
const waypointHandles = computed(() => {
  if (routingMode.value !== 'manual' || !props.isSelected || props.isTemp) return []
  return (props.arc.waypoints || []).map((wp, i) => ({
    x: wp.x,
    y: wp.y,
    radius: 5,
    fill: colors.value.selectedStroke,
    stroke: '#fff',
    strokeWidth: 1.5,
    draggable: true,
    _index: i,
  }))
})

const handleClick = (e) => {
  if (!props.isTemp) {
    emit('click', e)
  }
}

const handleDblClick = (e) => {
  if (props.isTemp) return
  if (routingMode.value === 'manual') {
    const stage = e.target.getStage()
    if (!stage) return
    const pos = stage.getPointerPosition()
    if (!pos) return
    const vp = store.viewport
    const worldPos = {
      x: (pos.x - vp.x) / vp.scale,
      y: (pos.y - vp.y) / vp.scale,
    }
    const wp = [...(props.arc.waypoints || []), worldPos]
    store.updateArc(props.arc.id, { waypoints: wp })
    return
  }
  emit('dblclick', e)
}

const handleWaypointDrag = (index, e) => {
  const node = e.target
  const wp = [...(props.arc.waypoints || [])]
  wp[index] = { x: node.x(), y: node.y() }
  store.updateArc(props.arc.id, { waypoints: wp })
}

const handleWaypointDblClick = (index, e) => {
  e.cancelBubble = true
  const wp = [...(props.arc.waypoints || [])]
  wp.splice(index, 1)
  store.updateArc(props.arc.id, { waypoints: wp })
}
</script>

<template>
  <v-group @click="handleClick" @dblclick="handleDblClick">
    <!-- Line -->
    <v-line :config="lineConfig" />

    <!-- Arrow head -->
    <v-line
      v-if="arrowPoints.length > 0"
      :config="arrowConfig"
    />

    <!-- Weight label -->
    <v-text
      v-if="showWeight && weightLabelConfig"
      :config="weightLabelConfig"
    />

    <!-- Waypoint handles (manual mode, selected) -->
    <v-circle
      v-for="handle in waypointHandles"
      :key="'wp-' + handle._index"
      :config="handle"
      @dragend="(e) => handleWaypointDrag(handle._index, e)"
      @dblclick="(e) => handleWaypointDblClick(handle._index, e)"
    />
  </v-group>
</template>
