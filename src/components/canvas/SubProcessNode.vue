<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useConfigStore } from '@/stores/config'
import { usePetriNetStore } from '@/stores/petriNet'
import { VISUAL } from '@/types/petri-net'

const { t } = useI18n()
const petriNetStore = usePetriNetStore()
const { nets } = storeToRefs(petriNetStore)

const props = defineProps({
  subprocess: {
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

const { width, height, strokeWidth, innerOffset, cornerRadius } = VISUAL.subprocess

// Theme colors
const configStore = useConfigStore()

const colors = computed(() => {
  const dark = configStore.isDarkMode
  return {
    fill: dark ? '#1e3a5f' : '#eff6ff',
    stroke: dark ? '#60a5fa' : '#3b82f6',
    innerStroke: dark ? '#3b82f6' : '#60a5fa',
    selectedStroke: '#f59e0b',
    enabledStroke: '#22c55e',
    enabledFill: dark ? '#166534' : '#dcfce7',
    labelFill: dark ? '#e5e7eb' : '#1e40af',
    iconFill: dark ? '#93c5fd' : '#3b82f6',
  }
})

// Determine stroke color based on state
const strokeColor = computed(() => {
  if (props.isSelected) return colors.value.selectedStroke
  if (props.isEnabled && props.isTokenGameActive) return colors.value.enabledStroke
  return colors.value.stroke
})

// Determine fill color based on state
const fillColor = computed(() => {
  if (props.isEnabled && props.isTokenGameActive) return colors.value.enabledFill
  return colors.value.fill
})

// Outer rectangle config
const outerRectConfig = computed(() => ({
  x: props.subprocess.position.x - width / 2,
  y: props.subprocess.position.y - height / 2,
  width,
  height,
  fill: fillColor.value,
  stroke: strokeColor.value,
  strokeWidth: props.isSelected ? 3 : (props.isEnabled && props.isTokenGameActive ? 2.5 : strokeWidth),
  cornerRadius,
}))

// Inner rectangle config (for double-border effect)
const innerRectConfig = computed(() => ({
  x: props.subprocess.position.x - width / 2 + innerOffset,
  y: props.subprocess.position.y - height / 2 + innerOffset,
  width: width - innerOffset * 2,
  height: height - innerOffset * 2,
  fill: 'transparent',
  stroke: colors.value.innerStroke,
  strokeWidth: 1,
  cornerRadius: cornerRadius - 2,
}))

// Group config for dragging
const groupConfig = computed(() => ({
  x: 0,
  y: 0,
  draggable: props.draggable,
}))

// Label config
const labelConfig = computed(() => ({
  x: props.subprocess.position.x,
  y: props.subprocess.position.y - 5,
  text: props.subprocess.name,
  fontSize: 11,
  fontFamily: 'system-ui, sans-serif',
  fontStyle: 'bold',
  fill: colors.value.labelFill,
  align: 'center',
  offsetX: props.subprocess.name.length * 3,
}))

// Subnet data for miniature preview
const subNet = computed(() => {
  const netId = props.subprocess.subNetId
  if (!netId) return null
  return nets.value[netId] || null
})

const hasSubNetContent = computed(() => {
  const net = subNet.value
  if (!net) return false
  return net.places.length > 0 || net.transitions.length > 0
})

// Miniature preview shapes inside the node
const miniPreviewShapes = computed(() => {
  const net = subNet.value
  if (!net || !hasSubNetContent.value) return []

  const allElements = [
    ...net.places.map((p) => ({ ...p, kind: 'place' })),
    ...net.transitions.map((t) => ({ ...t, kind: 'transition' })),
    ...net.operators.map((o) => ({ ...o, kind: 'operator' })),
    ...(net.subProcesses || []).map((s) => ({ ...s, kind: 'subprocess' })),
  ]

  if (allElements.length === 0) return []

  const xs = allElements.map((e) => e.position.x)
  const ys = allElements.map((e) => e.position.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1

  const areaW = width - 16
  const areaH = 16
  const baseY = props.subprocess.position.y + 6
  const baseX = props.subprocess.position.x - areaW / 2

  return allElements.map((el) => ({
    kind: el.kind,
    x: baseX + ((el.position.x - minX) / rangeX) * areaW,
    y: baseY + ((el.position.y - minY) / rangeY) * areaH,
  }))
})

// Expand icon config (⊞ symbol for drill-down hint) — shown only when no preview
const expandIconConfig = computed(() => ({
  x: props.subprocess.position.x,
  y: props.subprocess.position.y + 12,
  text: '⊞',
  fontSize: 16,
  fontFamily: 'system-ui, sans-serif',
  fill: colors.value.iconFill,
  align: 'center',
  offsetX: 8,
}))

// Hint text below
const hintConfig = computed(() => ({
  x: props.subprocess.position.x,
  y: props.subprocess.position.y + height / 2 + 12,
  text: t('subprocess.doubleClickHint'),
  fontSize: 9,
  fontFamily: 'system-ui, sans-serif',
  fill: colors.value.iconFill,
  opacity: 0.7,
  align: 'center',
  offsetX: 45,
}))

const handleClick = (e) => {
  emit('click', e)
}

const handleDblClick = (e) => {
  emit('dblclick', e)
}

const handleDragEnd = (e) => {
  // Calculate new center position from group position
  const newX = e.target.x() + props.subprocess.position.x
  const newY = e.target.y() + props.subprocess.position.y
  
  // Reset group position and emit with calculated center
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
    <!-- Outer rectangle (main border) -->
    <v-rect :config="outerRectConfig" />

    <!-- Inner rectangle (double-border effect) -->
    <v-rect :config="innerRectConfig" />

    <!-- Name label -->
    <v-text :config="labelConfig" />

    <!-- Miniature preview when subnet has content -->
    <template v-if="hasSubNetContent">
      <template v-for="(shape, idx) in miniPreviewShapes" :key="'mini-' + idx">
        <v-circle
          v-if="shape.kind === 'place'"
          :config="{ x: shape.x, y: shape.y, radius: 3, fill: 'white', stroke: colors.stroke, strokeWidth: 0.8 }"
        />
        <v-rect
          v-else-if="shape.kind === 'transition'"
          :config="{ x: shape.x - 3, y: shape.y - 2.5, width: 6, height: 5, fill: colors.stroke, stroke: colors.stroke, strokeWidth: 0.5 }"
        />
        <v-circle
          v-else
          :config="{ x: shape.x, y: shape.y, radius: 2.5, fill: '#f97316', stroke: '#ea580c', strokeWidth: 0.5 }"
        />
      </template>
    </template>

    <!-- Expand icon (when no preview content) -->
    <v-text v-else :config="expandIconConfig" />

    <!-- Hint (shown when selected) -->
    <v-text v-if="isSelected" :config="hintConfig" />
  </v-group>
</template>
