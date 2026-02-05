<script setup>
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePetriNetStore } from '@/stores/petriNet'
import { useTokenGameStore } from '@/stores/tokenGame'
import { OperatorType } from '@/types/petri-net'
import EditorToolbar from './EditorToolbar.vue'
import EditorCanvas from './EditorCanvas.vue'
import PropertiesPanel from './PropertiesPanel.vue'
import ViewToolbar from './ViewToolbar.vue'
import OverviewPanel from './OverviewPanel.vue'
import TokenGameControls from '@/components/token-game/TokenGameControls.vue'

const store = usePetriNetStore()
const tokenGameStore = useTokenGameStore()
const { isRunning: isTokenGameActive } = storeToRefs(tokenGameStore)

// Canvas dimensions for viewport calculations
const canvasWidth = ref(800)
const canvasHeight = ref(600)

// Grid settings
const showGrid = ref(true)
const snapToGrid = ref(true)

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
    <div class="editor-main">
      <div class="canvas-container">
        <EditorCanvas 
          ref="canvasRef"
          :show-grid="showGrid"
          @resize="updateCanvasDimensions"
        />
        
        <!-- Floating View Toolbar -->
        <div class="view-toolbar-container">
          <ViewToolbar
            :canvas-width="canvasWidth"
            :canvas-height="canvasHeight"
            @update:show-grid="showGrid = $event"
            @update:snap-to-grid="snapToGrid = $event"
          />
        </div>

        <!-- Floating Overview Panel -->
        <div class="overview-container">
          <OverviewPanel
            :canvas-width="canvasWidth"
            :canvas-height="canvasHeight"
          />
        </div>

        <!-- Token Game Controls (floating, bottom-right) -->
        <div class="token-game-container">
          <TokenGameControls />
        </div>
      </div>
      <PropertiesPanel v-if="!isTokenGameActive" />
    </div>
  </div>
</template>

<style scoped>
.petri-net-editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background-color: #f9fafb;
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

.token-game-container {
  position: absolute;
  bottom: 12px;
  right: 12px;
  z-index: 10;
}
</style>
