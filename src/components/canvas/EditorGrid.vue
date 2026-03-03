<script setup>
import { computed } from 'vue'

const props = defineProps({
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  gridSize: { type: Number, default: 20 },
  offsetX: { type: Number, default: 0 },
  offsetY: { type: Number, default: 0 },
  gridColor: { type: String, default: '#e0e0e0' },
  visible: { type: Boolean, default: true },
})

const gridLines = computed(() => {
  const lines = []
  const oX = props.offsetX % props.gridSize
  const oY = props.offsetY % props.gridSize

  for (let x = oX; x < props.width; x += props.gridSize) {
    lines.push({
      points: [x, 0, x, props.height],
      stroke: props.gridColor,
      strokeWidth: 0.5,
    })
  }

  for (let y = oY; y < props.height; y += props.gridSize) {
    lines.push({
      points: [0, y, props.width, y],
      stroke: props.gridColor,
      strokeWidth: 0.5,
    })
  }

  return lines
})
</script>

<template>
  <v-layer :config="{ visible }">
    <v-line
      v-for="(line, index) in gridLines"
      :key="`grid-${index}`"
      :config="line"
    />
  </v-layer>
</template>
