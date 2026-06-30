<script setup>
import { computed } from 'vue'
import { useConfigStore } from '@/stores/config'
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
  tokenOverride: {
    type: Number,
    default: null,
  },
  isTokenGameActive: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click', 'dragend', 'contextmenu'])

const { radius, strokeWidth, tokenRadius, tokenFontSize } = VISUAL.place

// Spacing between token dot centers inside a place (keeps a small gap between dots)
const tokenLayoutOffset = tokenRadius + 1.5

// Theme colors
const configStore = useConfigStore()

const colors = computed(() => {
  const dark = configStore.isDarkMode
  return {
    fill: dark ? '#1f2937' : '#ffffff',
    stroke: dark ? '#9ca3af' : '#374151',
    selectedStroke: '#3b82f6',
    tokenFill: dark ? '#e5e7eb' : '#1f2937',
    labelFill: dark ? '#e5e7eb' : '#374151',
  }
})

// Effective token count (use override if token game is active)
const effectiveTokens = computed(() => {
  if (props.isTokenGameActive && props.tokenOverride !== null) {
    return props.tokenOverride
  }
  return props.place.tokens
})

// Circle config
const circleConfig = computed(() => ({
  id: props.place.id,
  name: props.place.id,
  x: props.place.position.x,
  y: props.place.position.y,
  radius,
  fill: colors.value.fill,
  stroke: props.isSelected ? colors.value.selectedStroke : colors.value.stroke,
  strokeWidth: props.isSelected ? 3 : strokeWidth,
  draggable: props.draggable,
}))

// Token positions for visual representation
const tokenPositions = computed(() => {
  const tokens = effectiveTokens.value
  const positions = []
  const centerX = props.place.position.x
  const centerY = props.place.position.y

  if (tokens === 0) return positions

  if (tokens === 1) {
    positions.push({ x: centerX, y: centerY })
  } else if (tokens === 2) {
    positions.push({ x: centerX - tokenLayoutOffset, y: centerY })
    positions.push({ x: centerX + tokenLayoutOffset, y: centerY })
  } else if (tokens === 3) {
    positions.push({ x: centerX, y: centerY - tokenLayoutOffset })
    positions.push({ x: centerX - tokenLayoutOffset, y: centerY + tokenRadius - 0.5 })
    positions.push({ x: centerX + tokenLayoutOffset, y: centerY + tokenRadius - 0.5 })
  } else if (tokens <= 5) {
    positions.push({ x: centerX - tokenLayoutOffset, y: centerY - tokenLayoutOffset })
    positions.push({ x: centerX + tokenLayoutOffset, y: centerY - tokenLayoutOffset })
    positions.push({ x: centerX - tokenLayoutOffset, y: centerY + tokenLayoutOffset })
    positions.push({ x: centerX + tokenLayoutOffset, y: centerY + tokenLayoutOffset })
    if (tokens === 5) {
      positions.push({ x: centerX, y: centerY })
    }
  }
  // For more than 5 tokens, we'll show a number

  return positions
})

// Show number for tokens > 5
const showTokenNumber = computed(() => effectiveTokens.value > 5)

// Label config
const labelConfig = computed(() => ({
  x: props.place.position.x,
  y: props.place.position.y + radius + 15,
  text: props.place.name,
  fontSize: 12,
  fontFamily: 'system-ui, sans-serif',
  fill: colors.value.labelFill,
  align: 'center',
  offsetX: props.place.name.length * 3,
}))

// Token number config
const tokenNumberConfig = computed(() => ({
  x: props.place.position.x,
  y: props.place.position.y,
  text: String(effectiveTokens.value),
  fontSize: tokenFontSize,
  fontFamily: 'system-ui, sans-serif',
  fontStyle: 'bold',
  fill: colors.value.tokenFill,
  align: 'center',
  verticalAlign: 'middle',
  offsetX: effectiveTokens.value >= 10 ? Math.round(tokenFontSize * 0.55) : Math.round(tokenFontSize * 0.28),
  offsetY: Math.round(tokenFontSize * 0.5),
}))

const handleClick = (e) => {
  emit('click', e)
}

const handleDragEnd = (e) => {
  emit('dragend', e)
}

const handleContextMenu = (e) => {
  emit('contextmenu', e)
}
</script>

<template>
  <v-group>
    <!-- Main circle -->
    <v-circle
      :config="circleConfig"
      @click="handleClick"
      @dragend="handleDragEnd"
      @contextmenu="handleContextMenu"
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
        fill: colors.tokenFill,
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
