<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { usePetriNetStore } from '@/stores/petriNet'
import { useTokenGameStore } from '@/stores/tokenGame'
import { useConfigStore } from '@/stores/config'
import { useViewport } from '@/composables/useViewport'
import { VISUAL, DEFAULTS } from '@/types/petri-net'
import { snapToGrid } from '@/utils/geometry'
import { quickConnectPadScreenPosition } from '@/utils/quickConnect'
import {
  normalizeBounds,
  findElementsInMarquee,
  screenToWorld,
} from '@/utils/marqueeSelection'
import QuickConnectPad from '@/components/editor/QuickConnectPad.vue'
import PlaceNode from '@/components/canvas/PlaceNode.vue'
import TransitionNode from '@/components/canvas/TransitionNode.vue'
import OperatorNode from '@/components/canvas/OperatorNode.vue'
import SubProcessNode from '@/components/canvas/SubProcessNode.vue'
import ArcEdge from '@/components/canvas/ArcEdge.vue'
import TokenAnimation from '@/components/canvas/TokenAnimation.vue'
import EditorGrid from '@/components/canvas/EditorGrid.vue'

const emit = defineEmits(['resize', 'contextmenu'])

const store = usePetriNetStore()
const configStore = useConfigStore()
const { places, transitions, operators, subProcesses, arcs, tool, viewport, arcCreation, selectedIds } = storeToRefs(store)
const { operatorNotation } = storeToRefs(configStore)

// Viewport composable for fit to view functionality
const { fitToView } = useViewport()

// Grid settings from config store
// Note: Using $state explicitly ensures proper Vue reactivity tracking
// for nested properties. This is necessary because storeToRefs() doesn't
// deeply track nested object properties in Pinia.
const showGrid = computed(() => configStore.$state.editor.showGrid)
const snapEnabled = computed(() => configStore.$state.editor.snapToGrid)
const gridSize = computed(() => configStore.$state.editor.gridSize)

// Theme-aware grid color (matches CSS variables in style.css)
const gridColor = computed(() => configStore.isDarkMode ? '#2d3748' : '#e0e0e0')

// Token game store
const tokenGameStore = useTokenGameStore()
const { isRunning: isTokenGameActive, enabledTransitions, marking } = storeToRefs(tokenGameStore)

// Helper to check if a transition is enabled
const isTransitionEnabled = (id) => enabledTransitions.value.includes(id)

// Helper to get token count for a place (from token game if active)
const getTokenCount = (placeId) => {
  if (isTokenGameActive.value) {
    return marking.value.tokens[placeId] ?? 0
  }
  return null
}

// Quick connect (Camunda-style successor menu)
const quickConnectTarget = computed(() => {
  if (isTokenGameActive.value || tool.value !== 'select') return null
  if (selectedIds.value.length !== 1) return null

  const id = selectedIds.value[0]
  const type = store.getElementType(id)
  if (!type || type === 'arc') return null

  const el = store.getElementById(id)
  if (!el || !('position' in el)) return null

  return { id, type, position: el.position }
})

const quickConnectScreenPos = computed(() => {
  if (!quickConnectTarget.value) return null
  const { type, position } = quickConnectTarget.value
  return quickConnectPadScreenPosition(position, type, viewport.value)
})

// Canvas container ref
const containerRef = ref(null)
const stageRef = ref(null)

const MARQUEE_THRESHOLD = 4
const marquee = ref({
  pending: false,
  active: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
})
const pan = ref({
  pending: false,
  active: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  startViewportX: 0,
  startViewportY: 0,
})
const suppressStageClick = ref(false)

const isPlacementTool = computed(() =>
  ['place', 'transition', 'operator', 'subprocess'].includes(tool.value)
)

const marqueeStyle = computed(() => {
  if (!marquee.value.active) return null
  const { startX, startY, currentX, currentY } = marquee.value
  return {
    left: `${Math.min(startX, currentX)}px`,
    top: `${Math.min(startY, currentY)}px`,
    width: `${Math.abs(currentX - startX)}px`,
    height: `${Math.abs(currentY - startY)}px`,
  }
})

function resetMarquee() {
  marquee.value.pending = false
  marquee.value.active = false
}

function resetPan() {
  pan.value.pending = false
  pan.value.active = false
}

