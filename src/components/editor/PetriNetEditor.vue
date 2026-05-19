<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { usePetriNetStore } from '@/stores/petriNet'
import { useTokenGameStore } from '@/stores/tokenGame'
import { OperatorType } from '@/types/petri-net'
import EditorToolbar from './EditorToolbar.vue'
import EditorCanvas from './EditorCanvas.vue'
import PropertiesPanel from './PropertiesPanel.vue'
import ViewToolbar from './ViewToolbar.vue'
import OverviewPanel from './OverviewPanel.vue'
import BreadcrumbNav from './BreadcrumbNav.vue'
import TokenGameControls from '@/components/token-game/TokenGameControls.vue'
import AnalysisPanel from '@/components/analysis/AnalysisPanel.vue'
import SimulationPanel from '@/components/simulation/SimulationPanel.vue'
import ContextMenu from './ContextMenu.vue'
import { fileService } from '@/services/file/fileService'
import { useConfigStore } from '@/stores/config'
import { useAutoSave } from '@/composables/useAutoSave'
import { useHelpStore } from '@/stores/help'
import HelpDialog from '@/components/help/HelpDialog.vue'
import GuidedTour from '@/components/help/GuidedTour.vue'
import ChatPanel from '@/components/chat/ChatPanel.vue'

const { t } = useI18n()
const store = usePetriNetStore()
const tokenGameStore = useTokenGameStore()
const configStore = useConfigStore()
const helpStore = useHelpStore()
const { isRunning: isTokenGameActive } = storeToRefs(tokenGameStore)

// Auto-save
const { lastSaved } = useAutoSave()

// Context menu
const contextMenuRef = ref(null)

const handleContextMenu = (event) => {
  contextMenuRef.value?.show(event.x, event.y, event.elementId, event.elementType)
}

// Drag & Drop file opening
const isDragOver = ref(false)

const handleDragOver = (e) => {
  e.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = async (e) => {
  e.preventDefault()
  isDragOver.value = false

  const file = e.dataTransfer?.files?.[0]
  if (!file) return

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'pnml' && ext !== 'json') return

  try {
    const result = await fileService.importFile(file)
    if (result.success && result.net) {
      if (result.subNets && result.subNets.size > 0) {
        const allNets = { [result.net.id]: result.net }
        result.subNets.forEach((subNet, id) => { allNets[id] = subNet })
        store.loadNets(allNets, result.net.id)
      } else {
        store.loadNet(result.net)
      }
      configStore.addRecentFile({ name: file.name, path: file.name, format: ext })
    }
  } catch (err) {
    console.error('Drop import failed:', err)
  }
}

// Right panel tab
const rightPanelTab = ref('properties')

// Right panel collapsed state (start expanded by default)
const rightPanelCollapsed = ref(false)

// Resizable panel width
const PANEL_MIN_WIDTH = 280
const PANEL_DEFAULT_WIDTH = 360
const PANEL_MAX_WIDTH = 600
const rightPanelWidth = ref(PANEL_DEFAULT_WIDTH)
const isResizing = ref(false)

const rightPanelStyle = computed(() => {
  if (rightPanelCollapsed.value) return {}
  return { width: `${rightPanelWidth.value}px` }
})

const showTabLabels = computed(() => rightPanelWidth.value >= 340)

function startResize(e) {
  e.preventDefault()
  isResizing.value = true

  const startX = e.clientX
  const startWidth = rightPanelWidth.value

  const onMouseMove = (moveEvent) => {
    const delta = startX - moveEvent.clientX
    const newWidth = Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, startWidth + delta))
    rightPanelWidth.value = newWidth
  }

  const onMouseUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    setTimeout(updateCanvasDimensions, 50)
  }

  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function handleResizeDoubleClick() {
  if (rightPanelWidth.value < PANEL_DEFAULT_WIDTH + 20) {
    rightPanelWidth.value = PANEL_MAX_WIDTH
  } else {
    rightPanelWidth.value = PANEL_DEFAULT_WIDTH
  }
  setTimeout(updateCanvasDimensions, 50)
}

const toggleRightPanel = () => {
  rightPanelCollapsed.value = !rightPanelCollapsed.value
  setTimeout(updateCanvasDimensions, 250)
}

// Auto-switch to token game tab and expand panel when token game starts
watch(isTokenGameActive, (active) => {
  if (active) {
    rightPanelTab.value = 'tokenGame'
    rightPanelCollapsed.value = false
    setTimeout(updateCanvasDimensions, 250)
  }
})


