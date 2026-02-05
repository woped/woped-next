<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePetriNetStore } from '@/stores/petriNet'
import { VISUAL, DEFAULTS } from '@/types/petri-net'
import { snapToGrid } from '@/utils/geometry'
import PlaceNode from '@/components/canvas/PlaceNode.vue'
import TransitionNode from '@/components/canvas/TransitionNode.vue'
import OperatorNode from '@/components/canvas/OperatorNode.vue'
import ArcEdge from '@/components/canvas/ArcEdge.vue'

const props = defineProps({
  showGrid: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['resize'])

const store = usePetriNetStore()
const { places, transitions, operators, arcs, tool, viewport, arcCreation, selectedIds } = storeToRefs(store)

// Canvas container ref
const containerRef = ref(null)
const stageRef = ref(null)

// Canvas dimensions
const stageConfig = ref({
  width: 800,
  height: 600,
})

// Grid layer config
const gridSize = VISUAL.grid.size

// Update canvas size on mount and resize
const updateSize = () => {
  if (containerRef.value) {
    stageConfig.value.width = containerRef.value.clientWidth
    stageConfig.value.height = containerRef.value.clientHeight
    emit('resize', { width: stageConfig.value.width, height: stageConfig.value.height })
  }
}

onMounted(() => {
  updateSize()
  window.addEventListener('resize', updateSize)
  store.initialize()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateSize)
})

// Generate grid lines
const gridLines = computed(() => {
  const lines = []
  const { width, height } = stageConfig.value
  const offsetX = viewport.value.x % gridSize
  const offsetY = viewport.value.y % gridSize

  // Vertical lines
  for (let x = offsetX; x < width; x += gridSize) {
    lines.push({
      points: [x, 0, x, height],
      stroke: VISUAL.grid.color,
      strokeWidth: 0.5,
    })
  }

  // Horizontal lines
  for (let y = offsetY; y < height; y += gridSize) {
    lines.push({
      points: [0, y, width, y],
      stroke: VISUAL.grid.color,
      strokeWidth: 0.5,
    })
  }

  return lines
})

// Handle stage click
const handleStageClick = (e) => {
  // Get click position relative to stage
  const stage = e.target.getStage()
  const pointerPos = stage.getPointerPosition()
  
  if (!pointerPos) return

  // Transform to world coordinates
  const worldPos = {
    x: (pointerPos.x - viewport.value.x) / viewport.value.scale,
    y: (pointerPos.y - viewport.value.y) / viewport.value.scale,
  }

  // Snap to grid
  const snappedPos = snapToGrid(worldPos, gridSize)

  // Handle based on current tool
  if (e.target === stage) {
    // Clicked on empty space
    switch (tool.value) {
      case 'select':
        store.clearSelection()
        break
      case 'place':
        store.addPlace(snappedPos)
        break
      case 'transition':
        store.addTransition(snappedPos)
        break
      case 'operator':
        store.addOperator(snappedPos)
        break
      case 'arc':
        if (arcCreation.value.isCreating) {
          store.cancelArcCreation()
        }
        break
    }
  }
}

// Handle mouse move for arc creation preview
const handleMouseMove = (e) => {
  if (!arcCreation.value.isCreating) return

  const stage = e.target.getStage()
  const pointerPos = stage.getPointerPosition()
  
  if (!pointerPos) return

  const worldPos = {
    x: (pointerPos.x - viewport.value.x) / viewport.value.scale,
    y: (pointerPos.y - viewport.value.y) / viewport.value.scale,
  }

  store.updateArcTempEnd(worldPos)
}