function beginMarquee(x, y) {
  marquee.value.pending = true
  marquee.value.active = false
  marquee.value.startX = x
  marquee.value.startY = y
  marquee.value.currentX = x
  marquee.value.currentY = y
}

function beginPan(x, y) {
  pan.value.pending = true
  pan.value.active = false
  pan.value.startX = x
  pan.value.startY = y
  pan.value.currentX = x
  pan.value.currentY = y
  pan.value.startViewportX = viewport.value.x
  pan.value.startViewportY = viewport.value.y
}

function updateMarqueePointer(x, y) {
  marquee.value.currentX = x
  marquee.value.currentY = y
  if (marquee.value.pending && !marquee.value.active) {
    const dx = Math.abs(x - marquee.value.startX)
    const dy = Math.abs(y - marquee.value.startY)
    if (dx >= MARQUEE_THRESHOLD || dy >= MARQUEE_THRESHOLD) {
      marquee.value.active = true
    }
  }
}

function finishMarquee(shiftKey = false) {
  if (!marquee.value.pending && !marquee.value.active) return

  const { startX, startY, currentX, currentY, active } = marquee.value
  const dx = Math.abs(currentX - startX)
  const dy = Math.abs(currentY - startY)
  const didDrag = active || dx >= MARQUEE_THRESHOLD || dy >= MARQUEE_THRESHOLD

  if (didDrag) {
    const worldStart = screenToWorld(startX, startY, viewport.value)
    const worldEnd = screenToWorld(currentX, currentY, viewport.value)
    const bounds = normalizeBounds(worldStart.x, worldStart.y, worldEnd.x, worldEnd.y)
    const ids = findElementsInMarquee(store.net, bounds, operatorNotation.value)
    store.selectMultiple(ids, shiftKey)
    suppressStageClick.value = true
  }

  resetMarquee()
}

function finishPan() {
  if (!pan.value.pending && !pan.value.active) return

  const { startX, startY, currentX, currentY, active } = pan.value
  const dx = Math.abs(currentX - startX)
  const dy = Math.abs(currentY - startY)
  const didPan = active || dx >= MARQUEE_THRESHOLD || dy >= MARQUEE_THRESHOLD

  if (didPan) {
    suppressStageClick.value = true
  }

  resetPan()
}

function updatePanPointer(x, y) {
  if (!pan.value.pending && !pan.value.active) return

  pan.value.currentX = x
  pan.value.currentY = y
  const dx = x - pan.value.startX
  const dy = y - pan.value.startY

  if (pan.value.pending && !pan.value.active) {
    if (Math.abs(dx) >= MARQUEE_THRESHOLD || Math.abs(dy) >= MARQUEE_THRESHOLD) {
      pan.value.active = true
    }
  }

  if (pan.value.active) {
    store.setViewport({
      x: pan.value.startViewportX + dx,
      y: pan.value.startViewportY + dy,
    })
  }
}

function handleStageMouseDown(e) {
  if (e.target !== e.target.getStage()) return

  const stage = e.target.getStage()
  const pos = stage.getPointerPosition()
  if (!pos) return

  const button = e.evt.button

  if (button === 1) {
    e.evt.preventDefault()
    beginPan(pos.x, pos.y)
    return
  }

  if (button !== 0) return

  if (tool.value === 'select' && e.evt.shiftKey && !isTokenGameActive.value) {
    beginMarquee(pos.x, pos.y)
    return
  }

  beginPan(pos.x, pos.y)
}

function handleStageMouseUp(e) {
  finishPan()
  if (marquee.value.pending || marquee.value.active) {
    finishMarquee(e.evt.shiftKey)
  }
}

function handleWindowMouseMove(e) {
  const stage = stageRef.value?.getStage()
  if (!stage) return

  const isPointerActive =
    pan.value.pending ||
    pan.value.active ||
    marquee.value.pending ||
    marquee.value.active
  if (!isPointerActive) return

  const rect = stage.container().getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  updatePanPointer(x, y)
  updateMarqueePointer(x, y)
}

function handleWindowMouseUp(e) {
  finishPan()
  if (marquee.value.pending || marquee.value.active) {
    finishMarquee(e.shiftKey)
  }
}

