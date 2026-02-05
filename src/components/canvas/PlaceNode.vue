<script setup>
import { computed } from 'vue'
import { VISUAL } from '@/types/petri-net'

const props = defineProps({
  place: {
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

const { radius, strokeWidth, tokenRadius } = VISUAL.place

// Circle config
const circleConfig = computed(() => ({
  x: props.place.position.x,
  y: props.place.position.y,
  radius,
  fill: 'white',
  stroke: props.isSelected ? '#3b82f6' : '#1a1a1a',
  strokeWidth: props.isSelected ? 3 : strokeWidth,
  draggable: props.draggable,
}))

// Token positions for visual representation
const tokenPositions = computed(() => {
  const tokens = props.place.tokens
  const positions = []
  const centerX = props.place.position.x
  const centerY = props.place.position.y

  if (tokens === 0) return positions

  if (tokens === 1) {
    positions.push({ x: centerX, y: centerY })
  } else if (tokens === 2) {
    positions.push({ x: centerX - 6, y: centerY })
    positions.push({ x: centerX + 6, y: centerY })
  } else if (tokens === 3) {
    positions.push({ x: centerX, y: centerY - 6 })
    positions.push({ x: centerX - 6, y: centerY + 4 })
    positions.push({ x: centerX + 6, y: centerY + 4 })
  } else if (tokens <= 5) {
    // Square pattern
    const offset = 6
    positions.push({ x: centerX - offset, y: centerY - offset })
    positions.push({ x: centerX + offset, y: centerY - offset })
    positions.push({ x: centerX - offset, y: centerY + offset })
    positions.push({ x: centerX + offset, y: centerY + offset })
    if (tokens === 5) {
      positions.push({ x: centerX, y: centerY })
    }
  }
  // For more than 5 tokens, we'll show a number

  return positions
})

// Show number for tokens > 5
const showTokenNumber = computed(() => props.place.tokens > 5)

// Label config
const labelConfig = computed(() => ({
  x: props.place.position.x,
  y: props.place.position.y + radius + 15,
  text: props.place.name,
  fontSize: 12,
  fontFamily: 'system-ui, sans-serif',
  fill: '#333',
  align: 'center',
  offsetX: props.place.name.length * 3,
}))

// Token number config
const tokenNumberConfig = computed(() => ({
  x: props.place.position.x,
  y: props.place.position.y,
  text: String(props.place.tokens),
  fontSize: 14,
  fontFamily: 'system-ui, sans-serif',
  fontStyle: 'bold',
  fill: '#1a1a1a',
  align: 'center',
  verticalAlign: 'middle',
  offsetX: props.place.tokens >= 10 ? 7 : 4,
  offsetY: 7,
}))

const handleClick = (e) => {
  emit('click', e)
}

const handleDragEnd = (e) => {
  emit('dragend', e)
}
</script>

<template>
  <v-group>
    <!-- Main circle -->
    <v-circle
      :config="circleConfig"
      @click="handleClick"
      @dragend="handleDragEnd"
    />

    <!-- Tokens (dots) -->
    <v-circle
      v-for="(pos, index) in tokenPositions"
      v-if="!showTokenNumber"
      :key="`token-${index}`"
      :config="{
        x: pos.x,
        y: pos.y,
        radius: tokenRadius,
        fill: '#1a1a1a',
      }"
    />

    <!-- Token number (for > 5 tokens) -->
    <v-text
      v-if="showTokenNumber"
      :config="tokenNumberConfig"
    />

    <!-- Label -->
    <v-text :config="labelConfig" />
  </v-group>
</template>
