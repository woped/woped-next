<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useConfigStore } from '@/stores/config'
import { VISUAL } from '@/types/petri-net'
import {
  LEGACY_BORDER,
  LEGACY_TOKEN_RADIUS,
  getLegacyElementColors,
  getLegacyPlaceRadius,
  layoutLegacyPlaceTokens,
} from '@/utils/canvasLegacy'

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

const emit = defineEmits(['click', 'dblclick', 'dragend', 'contextmenu'])

const configStore = useConfigStore()
const { operatorNotation } = storeToRefs(configStore)

const isLegacyCanvas = computed(() => operatorNotation.value === 'vanDerAalst')

const { radius, strokeWidth, tokenRadius, tokenFontSize } = VISUAL.place

const tokenLayoutOffset = tokenRadius + 1.5

const colors = computed(() => {
  const dark = configStore.isDarkMode
  if (isLegacyCanvas.value) {
    return getLegacyElementColors({
      selected: props.isSelected,
      isDark: dark,
    })
  }
  return {
    fill: dark ? '#1f2937' : '#ffffff',
    stroke: dark ? '#9ca3af' : '#374151',
    selectedStroke: '#3b82f6',
    tokenFill: dark ? '#e5e7eb' : '#1f2937',
    labelFill: dark ? '#e5e7eb' : '#374151',
  }
})

const effectiveTokens = computed(() => {
  if (props.isTokenGameActive && props.tokenOverride !== null) {
    return props.tokenOverride
  }
  return props.place.tokens
})

const legacyRadius = computed(() => getLegacyPlaceRadius())

const circleConfig = computed(() => {
  const cx = props.place.position.x
  const cy = props.place.position.y
  const legacy = isLegacyCanvas.value

  return {
    id: props.place.id,
    name: props.place.id,
    x: cx,
    y: cy,
    radius: legacy ? legacyRadius.value : radius,
    fill: legacy ? colors.value.fill : colors.value.fill,
    stroke: legacy
      ? colors.value.stroke
      : props.isSelected
        ? colors.value.selectedStroke
        : colors.value.stroke,
    strokeWidth: legacy
      ? LEGACY_BORDER
      : props.isSelected
        ? 3
        : strokeWidth,
    draggable: props.draggable,
  }
})

const legacyTokenDisplay = computed(() =>
  layoutLegacyPlaceTokens(
    props.place.position.x,
    props.place.position.y,
    effectiveTokens.value,
  ),
)

const tokenPositions = computed(() => {
  if (isLegacyCanvas.value) return legacyTokenDisplay.value.dots

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

  return positions
})

const showTokenNumber = computed(() => {
  if (isLegacyCanvas.value) return legacyTokenDisplay.value.label !== null
  return effectiveTokens.value > 5
})

const tokenNumberText = computed(() => {
  if (isLegacyCanvas.value) return legacyTokenDisplay.value.label ?? ''
  return String(effectiveTokens.value)
})

const effectiveTokenRadius = computed(() =>
  isLegacyCanvas.value ? LEGACY_TOKEN_RADIUS : tokenRadius,
)

const labelConfig = computed(() => ({
  x: props.place.position.x,
  y: props.place.position.y + (isLegacyCanvas.value ? legacyRadius.value : radius) + 15,
  text: props.place.name,
  fontSize: 12,
  fontFamily: 'system-ui, sans-serif',
  fill: isLegacyCanvas.value
    ? configStore.isDarkMode
      ? '#e5e7eb'
      : '#374151'
    : colors.value.labelFill,
  align: 'center',
  offsetX: props.place.name.length * 3,
}))

const tokenNumberConfig = computed(() => ({
  x: props.place.position.x,
  y: props.place.position.y,
  text: tokenNumberText.value,
  fontSize: isLegacyCanvas.value ? 10 : tokenFontSize,
  fontFamily: 'system-ui, sans-serif',
  fontStyle: isLegacyCanvas.value ? 'normal' : 'bold',
  fill: isLegacyCanvas.value ? colors.value.tokenFill : colors.value.tokenFill,
  align: 'center',
  verticalAlign: 'middle',
  width: isLegacyCanvas.value ? 40 : undefined,
  offsetX: isLegacyCanvas.value
    ? 20
    : effectiveTokens.value >= 10
      ? Math.round(tokenFontSize * 0.55)
      : Math.round(tokenFontSize * 0.28),
  offsetY: isLegacyCanvas.value ? 5 : Math.round(tokenFontSize * 0.5),
}))

const handleClick = (e) => {
  emit('click', e)
}

const handleDblClick = (e) => {
  emit('dblclick', e)
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
    <v-circle
      :config="circleConfig"
      @click="handleClick"
      @dblclick="handleDblClick"
      @dragend="handleDragEnd"
      @contextmenu="handleContextMenu"
    />

    <v-circle
      v-for="(pos, index) in tokenPositions"
      v-if="!showTokenNumber"
      :key="`token-${index}`"
      :config="{
        x: pos.x,
        y: pos.y,
        radius: effectiveTokenRadius,
        fill: colors.tokenFill,
      }"
    />

    <v-text v-if="showTokenNumber" :config="tokenNumberConfig" />

    <v-text :config="labelConfig" />
  </v-group>
</template>
