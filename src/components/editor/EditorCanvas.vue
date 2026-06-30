<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
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
import { scaleFromWheelDelta } from '@/utils/wheelZoom'
import QuickConnectPad from '@/components/editor/QuickConnectPad.vue'
import PlaceNode from '@/components/canvas/PlaceNode.vue'
import TransitionNode from '@/components/canvas/TransitionNode.vue'
import OperatorNode from '@/components/canvas/OperatorNode.vue'
import SubProcessNode from '@/components/canvas/SubProcessNode.vue'
import ArcEdge from '@/components/canvas/ArcEdge.vue'
import TokenAnimation from '@/components/canvas/TokenAnimation.vue'
import EditorGrid from '@/components/canvas/EditorGrid.vue'

const emit = defineEmits(['resize', 'open-properties'])

const store = usePetriNetStore()
const configStore = useConfigStore()
const { places, transitions, operators, subProcesses, arcs, tool, viewport, arcCreation, selectedIds, fitToViewRequest } = storeToRefs(store)
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

// Quick connect — shown on right-click (Camunda-style successor menu)
const quickConnectElementId = ref(null)

const quickConnectTarget = computed(() => {
  if (isTokenGameActive.value) return null
  if (!quickConnectElementId.value) return null

  const id = quickConnectElementId.value
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

// Quick connect drag-and-drop: a suggestion can be dragged from the pad and
// dropped anywhere on the canvas. While dragging we render a ghost following
// the cursor; on drop the new element is created at that world position.
const quickConnectDrag = ref(null)

function handleQuickConnectDragStart(payload) {
  quickConnectDrag.value = {
    target: payload.target,
    operatorType: payload.operatorType,
    icon: payload.icon,
    screenX: 0,
    screenY: 0,
  }
}

function handleQuickConnectDragMove(payload) {
  if (!quickConnectDrag.value || !containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  quickConnectDrag.value = {
    ...quickConnectDrag.value,
    screenX: payload.clientX - rect.left,
    screenY: payload.clientY - rect.top,
  }
}

function handleQuickConnectDragEnd(payload) {
  const drag = quickConnectDrag.value
  quickConnectDrag.value = null
  if (!drag) return

  const sourceId = quickConnectElementId.value
  if (!sourceId) return

  const stage = stageRef.value?.getStage()
  if (!stage) return

  const rect = stage.container().getBoundingClientRect()
  const px = payload.clientX - rect.left
  const py = payload.clientY - rect.top

  // Ignore drops outside the visible canvas.
  if (px < 0 || py < 0 || px > rect.width || py > rect.height) return

  const worldPos = {
    x: (px - viewport.value.x) / viewport.value.scale,
    y: (py - viewport.value.y) / viewport.value.scale,
  }

  const newId = store.quickConnectAdd(sourceId, drag.target, drag.operatorType, worldPos)
  if (newId) store.select(newId, false)
}

function handleQuickConnectDragCancel() {
  quickConnectDrag.value = null
}

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
const spaceHeld = ref(false)

const canDragElements = computed(
  () => tool.value === 'select' && !isTokenGameActive.value && !spaceHeld.value
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
  applyCanvasCursor()
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
  applyCanvasCursor()
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
      applyCanvasCursor()
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

  if (spaceHeld.value) {
    e.evt.preventDefault()
    e.cancelBubble = true
    beginPan(pos.x, pos.y)
    return
  }

  if (e.target !== stage) return

  if (tool.value === 'select' && !isTokenGameActive.value) {
    clearQuickConnect()
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
  if (pan.value.active) {
    applyCanvasCursor()
  }
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

// Keep the Konva stage in sync with its container for any layout change
// (side panel collapse/expand, splitter drag, ...), not just window resizes.
let containerResizeObserver = null

onMounted(() => {
  updateSize()
  window.addEventListener('resize', updateSize)

  if (containerRef.value && typeof ResizeObserver !== 'undefined') {
    containerResizeObserver = new ResizeObserver(() => updateSize())
    containerResizeObserver.observe(containerRef.value)
  }
  window.addEventListener('mousemove', handleWindowMouseMove)
  window.addEventListener('mouseup', handleWindowMouseUp)
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('keyup', handleKeyup)
  window.addEventListener('blur', handleWindowBlur)
  store.initialize()

  nextTick(() => {
    const stage = stageRef.value?.getStage()
    stage?.on('contextmenu', handleStageContextMenu)
  })
  
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
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('keyup', handleKeyup)
  window.removeEventListener('blur', handleWindowBlur)
  containerResizeObserver?.disconnect()
  containerResizeObserver = null
  const stage = stageRef.value?.getStage()
  stage?.off('contextmenu', handleStageContextMenu)
})

function clearQuickConnect() {
  quickConnectElementId.value = null
}

function isTypingTarget(e) {
  const target = e.target
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    clearQuickConnect()
  }

  if (e.code === 'Space' && !isTypingTarget(e)) {
    e.preventDefault()
    spaceHeld.value = true
  }
}

function handleKeyup(e) {
  if (e.code === 'Space') {
    spaceHeld.value = false
    applyCanvasCursor()
  }
}

function handleWindowBlur() {
  spaceHeld.value = false
  applyCanvasCursor()
}

watch([tool, isTokenGameActive], () => {
  clearQuickConnect()
  applyCanvasCursor()
})

// Fit a freshly loaded net (file import, template, chat-generated net, ...)
// into view so it is never placed outside the current viewport.
watch(fitToViewRequest, () => {
  nextTick(() => {
    setTimeout(() => {
      fitToView(stageConfig.value.width, stageConfig.value.height)
    }, 50)
  })
})

// Handle stage click
const handleStageClick = (e) => {
  if (isRightClick(e)) return
  if (spaceHeld.value) return

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
        clearQuickConnect()
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

// Handle mouse move for arc creation preview, pan, marquee selection, and cursor
const handleMouseMove = (e) => {
  const stage = e.target.getStage()
  const pos = stage.getPointerPosition()
  if (pos) {
    updatePanPointer(pos.x, pos.y)
    if (marquee.value.pending || marquee.value.active) {
      updateMarqueePointer(pos.x, pos.y)
    }
  }

  applyCanvasCursor()

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
  if (!pointer) return

  const newScale = scaleFromWheelDelta(
    oldScale,
    e.evt.deltaY,
    e.evt.deltaMode,
    DEFAULTS.viewport.minScale,
    DEFAULTS.viewport.maxScale
  )

  if (newScale === oldScale) return

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

function findElementIdFromKonvaNode(node) {
  let current = node
  while (current && current.getType?.() !== 'Stage') {
    const id = current.id?.() || current.name?.()
    if (id && store.getElementType(id)) return id
    current = current.getParent?.()
  }
  return null
}

function resolveCanvasCursor() {
  if (pan.value.active || pan.value.pending) return 'grabbing'
  return 'default'
}

function applyCanvasCursor() {
  const stage = stageRef.value?.getStage?.()
  if (!stage) return

  const cursor = resolveCanvasCursor()
  stage.container().style.cursor = cursor
  if (containerRef.value) {
    containerRef.value.style.cursor = cursor
  }
}

function handleCanvasMouseLeave() {
  const stage = stageRef.value?.getStage()
  if (stage) stage.container().style.cursor = 'default'
  if (containerRef.value) containerRef.value.style.cursor = 'default'
}

function isRightClick(e) {
  return e.evt?.button === 2
}

// Right-click opens quick connect on any element, regardless of the active tool.
function handleStageContextMenu(e) {
  e.evt.preventDefault()

  if (isTokenGameActive.value) return

  const stage = e.target.getStage()
  if (e.target === stage) {
    clearQuickConnect()
    return
  }

  const elementId = findElementIdFromKonvaNode(e.target)
  if (!elementId) return

  const type = store.getElementType(elementId)
  if (!type || type === 'arc') return

  e.cancelBubble = true

  store.select(elementId, e.evt.shiftKey)
  quickConnectElementId.value = elementId
}

// Handle element click
const handleElementClick = (id, type, e) => {
  if (isRightClick(e)) return
  if (spaceHeld.value) return
  if (suppressStageClick.value) {
    suppressStageClick.value = false
    return
  }

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
      clearQuickConnect()
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

// Double-click in select mode opens the Properties tab for the element.
const handleElementDblClick = (id, type, e) => {
  if (isRightClick(e)) return
  if (spaceHeld.value) return
  if (isTokenGameActive.value) return
  if (tool.value !== 'select') return

  e.cancelBubble = true
  clearQuickConnect()
  store.select(id, false)
  emit('open-properties')
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
    @mouseleave="handleCanvasMouseLeave"
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
      @drag-start="handleQuickConnectDragStart"
      @drag-move="handleQuickConnectDragMove"
      @drag-end="handleQuickConnectDragEnd"
      @drag-cancel="handleQuickConnectDragCancel"
    />

    <div
      v-if="quickConnectDrag"
      class="qc-drag-ghost"
      :style="{ left: `${quickConnectDrag.screenX}px`, top: `${quickConnectDrag.screenY}px` }"
    >
      <span class="qc-drag-ghost-icon">{{ quickConnectDrag.icon }}</span>
    </div>

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
          @dblclick="(e) => handleElementDblClick(arc.id, 'arc', e)"
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
          :draggable="canDragElements"
          :token-override="getTokenCount(place.id)"
          :is-token-game-active="isTokenGameActive"
          @click="(e) => handleElementClick(place.id, 'place', e)"
          @dblclick="(e) => handleElementDblClick(place.id, 'place', e)"
          @dragend="(e) => handleElementDragEnd(place.id, e)"
        />

        <!-- Transitions -->
        <TransitionNode
          v-for="transition in transitions"
          :key="transition.id"
          :transition="transition"
          :is-selected="selectedIds.includes(transition.id)"
          :draggable="canDragElements"
          :is-enabled="isTransitionEnabled(transition.id)"
          :is-token-game-active="isTokenGameActive"
          @click="(e) => handleElementClick(transition.id, 'transition', e)"
          @dblclick="(e) => handleElementDblClick(transition.id, 'transition', e)"
          @dragend="(e) => handleElementDragEnd(transition.id, e)"
        />

        <!-- Operators -->
        <OperatorNode
          v-for="operator in operators"
          :key="operator.id"
          :operator="operator"
          :is-selected="selectedIds.includes(operator.id)"
          :draggable="canDragElements"
          :is-enabled="isTransitionEnabled(operator.id)"
          :is-token-game-active="isTokenGameActive"
          @click="(e) => handleElementClick(operator.id, 'operator', e)"
          @dblclick="(e) => handleElementDblClick(operator.id, 'operator', e)"
          @dragend="(e) => handleElementDragEnd(operator.id, e)"
        />

        <!-- Subprocesses -->
        <SubProcessNode
          v-for="subprocess in subProcesses"
          :key="subprocess.id"
          :subprocess="subprocess"
          :is-selected="selectedIds.includes(subprocess.id)"
          :draggable="canDragElements"
          :is-enabled="tokenGameStore.isSubprocessEnabled(subprocess.id)"
          :is-token-game-active="isTokenGameActive"
          @click="(e) => handleElementClick(subprocess.id, 'subprocess', e)"
          @dblclick="(e) => handleElementDblClick(subprocess.id, 'subprocess', e)"
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
}

.marquee-selection {
  position: absolute;
  z-index: 15;
  border: 1px solid var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 15%, transparent);
  pointer-events: none;
}

.qc-drag-ghost {
  position: absolute;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-primary);
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-primary) 20%, var(--color-bg-secondary));
  color: var(--color-primary);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transform: translate(-50%, -50%);
  pointer-events: none;
  opacity: 0.9;
}

.qc-drag-ghost-icon {
  font-size: 16px;
  line-height: 1;
}
</style>
