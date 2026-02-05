<script setup>
import { computed } from 'vue'
import { VISUAL } from '@/types/petri-net'

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
})

const emit = defineEmits(['click', 'dragend'])

const { width, height, strokeWidth } = VISUAL.transition

// Rectangle config
const rectConfig = computed(() => ({
  x: props.transition.position.x - width / 2,
  y: props.transition.position.y - height / 2,
  width,
  height,
  fill: 'white',
  stroke: props.isSelected ? '#3b82f6' : '#1a1a1a',
  strokeWidth: props.isSelected ? 3 : strokeWidth,
}))

// Group config for dragging
const groupConfig = computed(() => ({
  x: 0,
  y: 0,
  draggable: props.draggable,
}))

// Label config
const labelConfig = computed(() => ({
  x: props.transition.position.x,
  y: props.transition.position.y + height / 2 + 15,
  text: props.transition.name,
  fontSize: 12,
  fontFamily: 'system-ui, sans-serif',
  fill: '#333',
  align: 'center',
  offsetX: props.transition.name.length * 3,
}))

const handleClick = (e) => {
  emit('click', e)
}

const handleDragEnd = (e) => {
  // Calculate new center position from group position
  const newX = e.target.x() + props.transition.position.x
  const newY = e.target.y() + props.transition.position.y
  
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
    @dragend="handleDragEnd"
  >
    <!-- Main rectangle -->
    <v-rect :config="rectConfig" />

    <!-- Label -->
    <v-text :config="labelConfig" />
  </v-group>
</template>