// Canvas dimensions for viewport calculations
const canvasWidth = ref(800)
const canvasHeight = ref(600)

// Update canvas dimensions when canvas ref is available
const canvasRef = ref(null)

function updateCanvasDimensions() {
  if (canvasRef.value) {
    const rect = canvasRef.value.$el?.getBoundingClientRect()
    if (rect) {
      canvasWidth.value = rect.width
      canvasHeight.value = rect.height
    }
  }
}

// Initialize with a sample net demonstrating operators
onMounted(() => {
  // Start place with token
  const start = store.addPlace({ x: 100, y: 250 }, 'Start')
  store.updatePlace(start.id, { tokens: 1 })
  
  // AND-Split operator
  const andSplit = store.addOperator({ x: 250, y: 250 }, OperatorType.AND_SPLIT, 'Split')
  
  // Parallel branches
  const p1 = store.addPlace({ x: 400, y: 150 }, 'P1')
  const p2 = store.addPlace({ x: 400, y: 350 }, 'P2')
  
  // Transitions on branches
  const t1 = store.addTransition({ x: 550, y: 150 }, 'Task A')
  const t2 = store.addTransition({ x: 550, y: 350 }, 'Task B')
  
  // Places after tasks
  const p3 = store.addPlace({ x: 700, y: 150 }, 'P3')
  const p4 = store.addPlace({ x: 700, y: 350 }, 'P4')
  
  // AND-Join operator
  const andJoin = store.addOperator({ x: 850, y: 250 }, OperatorType.AND_JOIN, 'Join')
  
  // End place
  const end = store.addPlace({ x: 1000, y: 250 }, 'End')

  // Connect everything
  store.addArc(start.id, andSplit.id)
  store.addArc(andSplit.id, p1.id)
  store.addArc(andSplit.id, p2.id)
  store.addArc(p1.id, t1.id)
  store.addArc(p2.id, t2.id)
  store.addArc(t1.id, p3.id)
  store.addArc(t2.id, p4.id)
  store.addArc(p3.id, andJoin.id)
  store.addArc(p4.id, andJoin.id)
  store.addArc(andJoin.id, end.id)

  // Update canvas dimensions after mount
  setTimeout(updateCanvasDimensions, 100)

  // Initialize help system and show welcome tour on first visit
  helpStore.loadPersisted()
  if (!helpStore.hasSeenWelcome) {
    setTimeout(() => {
      helpStore.startTour('welcome')
      helpStore.markWelcomeSeen()
    }, 800)
  }
})
</script>

