<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePetriNetStore } from '@/stores/petriNet'
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

const emit = defineEmits(['click'])

const store = usePetriNetStore()
const { places, transitions, operators } = storeToRefs(store)

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
      sourceElement.value.type === 'place' ? 'transition' : 'place'
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
    targetElement.value.type
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
  stroke: props.isSelected ? '#3b82f6' : props.isTemp ? '#999' : '#1a1a1a',
  strokeWidth: props.isSelected ? 3 : VISUAL.arc.strokeWidth,
  lineCap: 'round',
  lineJoin: 'round',
  dash: props.isTemp ? [5, 5] : undefined,
  tension: routingMode.value === 'bezier' ? 0 : 0, // Konva tension (0 for line segments)
}))

// Arrow config
const arrowConfig = computed(() => ({
  points: arrowPoints.value,
  fill: props.isSelected ? '#3b82f6' : props.isTemp ? '#999' : '#1a1a1a',
  closed: true,
}))

// Weight label config (only show if weight > 1)
const showWeight = computed(() => props.arc.weight > 1 && !props.isTemp)

const weightLabelConfig = computed(() => {
  if (!showWeight.value) return null

  // Use the middle of the line
  const midIndex = Math.floor(linePoints.value.length / 2)
  const midX = linePoints.value[midIndex - (midIndex % 2)]
  const midY = linePoints.value[midIndex - (midIndex % 2) + 1]

  return {
    x: midX,
    y: midY - 10,
    text: String(props.arc.weight),
    fontSize: 12,
    fontFamily: 'system-ui, sans-serif',
    fill: '#1a1a1a',
    align: 'center',
    offsetX: 4,
  }
})

const handleClick = (e) => {
  if (!props.isTemp) {
    emit('click', e)
  }
}
</script>

<template>
  <v-group @click="handleClick">
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
  </v-group>
</template>
