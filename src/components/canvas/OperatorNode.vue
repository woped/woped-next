<script setup>
import { computed } from 'vue'
import { VISUAL, OPERATOR_INFO, OperatorType, getOperatorCategory } from '@/types/petri-net'

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
})

const emit = defineEmits(['click', 'dragend'])

const { size, strokeWidth } = VISUAL.operator
const halfSize = size / 2

// Get operator info
const operatorInfo = computed(() => OPERATOR_INFO[props.operator.operatorType])
const category = computed(() => getOperatorCategory(props.operator.operatorType))

// Colors based on selection
const strokeColor = computed(() => props.isSelected ? '#3b82f6' : '#1a1a1a')
const fillColor = computed(() => operatorInfo.value?.color || '#4CAF50')
const currentStrokeWidth = computed(() => props.isSelected ? 3 : strokeWidth)

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
  fill: 'white',
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
  fill: '#333',
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
  fill: '#888',
  align: 'center',
  offsetX: (operatorInfo.value?.label?.length || 0) * 2.5,
}))

// Group config for dragging
const groupConfig = computed(() => ({
  x: 0,
  y: 0,
  draggable: props.draggable,
}))

const handleClick = (e) => {
  emit('click', e)
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
    @dragend="handleDragEnd"
  >
    <!-- AND type: Diamond shape -->
    <template v-if="isAndType">
      <v-line
        :config="{
          points: diamondPoints,
          fill: 'white',
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
          fill: 'white',
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
            fill: 'white',
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
          stroke: '#ccc',
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
            fill: 'white',
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

    <!-- Label -->
    <v-text :config="labelConfig" />
    
    <!-- Type indicator -->
    <v-text :config="typeIndicatorConfig" />
  </v-group>
</template>
