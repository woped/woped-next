<script setup>
/**
 * OperatorBase — common wrapper for all operator node types.
 * Provides the group, selection stroke, label, type indicator, and events.
 * The specific shape (AND diamond, XOR circle, Combined rect) is rendered
 * via the default slot.
 */
import { computed } from 'vue'
import { useConfigStore } from '@/stores/config'
import { VISUAL, OPERATOR_INFO } from '@/types/petri-net'

const props = defineProps({
  operator: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
  draggable: { type: Boolean, default: false },
  isEnabled: { type: Boolean, default: false },
  isTokenGameActive: { type: Boolean, default: false },
})

const emit = defineEmits(['click', 'dragend', 'contextmenu'])

const { size, strokeWidth } = VISUAL.operator
const halfSize = size / 2

const configStore = useConfigStore()

const themeColors = computed(() => {
  const dark = configStore.isDarkMode
  return {
    fill: dark ? '#1f2937' : '#ffffff',
    stroke: dark ? '#9ca3af' : '#374151',
    selectedStroke: '#3b82f6',
    enabledStroke: '#22c55e',
    labelFill: dark ? '#e5e7eb' : '#374151',
    typeLabelFill: dark ? '#9ca3af' : '#6b7280',
  }
})

const operatorInfo = computed(() => OPERATOR_INFO[props.operator.operatorType])

const strokeColor = computed(() => {
  if (props.isSelected) return themeColors.value.selectedStroke
  if (props.isEnabled && props.isTokenGameActive) return themeColors.value.enabledStroke
  return themeColors.value.stroke
})

const currentStrokeWidth = computed(() => {
  if (props.isSelected) return 3
  if (props.isEnabled && props.isTokenGameActive) return 2.5
  return strokeWidth
})

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

const groupConfig = computed(() => ({
  x: 0, y: 0,
  draggable: props.draggable,
}))

const handleClick = (e) => emit('click', e)
const handleContextMenu = (e) => emit('contextmenu', e)
const handleDragEnd = (e) => {
  const newX = e.target.x() + props.operator.position.x
  const newY = e.target.y() + props.operator.position.y
  e.target.position({ x: 0, y: 0 })
  emit('dragend', {
    ...e,
    target: { ...e.target, x: () => newX, y: () => newY },
  })
}

defineExpose({
  themeColors, strokeColor, currentStrokeWidth, halfSize, operatorInfo,
})
</script>

<template>
  <v-group
    :config="groupConfig"
    @click="handleClick"
    @contextmenu="handleContextMenu"
    @dragend="handleDragEnd"
  >
    <slot
      :themeColors="themeColors"
      :strokeColor="strokeColor"
      :strokeWidth="currentStrokeWidth"
      :halfSize="halfSize"
      :position="operator.position"
      :fillColor="operatorInfo?.color || '#4CAF50'"
    />
    <v-text :config="labelConfig" />
    <v-text :config="typeIndicatorConfig" />
  </v-group>
</template>
