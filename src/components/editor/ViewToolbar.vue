<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePetriNetStore } from '@/stores/petriNet'
import { useViewport } from '@/composables/useViewport'
import { autoLayout } from '@/utils/layout'

const props = defineProps({
  canvasWidth: {
    type: Number,
    default: 800,
  },
  canvasHeight: {
    type: Number,
    default: 600,
  },
})

const store = usePetriNetStore()
const { net } = storeToRefs(store)
const { zoomPercent, fitToView } = useViewport()

// Layout settings
const showLayoutMenu = ref(false)
const layoutAlgorithm = ref('hierarchical')
const layoutDirection = ref('LR')
const nodeSpacing = ref(80)
const rankSpacing = ref(120)

// Grid toggle
const showGrid = ref(true)
const snapToGrid = ref(true)

// Emit grid settings
const emit = defineEmits(['update:showGrid', 'update:snapToGrid'])

// Layout algorithms for dropdown
const algorithms = [
  { id: 'hierarchical', label: 'Hierarchical' },
  { id: 'force', label: 'Force-Directed' },
  { id: 'grid', label: 'Grid' },
]

// Directions for dropdown
const directions = [
  { id: 'LR', label: 'Left → Right' },
  { id: 'TB', label: 'Top → Bottom' },
  { id: 'RL', label: 'Right → Left' },
  { id: 'BT', label: 'Bottom → Top' },
]

// Apply layout
function applyLayout() {
  const result = autoLayout(net.value, {
    algorithm: layoutAlgorithm.value,
    direction: layoutDirection.value,
    nodeSpacing: nodeSpacing.value,
    rankSpacing: rankSpacing.value,
  })

  if (result.success) {
    store.applyLayout(result.positions)
    // Fit view after layout
    setTimeout(() => {
      fitToView(props.canvasWidth, props.canvasHeight)
    }, 50)
  }

  showLayoutMenu.value = false
}

// Toggle grid
function toggleGrid() {
  showGrid.value = !showGrid.value
  emit('update:showGrid', showGrid.value)
}

// Toggle snap
function toggleSnap() {
  snapToGrid.value = !snapToGrid.value
  emit('update:snapToGrid', snapToGrid.value)
}

// Handle fit to view
function handleFitToView() {
  fitToView(props.canvasWidth, props.canvasHeight)
}

// Close menu when clicking outside
function handleClickOutside(e) {
  if (!e.target.closest('.layout-dropdown')) {
    showLayoutMenu.value = false
  }
}
</script>

<template>
  <div class="view-toolbar" @click.stop>
    <!-- Zoom controls -->
    <div class="toolbar-group">
      <button class="tool-btn small" title="Zoom Out" @click="store.zoomOut()">
        <span>−</span>
      </button>
      <span class="zoom-display">{{ zoomPercent }}%</span>
      <button class="tool-btn small" title="Zoom In" @click="store.zoomIn()">
        <span>+</span>
      </button>
      <button class="tool-btn" title="Fit to View" @click="handleFitToView">
        <span class="icon">⊡</span>
        <span class="label">Fit</span>
      </button>
    </div>

    <div class="toolbar-separator"></div>

    <!-- Grid controls -->
    <div class="toolbar-group">
      <button
        :class="['tool-btn', { active: showGrid }]"
        title="Toggle Grid"
        @click="toggleGrid"
      >
        <span class="icon">▦</span>
        <span class="label">Grid</span>
      </button>
      <button
        :class="['tool-btn', { active: snapToGrid }]"
        title="Snap to Grid"
        @click="toggleSnap"
      >
        <span class="icon">⊞</span>
        <span class="label">Snap</span>
      </button>
    </div>

    <div class="toolbar-separator"></div>

    <!-- Layout controls -->
    <div class="toolbar-group layout-dropdown">
      <button
        :class="['tool-btn', { active: showLayoutMenu }]"
        @click="showLayoutMenu = !showLayoutMenu"
      >
        <span class="icon">⬡</span>
        <span class="label">Auto Layout</span>
        <span class="dropdown-arrow">▾</span>
      </button>

      <!-- Layout menu -->
      <div v-if="showLayoutMenu" class="layout-menu">
        <div class="menu-header">Layout Settings</div>

        <div class="menu-field">
          <label>Algorithm</label>
          <select v-model="layoutAlgorithm">
            <option v-for="algo in algorithms" :key="algo.id" :value="algo.id">
              {{ algo.label }}
            </option>
          </select>
        </div>

        <div class="menu-field">
          <label>Direction</label>
          <select v-model="layoutDirection">
            <option v-for="dir in directions" :key="dir.id" :value="dir.id">
              {{ dir.label }}
            </option>
          </select>
        </div>

        <div class="menu-field">
          <label>Node Spacing</label>
          <input v-model.number="nodeSpacing" type="number" min="40" max="200" step="10" />
        </div>

        <div class="menu-field">
          <label>Rank Spacing</label>
          <input v-model.number="rankSpacing" type="number" min="60" max="300" step="10" />
        </div>

        <div class="menu-actions">
          <button class="apply-btn" @click="applyLayout">Apply Layout</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-toolbar {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background-color: rgba(255, 255, 255, 0.95);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  gap: 6px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid transparent;
  border-radius: 6px;
  background-color: transparent;
  color: #374151;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-btn:hover {
  background-color: #f3f4f6;
  border-color: #e5e7eb;
}

.tool-btn.active {
  background-color: #eff6ff;
  border-color: #3b82f6;
  color: #3b82f6;
}

.tool-btn.small {
  padding: 4px 8px;
  font-size: 16px;
  font-weight: 500;
}

.tool-btn .icon {
  font-size: 14px;
}

.tool-btn .label {
  font-size: 12px;
}

.dropdown-arrow {
  font-size: 10px;
  margin-left: 2px;
}

.toolbar-separator {
  width: 1px;
  height: 20px;
  background-color: #e5e7eb;
  margin: 0 4px;
}

.zoom-display {
  min-width: 45px;
  text-align: center;
  font-size: 12px;
  color: #6b7280;
}

/* Layout dropdown menu */
.layout-dropdown {
  position: relative;
}

.layout-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 220px;
  overflow: hidden;
}

.menu-header {
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.menu-field {
  padding: 10px 14px;
  border-bottom: 1px solid #f3f4f6;
}

.menu-field:last-of-type {
  border-bottom: none;
}

.menu-field label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 6px;
}

.menu-field select,
.menu-field input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
  color: #111827;
  background-color: #ffffff;
  box-sizing: border-box;
}

.menu-field select:focus,
.menu-field input:focus {
  outline: none;
  border-color: #3b82f6;
}

.menu-actions {
  padding: 10px 14px;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.apply-btn {
  width: 100%;
  padding: 8px 16px;
  background-color: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.apply-btn:hover {
  background-color: #2563eb;
}
</style>