// Canvas dimensions
const stageConfig = ref({
  width: 800,
  height: 600,
})

// Content layer config — rotates around the visible canvas center
const contentLayerConfig = computed(() => {
  const { x, y, scale, rotation } = viewport.value
  if (!rotation) {
    return { x, y, scaleX: scale, scaleY: scale }
  }
  const cx = stageConfig.value.width / 2
  const cy = stageConfig.value.height / 2
  return {
    x: cx,
    y: cy,
    offsetX: (cx - x) / scale,
    offsetY: (cy - y) / scale,
    scaleX: scale,
    scaleY: scale,
    rotation,
  }
})

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
  window.addEventListener('mousemove', handleWindowMouseMove)
  window.addEventListener('mouseup', handleWindowMouseUp)
  store.initialize()
  
  // Fit to view after canvas is fully rendered
  // Use nextTick to ensure DOM is updated, then slight delay for Konva rendering
  nextTick(() => {
    setTimeout(() => {
      fitToView(stageConfig.value.width, stageConfig.value.height)
    }, 100)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateSize)
  window.removeEventListener('mousemove', handleWindowMouseMove)
  window.removeEventListener('mouseup', handleWindowMouseUp)
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

  // Snap to grid if enabled
  const snappedPos = snapEnabled.value ? snapToGrid(worldPos, gridSize.value) : worldPos

  // Handle based on current tool
  if (e.target === stage) {
    // Clicked on empty space
    switch (tool.value) {
      case 'select':
        if (suppressStageClick.value) {
          suppressStageClick.value = false
          break
        }
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
      case 'subprocess':
        store.addSubProcess(snappedPos)
        break
      case 'arc':
        if (arcCreation.value.isCreating) {
          store.cancelArcCreation()
        }
        break
    }
  }
}

