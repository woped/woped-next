<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useConfigStore } from '@/stores/config'
import { VISUAL, getTransitionSize } from '@/types/petri-net'
import { TRIGGER_COLORS } from '@/types/triggers'

const props = defineProps({
  transition: {
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

const emit = defineEmits(['click', 'dragend', 'contextmenu'])

const { strokeWidth } = VISUAL.transition

const configStore = useConfigStore()
const { operatorNotation } = storeToRefs(configStore)

// Square in van der Aalst notation, wider rectangle in modern notation.
const dims = computed(() => getTransitionSize(operatorNotation.value))

const colors = computed(() => {
  const dark = configStore.isDarkMode
  return {
    fill: dark ? '#1f2937' : '#ffffff',
    stroke: dark ? '#9ca3af' : '#374151',
    selectedStroke: '#3b82f6',
    enabledStroke: '#22c55e',
    enabledFill: dark ? '#166534' : '#dcfce7',
    labelFill: dark ? '#e5e7eb' : '#374151',
  }
})

const strokeColor = computed(() => {
  if (props.isSelected) return colors.value.selectedStroke
  if (props.isEnabled && props.isTokenGameActive) return colors.value.enabledStroke
  return colors.value.stroke
})

const fillColor = computed(() => {
  if (props.isEnabled && props.isTokenGameActive) return colors.value.enabledFill
  return colors.value.fill
})

const rectConfig = computed(() => ({
  id: props.transition.id,
  name: props.transition.id,
  x: props.transition.position.x - dims.value.width / 2,
  y: props.transition.position.y - dims.value.height / 2,
  width: dims.value.width,
  height: dims.value.height,
  fill: fillColor.value,
  stroke: strokeColor.value,
  strokeWidth: props.isSelected ? 3 : (props.isEnabled && props.isTokenGameActive ? 2.5 : strokeWidth),
}))

const groupConfig = computed(() => ({
  id: props.transition.id,
  name: props.transition.id,
  x: 0,
  y: 0,
  draggable: props.draggable,
}))

const labelConfig = computed(() => ({
  x: props.transition.position.x,
  y: props.transition.position.y + dims.value.height / 2 + 15,
  text: props.transition.name,
  fontSize: 12,
  fontFamily: 'system-ui, sans-serif',
  fill: colors.value.labelFill,
  align: 'center',
  offsetX: props.transition.name.length * 3,
}))

const TRIGGER_LABELS = { time: 'T', resource: 'R', message: 'M' }
const ICON_RADIUS = 7
const ICON_GAP = 18

const triggerIcons = computed(() => {
  const triggers = props.transition.triggers || []
  if (triggers.length === 0) return []

  const seen = new Set()
  const unique = []
  for (const t of triggers) {
    if (!seen.has(t.type)) {
      seen.add(t.type)
      unique.push(t.type)
    }
  }

  const baseX = props.transition.position.x + dims.value.width / 2 + ICON_RADIUS + 4
  const totalHeight = (unique.length - 1) * ICON_GAP
  const startY = props.transition.position.y - totalHeight / 2

  return unique.map((type, i) => ({
    type,
    circle: {
      x: baseX,
      y: startY + i * ICON_GAP,
      radius: ICON_RADIUS,
      fill: TRIGGER_COLORS[type],
    },
    text: {
      x: baseX,
      y: startY + i * ICON_GAP,
      text: TRIGGER_LABELS[type],
      fontSize: 10,
      fontStyle: 'bold',
      fontFamily: 'system-ui, sans-serif',
      fill: '#ffffff',
      align: 'center',
      verticalAlign: 'middle',
      offsetX: 3,
      offsetY: 5,
    },
  }))
})

const handleClick = (e) => {
  emit('click', e)
}

const handleDragEnd = (e) => {
  const newX = e.target.x() + props.transition.position.x
  const newY = e.target.y() + props.transition.position.y

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

const handleContextMenu = (e) => {
  emit('contextmenu', e)
}
</script>

<template>
  <v-group
    :config="groupConfig"
    @click="handleClick"
    @dragend="handleDragEnd"
    @contextmenu="handleContextMenu"
  >
    <!-- Main rectangle -->
    <v-rect :config="rectConfig" />

    <!-- Trigger icons -->
    <template v-for="icon in triggerIcons" :key="icon.type">
      <v-circle :config="icon.circle" />
      <v-text :config="icon.text" />
    </template>

    <!-- Label -->
    <v-text :config="labelConfig" />
  </v-group>
</template>