// Handle wheel for zoom
const handleWheel = (e) => {
  e.evt.preventDefault()

  const stage = stageRef.value?.getStage()
  if (!stage) return

  const oldScale = viewport.value.scale
  const pointer = stage.getPointerPosition()

  const scaleBy = 1.1
  const newScale = e.evt.deltaY < 0 
    ? Math.min(oldScale * scaleBy, DEFAULTS.viewport.maxScale)
    : Math.max(oldScale / scaleBy, DEFAULTS.viewport.minScale)

  // Zoom towards pointer position
  const mousePointTo = {
    x: (pointer.x - viewport.value.x) / oldScale,
    y: (pointer.y - viewport.value.y) / oldScale,
  }

  store.setViewport({
    scale: newScale,
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  })
}

// Handle element click
const handleElementClick = (id, type, e) => {
  e.cancelBubble = true

  switch (tool.value) {
    case 'select':
      store.select(id, e.evt.shiftKey)
      break
    case 'delete':
      store.deleteElement(id)
      break
    case 'arc':
      if (arcCreation.value.isCreating) {
        // Complete arc
        store.completeArcCreation(id)
      } else {
        // Start arc
        store.startArcCreation(id, type)
      }
      break
  }
}

// Handle element drag
const handleElementDragEnd = (id, e) => {
  const newPos = snapToGrid({
    x: e.target.x(),
    y: e.target.y(),
  }, gridSize)
  
  store.moveElementWithHistory(id, newPos)
}

// Expose for parent components
defineExpose({
  stageRef,
})
</script>

<template>
  <div ref="containerRef" class="editor-canvas">
    <v-stage
      ref="stageRef"
      :config="stageConfig"
      @click="handleStageClick"
      @mousemove="handleMouseMove"
      @wheel="handleWheel"
    >
      <!-- Grid Layer -->
      <v-layer v-if="showGrid">
        <v-line
          v-for="(line, index) in gridLines"
          :key="`grid-${index}`"
          :config="line"
        />
      </v-layer>

      <!-- Main Content Layer -->
      <v-layer :config="{ 
        x: viewport.x, 
        y: viewport.y, 
        scaleX: viewport.scale, 
        scaleY: viewport.scale 
      }">
        <!-- Arcs (render first so they appear behind nodes) -->
        <ArcEdge
          v-for="arc in arcs"
          :key="arc.id"
          :arc="arc"
          :is-selected="selectedIds.includes(arc.id)"
          @click="(e) => handleElementClick(arc.id, 'arc', e)"
        />

        <!-- Temp arc during creation -->
        <ArcEdge
          v-if="arcCreation.isCreating && arcCreation.tempEndPosition"
          :arc="{
            id: 'temp-arc',
            sourceId: arcCreation.sourceId,
            targetId: null,
            weight: 1,
            waypoints: [],
          }"
          :temp-end="arcCreation.tempEndPosition"
          :is-temp="true"
        />

        <!-- Places -->
        <PlaceNode
          v-for="place in places"
          :key="place.id"
          :place="place"
          :is-selected="selectedIds.includes(place.id)"
          :draggable="tool === 'select'"
          @click="(e) => handleElementClick(place.id, 'place', e)"
          @dragend="(e) => handleElementDragEnd(place.id, e)"
        />

        <!-- Transitions -->
        <TransitionNode
          v-for="transition in transitions"
          :key="transition.id"
          :transition="transition"
          :is-selected="selectedIds.includes(transition.id)"
          :draggable="tool === 'select'"
          @click="(e) => handleElementClick(transition.id, 'transition', e)"
          @dragend="(e) => handleElementDragEnd(transition.id, e)"
        />

        <!-- Operators -->
        <OperatorNode
          v-for="operator in operators"
          :key="operator.id"
          :operator="operator"
          :is-selected="selectedIds.includes(operator.id)"
          :draggable="tool === 'select'"
          @click="(e) => handleElementClick(operator.id, 'operator', e)"
          @dragend="(e) => handleElementDragEnd(operator.id, e)"
        />
      </v-layer>
    </v-stage>
  </div>
</template>

<style scoped>
.editor-canvas {
  flex: 1;
  background-color: #fafafa;
  overflow: hidden;
  cursor: crosshair;
}
</style>