// Handle mouse move for arc creation preview, pan, and marquee selection
const handleMouseMove = (e) => {
  const stage = e.target.getStage()
  const pos = stage.getPointerPosition()
  if (pos) {
    updatePanPointer(pos.x, pos.y)
    if (marquee.value.pending || marquee.value.active) {
      updateMarqueePointer(pos.x, pos.y)
    }
  }

  if (!arcCreation.value.isCreating) return
  if (!pos) return

  const worldPos = {
    x: (pos.x - viewport.value.x) / viewport.value.scale,
    y: (pos.y - viewport.value.y) / viewport.value.scale,
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

// Handle right-click context menu
const handleContextMenu = (id, type, e) => {
  const nativeEvt = e.evt || e
  nativeEvt.preventDefault?.()
  emit('contextmenu', {
    x: nativeEvt.clientX || nativeEvt.pageX || 0,
    y: nativeEvt.clientY || nativeEvt.pageY || 0,
    elementId: id,
    elementType: type,
  })
}

// Handle element click
const handleElementClick = (id, type, e) => {
  e.cancelBubble = true

  // If token game is active
  if (isTokenGameActive.value) {
    if (type === 'transition' || type === 'operator') {
      if (enabledTransitions.value.includes(id)) {
        tokenGameStore.fireTransition(id)
      }
      return
    }
    if (type === 'subprocess') {
      // For subprocesses, use step into (single click enters the subprocess)
      if (tokenGameStore.enabledSubprocesses.includes(id)) {
        tokenGameStore.stepIntoSubprocess(id)
      }
      return
    }
    return
  }

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

// Handle subprocess double-click to open it
const handleSubProcessDblClick = (id, e) => {
  e.cancelBubble = true
  
  // Don't open subprocess during token game
  if (isTokenGameActive.value) return
  
  store.openSubProcess(id)
}

// Handle element drag
const handleElementDragEnd = (id, e) => {
  const rawPos = {
    x: e.target.x(),
    y: e.target.y(),
  }
  const newPos = snapEnabled.value ? snapToGrid(rawPos, gridSize.value) : rawPos
  
  store.moveElementWithHistory(id, newPos)
}

// Expose for parent components
defineExpose({
  stageRef,
})
</script>

<template>
  <div
    ref="containerRef"
    class="editor-canvas"
    :class="{
      'is-select-tool': tool === 'select' && !isTokenGameActive,
      'is-panning': pan.active,
      'is-placement-tool': isPlacementTool && !isTokenGameActive,
    }"
  >
    <div
      v-if="marqueeStyle"
      class="marquee-selection"
      :style="marqueeStyle"
    />

    <QuickConnectPad
      v-if="quickConnectTarget && quickConnectScreenPos"
      :element-id="quickConnectTarget.id"
      :element-type="quickConnectTarget.type"
      :screen-x="quickConnectScreenPos.x"
      :screen-y="quickConnectScreenPos.y"
    />

    <v-stage
      ref="stageRef"
      :config="stageConfig"
      @mousedown="handleStageMouseDown"
      @mouseup="handleStageMouseUp"
      @click="handleStageClick"
      @mousemove="handleMouseMove"
      @wheel="handleWheel"
    >
      <!-- Grid Layer -->
      <EditorGrid
        :width="stageConfig.width"
        :height="stageConfig.height"
        :grid-size="gridSize"
        :offset-x="viewport.x"
        :offset-y="viewport.y"
        :grid-color="gridColor"
        :visible="showGrid"
      />

      <!-- Main Content Layer (supports rotation around canvas center) -->
      <v-layer :config="contentLayerConfig">
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
          :draggable="tool === 'select' && !isTokenGameActive"
          :token-override="getTokenCount(place.id)"
          :is-token-game-active="isTokenGameActive"
          @click="(e) => handleElementClick(place.id, 'place', e)"
          @contextmenu="(e) => handleContextMenu(place.id, 'place', e)"
          @dragend="(e) => handleElementDragEnd(place.id, e)"
        />

        <!-- Transitions -->
        <TransitionNode
          v-for="transition in transitions"
          :key="transition.id"
          :transition="transition"
          :is-selected="selectedIds.includes(transition.id)"
          :draggable="tool === 'select' && !isTokenGameActive"
          :is-enabled="isTransitionEnabled(transition.id)"
          :is-token-game-active="isTokenGameActive"
          @click="(e) => handleElementClick(transition.id, 'transition', e)"
          @contextmenu="(e) => handleContextMenu(transition.id, 'transition', e)"
          @dragend="(e) => handleElementDragEnd(transition.id, e)"
        />

        <!-- Operators -->
        <OperatorNode
          v-for="operator in operators"
          :key="operator.id"
          :operator="operator"
          :is-selected="selectedIds.includes(operator.id)"
          :draggable="tool === 'select' && !isTokenGameActive"
          :is-enabled="isTransitionEnabled(operator.id)"
          :is-token-game-active="isTokenGameActive"
          @click="(e) => handleElementClick(operator.id, 'operator', e)"
          @contextmenu="(e) => handleContextMenu(operator.id, 'operator', e)"
          @dragend="(e) => handleElementDragEnd(operator.id, e)"
        />

        <!-- Subprocesses -->
        <SubProcessNode
          v-for="subprocess in subProcesses"
          :key="subprocess.id"
          :subprocess="subprocess"
          :is-selected="selectedIds.includes(subprocess.id)"
          :draggable="tool === 'select' && !isTokenGameActive"
          :is-enabled="tokenGameStore.isSubprocessEnabled(subprocess.id)"
          :is-token-game-active="isTokenGameActive"
          @click="(e) => handleElementClick(subprocess.id, 'subprocess', e)"
          @contextmenu="(e) => handleContextMenu(subprocess.id, 'subprocess', e)"
          @dblclick="(e) => handleSubProcessDblClick(subprocess.id, e)"
          @dragend="(e) => handleElementDragEnd(subprocess.id, e)"
        />

        <!-- Token Animations -->
        <TokenAnimation v-if="isTokenGameActive" />
      </v-layer>
    </v-stage>
  </div>
</template>

<style scoped>
.editor-canvas {
  position: relative;
  flex: 1;
  background-color: var(--color-canvas);
  overflow: hidden;
  cursor: grab;
}

.editor-canvas.is-placement-tool {
  cursor: crosshair;
}

.editor-canvas.is-panning {
  cursor: grabbing;
}

.editor-canvas.is-select-tool:not(.is-panning):not(.is-placement-tool) {
  cursor: grab;
}

.marquee-selection {
  position: absolute;
  z-index: 15;
  border: 1px solid var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 15%, transparent);
  pointer-events: none;
}
</style>