<template>
  <div
    class="petri-net-editor"
    :class="{ 'drag-over': isDragOver }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <EditorToolbar />
    <BreadcrumbNav />
    <div class="editor-main">
      <div class="canvas-container">
        <EditorCanvas 
          ref="canvasRef"
          @resize="updateCanvasDimensions"
          @contextmenu="handleContextMenu"
        />
        
        <!-- Floating View Toolbar -->
        <div class="view-toolbar-container">
          <ViewToolbar
            :canvas-width="canvasWidth"
            :canvas-height="canvasHeight"
          />
        </div>

        <!-- Floating Overview Panel -->
        <div class="overview-container">
          <OverviewPanel
            :canvas-width="canvasWidth"
            :canvas-height="canvasHeight"
          />
        </div>

      </div>
      
      <!-- Right Side Panel -->
      <div
        :class="['right-panel', { collapsed: rightPanelCollapsed, resizing: isResizing }]"
        :style="rightPanelStyle"
      >
        <!-- Resize handle -->
        <div
          v-if="!rightPanelCollapsed"
          class="resize-handle"
          @mousedown="startResize"
          @dblclick="handleResizeDoubleClick"
        ></div>

        <button class="collapse-toggle" @click="toggleRightPanel" :title="rightPanelCollapsed ? 'Expand' : 'Collapse'">
          {{ rightPanelCollapsed ? '◀' : '▶' }}
        </button>
        <template v-if="!rightPanelCollapsed">
          <div class="right-panel-tabs">
            <button
              :class="['tab-btn', { active: rightPanelTab === 'properties' }]"
              @click="rightPanelTab = 'properties'"
              :title="$t('properties.title')"
            >
              <span class="tab-icon">📋</span>
              <span v-if="showTabLabels" class="tab-label">{{ $t('properties.title') }}</span>
            </button>
            <button
              :class="['tab-btn', { active: rightPanelTab === 'tokenGame', highlight: isTokenGameActive }]"
              @click="rightPanelTab = 'tokenGame'"
              :title="$t('tokenGame.title')"
            >
              <span class="tab-icon">▶</span>
              <span v-if="showTabLabels" class="tab-label">{{ $t('tokenGame.title') }}</span>
            </button>
            <button
              :class="['tab-btn', { active: rightPanelTab === 'analysis' }]"
              @click="rightPanelTab = 'analysis'"
              :title="$t('analysis.title')"
            >
              <span class="tab-icon">🔍</span>
              <span v-if="showTabLabels" class="tab-label">{{ $t('analysis.title') }}</span>
            </button>
            <button
              :class="['tab-btn', { active: rightPanelTab === 'simulation' }]"
              @click="rightPanelTab = 'simulation'"
              :title="$t('simulation.title')"
            >
              <span class="tab-icon">📊</span>
              <span v-if="showTabLabels" class="tab-label">{{ $t('simulation.title') }}</span>
            </button>
            <button
              :class="['tab-btn', { active: rightPanelTab === 'chat' }]"
              @click="rightPanelTab = 'chat'"
              :title="$t('chat.title')"
            >
              <span class="tab-icon">💬</span>
              <span v-if="showTabLabels" class="tab-label">{{ $t('chat.title') }}</span>
            </button>
          </div>
          <div class="right-panel-content">
            <PropertiesPanel v-if="rightPanelTab === 'properties'" />
            <div v-else-if="rightPanelTab === 'tokenGame'" class="token-game-panel">
              <TokenGameControls />
            </div>
            <AnalysisPanel v-else-if="rightPanelTab === 'analysis'" />
            <SimulationPanel v-else-if="rightPanelTab === 'simulation'" />
            <ChatPanel v-else-if="rightPanelTab === 'chat'" />
          </div>
        </template>
      </div>
    </div>
    <ContextMenu ref="contextMenuRef" />

    <!-- Help system -->
    <HelpDialog />
    <GuidedTour />

    <!-- Drop overlay -->
    <div v-if="isDragOver" class="drop-overlay">
      <div class="drop-message">{{ $t('menu.dropToOpen') }}</div>
    </div>
  </div>
</template>

<style scoped>
.petri-net-editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background-color: var(--color-bg);
}

.editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.view-toolbar-container {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
}

.overview-container {
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 10;
}

/* Right Panel */
.right-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  flex-shrink: 0;
  transition: width 0.2s ease;
}

.right-panel.resizing {
  transition: none;
}

.right-panel.collapsed {
  width: 36px !important;
}

/* Resize handle */
.resize-handle {
  position: absolute;
  left: -3px;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  z-index: 25;
  transition: background 0.15s;
}

.resize-handle:hover,
.right-panel.resizing .resize-handle {
  background: var(--color-primary);
  opacity: 0.4;
}

.collapse-toggle {
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 48px;
  border: 1px solid var(--color-border);
  border-radius: 6px 0 0 6px;
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  z-index: 20;
  transition: all 0.15s;
}

.collapse-toggle:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}

.right-panel.collapsed .collapse-toggle {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.right-panel.collapsed .collapse-toggle:hover {
  background: #2563eb;
}

.right-panel-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
}

.tab-btn {
  flex: 1;
  padding: 8px 4px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-width: 0;
}

.tab-icon {
  font-size: 15px;
  flex-shrink: 0;
}

.tab-label {
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-btn:hover {
  color: var(--color-text);
  background: var(--color-bg-hover);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.right-panel-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.right-panel-content > * {
  flex: 1;
  overflow-y: auto;
}

.tab-btn.highlight {
  color: #22c55e;
}

.tab-btn.highlight.active {
  color: #22c55e;
  border-bottom-color: #22c55e;
}

.token-game-panel {
  padding: 12px;
}

.token-game-panel :deep(.token-game-controls) {
  min-width: unset;
  box-shadow: none;
  border: none;
  background: transparent;
}

/* Drag & drop overlay */
.petri-net-editor.drag-over {
  outline: 3px dashed var(--color-primary);
  outline-offset: -3px;
}

.drop-overlay {
  position: absolute;
  inset: 0;
  background: rgba(59, 130, 246, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  pointer-events: none;
}

.drop-message {
  padding: 16px 32px;
  background: var(--color-bg-secondary);
  border: 2px dashed var(--color-primary);
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
}
</style>
