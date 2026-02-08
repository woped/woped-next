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

const { t } = useI18n()
const store = usePetriNetStore()
const tokenGameStore = useTokenGameStore()
const { isRunning: isTokenGameActive } = storeToRefs(tokenGameStore)

// Right panel tab
const rightPanelTab = ref('properties')

// Right panel collapsed state (start expanded by default)
const rightPanelCollapsed = ref(false)

const toggleRightPanel = () => {
  rightPanelCollapsed.value = !rightPanelCollapsed.value
  // Trigger canvas resize after panel animation
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
})
</script>

<template>
  <div class="petri-net-editor">
    <EditorToolbar />
    <BreadcrumbNav />
    <div class="editor-main">
      <div class="canvas-container">
        <EditorCanvas 
          ref="canvasRef"
          @resize="updateCanvasDimensions"
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
      <div :class="['right-panel', { collapsed: rightPanelCollapsed }]">
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
              📋
            </button>
            <button
              :class="['tab-btn', { active: rightPanelTab === 'tokenGame', highlight: isTokenGameActive }]"
              @click="rightPanelTab = 'tokenGame'"
              :title="$t('tokenGame.title')"
            >
              ▶
            </button>
            <button
              :class="['tab-btn', { active: rightPanelTab === 'analysis' }]"
              @click="rightPanelTab = 'analysis'"
              :title="$t('analysis.title')"
            >
              🔍
            </button>
            <button
              :class="['tab-btn', { active: rightPanelTab === 'simulation' }]"
              @click="rightPanelTab = 'simulation'"
              :title="$t('simulation.title')"
            >
              📊
            </button>
          </div>
          <div class="right-panel-content">
            <PropertiesPanel v-if="rightPanelTab === 'properties'" />
            <div v-else-if="rightPanelTab === 'tokenGame'" class="token-game-panel">
              <TokenGameControls />
            </div>
            <AnalysisPanel v-else-if="rightPanelTab === 'analysis'" />
            <SimulationPanel v-else-if="rightPanelTab === 'simulation'" />
          </div>
        </template>
      </div>
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
  width: 320px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  flex-shrink: 0;
  transition: width 0.2s ease;
}

.right-panel.collapsed {
  width: 36px;
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
  padding: 10px 8px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-muted);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.15s;
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
</style>
