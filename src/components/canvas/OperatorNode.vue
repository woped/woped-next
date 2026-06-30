<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useConfigStore } from '@/stores/config'
import { usePetriNetStore } from '@/stores/petriNet'
import { VISUAL, OPERATOR_INFO, OperatorType, getOperatorCategory } from '@/types/petri-net'
import { getOperatorOrientation, getOperatorGlyphs, chevronGeometry } from '@/utils/operatorGlyph'

const props = defineProps({
  operator: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
  draggable: {
    type: Boolean,
    default: false,
  },
  isEnabled: {
    type: Boolean,
    default: false,
  },
  isTokenGameActive: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click', 'dblclick', 'dragend'])

const { size, strokeWidth } = VISUAL.operator
const halfSize = size / 2

// Theme colors
const configStore = useConfigStore()
const petriNetStore = usePetriNetStore()
const { operatorNotation } = storeToRefs(configStore)

const isVanDerAalst = computed(() => operatorNotation.value === 'vanDerAalst')

const themeColors = computed(() => {
  const dark = configStore.isDarkMode
  return {
    fill: dark ? '#1f2937' : '#ffffff',
    stroke: dark ? '#9ca3af' : '#374151',
    selectedStroke: '#3b82f6',
    enabledStroke: '#22c55e',
    labelFill: dark ? '#e5e7eb' : '#374151',
    typeLabelFill: dark ? '#9ca3af' : '#6b7280',
    dividerStroke: dark ? '#6b7280' : '#d1d5db',
  }
})

// Get operator info
const operatorInfo = computed(() => OPERATOR_INFO[props.operator.operatorType])
const category = computed(() => getOperatorCategory(props.operator.operatorType))

// Colors based on selection and token game state
const strokeColor = computed(() => {
  if (props.isSelected) return themeColors.value.selectedStroke
  if (props.isEnabled && props.isTokenGameActive) return themeColors.value.enabledStroke
  return themeColors.value.stroke
})
const fillColor = computed(() => operatorInfo.value?.color || '#4CAF50')
const currentStrokeWidth = computed(() => {
  if (props.isSelected) return 3
  if (props.isEnabled && props.isTokenGameActive) return 2.5
  return strokeWidth
})

// Determine shape based on operator type
const isAndType = computed(() => {
  const type = props.operator.operatorType
  return type === OperatorType.AND_SPLIT || 
         type === OperatorType.AND_JOIN ||
         type === OperatorType.AND_SPLIT_JOIN
})

const isXorType = computed(() => {
  const type = props.operator.operatorType
  return type === OperatorType.XOR_SPLIT || 
         type === OperatorType.XOR_JOIN ||
         type === OperatorType.XOR_SPLIT_JOIN
})

const isCombinedType = computed(() => category.value === 'combined')

// ---------------------------------------------------------------------------
// van der Aalst notation (authentic WoPeD): transition rectangle + chevron
// ---------------------------------------------------------------------------
const glyphBox = { width: size, height: size, border: strokeWidth }

const topLeft = computed(() => ({
  x: props.operator.position.x - halfSize,
  y: props.operator.position.y - halfSize,
}))

// Look up the canvas position of a connected element by id.
const elementPosition = (id) => {
  const net = petriNetStore.net
  const candidates = [
    ...net.places,
    ...net.transitions,
    ...net.operators,
    ...(net.subProcesses || []),
  ]
  const found = candidates.find((el) => el.id === id)
  return found ? found.position : null
}

// Derive split/join sides from the flow of connected arcs.
const orientation = computed(() => {
  const id = props.operator.id
  const incomingFrom = []
  const outgoingTo = []
  for (const arc of petriNetStore.net.arcs) {
    if (arc.targetId === id) {
      const p = elementPosition(arc.sourceId)
      if (p) incomingFrom.push(p)
    }
    if (arc.sourceId === id) {
      const p = elementPosition(arc.targetId)
      if (p) outgoingTo.push(p)
    }
  }
  return getOperatorOrientation(props.operator.position, incomingFrom, outgoingTo)
})

// Rectangle for the van der Aalst operator box.
const rectConfig = computed(() => ({
  id: props.operator.id,
  name: props.operator.id,
  x: topLeft.value.x,
  y: topLeft.value.y,
  width: size,
  height: size,
  fill: themeColors.value.fill,
  stroke: strokeColor.value,
  strokeWidth: currentStrokeWidth.value,
}))

// Chevron ink colour: matches the legacy `getInnerDrawingsColor` (border/black,
// turning green while a transition is active in the token game).
const inkColor = computed(() => {
  if (props.isEnabled && props.isTokenGameActive) return themeColors.value.enabledStroke
  return themeColors.value.stroke
})

// Convert a #rrggbb colour to an rgba() string with the given alpha.
const hexToRgba = (hex, alpha) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return hex
  const r = parseInt(m[1], 16)
  const g = parseInt(m[2], 16)
  const b = parseInt(m[3], 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Faint chevron fill (legacy draws the arrow filled at ~10% opacity).
const inkFill = computed(() => hexToRgba(inkColor.value, 0.1))

// Resolved chevron glyphs (translated to canvas coordinates). All arrows are
// drawn identically (monochrome outline with a faint fill, matching the legacy
// WoPeD rendering). The AND/XOR distinction is encoded by the arrow direction
// (inward vs. outward), not by the fill, and split/join by the side.
const aalstGlyphs = computed(() => {
  const ox = topLeft.value.x
  const oy = topLeft.value.y
  return getOperatorGlyphs(props.operator.operatorType, orientation.value).map((g) => {
    const geo = chevronGeometry(glyphBox, g.position, g.direction)
    const polygon = geo.polygon.map((v, i) => (i % 2 === 0 ? v + ox : v + oy))
    const line = geo.line ? geo.line.map((v, i) => (i % 2 === 0 ? v + ox : v + oy)) : null
    return { ...g, polygon, line }
  })
})

// Diamond points for AND operator
const diamondPoints = computed(() => {
  const x = props.operator.position.x
  const y = props.operator.position.y
  return [
    x, y - halfSize,      // top
    x + halfSize, y,      // right
    x, y + halfSize,      // bottom
    x - halfSize, y,      // left
  ]
})

// Circle config for XOR operator
const circleConfig = computed(() => ({
  x: props.operator.position.x,
  y: props.operator.position.y,
  radius: halfSize,
  fill: themeColors.value.fill,
  stroke: strokeColor.value,
  strokeWidth: currentStrokeWidth.value,
}))

// X lines for XOR (inside circle)
const xorLines = computed(() => {
  const x = props.operator.position.x
  const y = props.operator.position.y
  const offset = halfSize * 0.5
  return [
    // Line 1: top-left to bottom-right
    [x - offset, y - offset, x + offset, y + offset],
    // Line 2: top-right to bottom-left
    [x + offset, y - offset, x - offset, y + offset],
  ]
})

// Label config
const labelConfig = computed(() => ({
  x: props.operator.position.x,
  y: props.operator.position.y + halfSize + 18,
  text: props.operator.name,
  fontSize: 12,
  fontFamily: 'system-ui, sans-serif',
  fill: themeColors.value.labelFill,
  align: 'center',
  offsetX: props.operator.name.length * 3,
}))

// Type indicator config (small text showing operator type)
const typeIndicatorConfig = computed(() => ({
  x: props.operator.position.x,
  y: props.operator.position.y + halfSize + 32,
  text: operatorInfo.value?.label || '',
  fontSize: 9,
  fontFamily: 'system-ui, sans-serif',
  fill: themeColors.value.typeLabelFill,
  align: 'center',
  offsetX: (operatorInfo.value?.label?.length || 0) * 2.5,
}))

// Group config for dragging
const groupConfig = computed(() => ({
  id: props.operator.id,
  name: props.operator.id,
  x: 0,
  y: 0,
  draggable: props.draggable,
}))

const handleClick = (e) => {
  emit('click', e)
}

const handleDblClick = (e) => {
  emit('dblclick', e)
}

const handleDragEnd = (e) => {
  const newX = e.target.x() + props.operator.position.x
  const newY = e.target.y() + props.operator.position.y
  
  e.target.position({ x: 0, y: 0 })
  
  emit('dragend', {
    ...e,
    target: {
      ...e.target,
      x: () => newX,
      y: () => newY,
    },
  })
}
</script>

<template>
  <v-group
    :config="groupConfig"
    @click="handleClick"
    @dblclick="handleDblClick"
    @dragend="handleDragEnd"
  >
    <!-- van der Aalst notation: transition rectangle with directional chevron(s) -->
    <template v-if="isVanDerAalst">
      <!-- Operator box (same footprint as a transition) -->
      <v-rect :config="rectConfig" />

      <!-- Chevron glyphs (monochrome, legacy WoPeD); AND/XOR differ by arrow direction -->
      <template v-for="(glyph, index) in aalstGlyphs" :key="`glyph-${index}`">
        <v-line
          :config="{
            points: glyph.polygon,
            closed: true,
            stroke: inkColor,
            strokeWidth: 1.5,
            fill: inkFill,
            lineJoin: 'round',
          }"
        />
        <v-line
          v-if="glyph.line"
          :config="{
            points: glyph.line,
            stroke: inkColor,
            strokeWidth: 1.5,
          }"
        />
      </template>
    </template>

    <!-- Modern notation: AND diamond / XOR circle / combined gateway glyphs -->
    <template v-else>
    <!-- AND type: Diamond shape -->
    <template v-if="isAndType">
      <v-line
        :config="{
          points: diamondPoints,
          fill: themeColors.fill,
          stroke: strokeColor,
          strokeWidth: currentStrokeWidth,
          closed: true,
        }"
      />
      <!-- Inner fill indicator -->
      <v-line
        :config="{
          points: diamondPoints,
          fill: fillColor,
          opacity: 0.2,
          closed: true,
        }"
      />
    </template>

    <!-- XOR type: Circle with X -->
    <template v-else-if="isXorType">
      <v-circle :config="circleConfig" />
      <!-- X inside the circle -->
      <v-line
        v-for="(line, index) in xorLines"
        :key="`xor-line-${index}`"
        :config="{
          points: line,
          stroke: fillColor,
          strokeWidth: 2,
          lineCap: 'round',
        }"
      />
    </template>

    <!-- Combined type: Show both symbols -->
    <template v-else-if="isCombinedType">
      <!-- Background shape (larger) -->
      <v-rect
        :config="{
          x: operator.position.x - halfSize - 5,
          y: operator.position.y - halfSize - 5,
          width: size + 10,
          height: size + 10,
          fill: themeColors.fill,
          stroke: strokeColor,
          strokeWidth: currentStrokeWidth,
          cornerRadius: 5,
        }"
      />
      
      <!-- Left symbol (input type) -->
      <template v-if="operator.operatorType === OperatorType.AND_JOIN_XOR_SPLIT || operator.operatorType === OperatorType.AND_SPLIT_JOIN">
        <!-- Small diamond on left -->
        <v-line
          :config="{
            points: [
              operator.position.x - 12, operator.position.y - 10,
              operator.position.x - 2, operator.position.y,
              operator.position.x - 12, operator.position.y + 10,
              operator.position.x - 22, operator.position.y,
            ],
            fill: '#4CAF50',
            opacity: 0.3,
            stroke: '#4CAF50',
            strokeWidth: 1.5,
            closed: true,
          }"
        />
      </template>
      <template v-else>
        <!-- Small circle with X on left -->
        <v-circle
          :config="{
            x: operator.position.x - 12,
            y: operator.position.y,
            radius: 10,
            fill: themeColors.fill,
            stroke: '#FF9800',
            strokeWidth: 1.5,
          }"
        />
        <v-line
          :config="{
            points: [operator.position.x - 17, operator.position.y - 5, operator.position.x - 7, operator.position.y + 5],
            stroke: '#FF9800',
            strokeWidth: 1.5,
          }"
        />
        <v-line
          :config="{
            points: [operator.position.x - 7, operator.position.y - 5, operator.position.x - 17, operator.position.y + 5],
            stroke: '#FF9800',
            strokeWidth: 1.5,
          }"
        />
      </template>
      
      <!-- Divider line -->
      <v-line
        :config="{
          points: [operator.position.x, operator.position.y - halfSize, operator.position.x, operator.position.y + halfSize],
          stroke: themeColors.dividerStroke,
          strokeWidth: 1,
          dash: [2, 2],
        }"
      />
      
      <!-- Right symbol (output type) -->
      <template v-if="operator.operatorType === OperatorType.XOR_JOIN_AND_SPLIT || operator.operatorType === OperatorType.AND_SPLIT_JOIN">
        <!-- Small diamond on right -->
        <v-line
          :config="{
            points: [
              operator.position.x + 12, operator.position.y - 10,
              operator.position.x + 22, operator.position.y,
              operator.position.x + 12, operator.position.y + 10,
              operator.position.x + 2, operator.position.y,
            ],
            fill: '#4CAF50',
            opacity: 0.3,
            stroke: '#4CAF50',
            strokeWidth: 1.5,
            closed: true,
          }"
        />
      </template>
      <template v-else>
        <!-- Small circle with X on right -->
        <v-circle
          :config="{
            x: operator.position.x + 12,
            y: operator.position.y,
            radius: 10,
            fill: themeColors.fill,
            stroke: '#FF9800',
            strokeWidth: 1.5,
          }"
        />
        <v-line
          :config="{
            points: [operator.position.x + 7, operator.position.y - 5, operator.position.x + 17, operator.position.y + 5],
            stroke: '#FF9800',
            strokeWidth: 1.5,
          }"
        />
        <v-line
          :config="{
            points: [operator.position.x + 17, operator.position.y - 5, operator.position.x + 7, operator.position.y + 5],
            stroke: '#FF9800',
            strokeWidth: 1.5,
          }"
        />
      </template>
    </template>
    </template>

    <!-- Label -->
    <v-text :config="labelConfig" />

    <!-- Type indicator (modern only; legacy van der Aalst shows just the name) -->
    <v-text v-if="!isVanDerAalst" :config="typeIndicatorConfig" />
  </v-group>
</template>
