<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { usePetriNetStore } from '@/stores/petriNet'
import { useConfigStore } from '@/stores/config'
import { useViewport } from '@/composables/useViewport'
import { autoLayout } from '@/utils/layout'
import LayoutSettings from './LayoutSettings.vue'

const { t } = useI18n()

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
const { net, viewport } = storeToRefs(store)
const { zoomPercent, fitToView } = useViewport()

// Config store for grid settings
const configStore = useConfigStore()

// Grid state from config store
// Note: Using $state explicitly ensures proper Vue reactivity tracking
// for nested properties in Pinia stores.
const showGrid = computed(() => configStore.$state.editor.showGrid)
const snapToGrid = computed(() => configStore.$state.editor.snapToGrid)

// Layout settings
const showLayoutMenu = ref(false)
const layoutAlgorithm = ref('hierarchical')
const layoutDirection = ref('LR')
const nodeSpacing = ref(80)
const rankSpacing = ref(120)

// Layout algorithms for dropdown
const algorithms = computed(() => [
  { id: 'hierarchical', label: t('layout.hierarchical') },
  { id: 'force', label: t('layout.forceDirected') },
  { id: 'grid', label: t('layout.grid') },
])

// Directions for dropdown
const directions = computed(() => [
  { id: 'LR', label: t('layout.leftToRight') },
  { id: 'TB', label: t('layout.topToBottom') },
  { id: 'RL', label: t('layout.rightToLeft') },
  { id: 'BT', label: t('layout.bottomToTop') },
])

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

// Toggle grid visibility via store action
// Using store action ensures proper reactivity and persistence
function toggleGrid() {
  configStore.toggleShowGrid()
}

// Toggle snap to grid via store action
function toggleSnap() {
  configStore.toggleSnapToGrid()
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
      <button class="tool-btn small" :title="$t('toolbar.zoomOut')" @click="store.zoomOut()">
        <span>−</span>
      </button>
      <span class="zoom-display">{{ zoomPercent }}%</span>
      <button class="tool-btn small" :title="$t('toolbar.zoomIn')" @click="store.zoomIn()">
        <span>+</span>
      </button>
      <button class="tool-btn" :title="$t('toolbar.fitToView')" @click="handleFitToView">
        <span class="icon">⊡</span>
        <span class="label">{{ $t('toolbar.fit') }}</span>
      </button>
    </div>

    <div class="toolbar-separator"></div>

    <!-- Rotation controls -->
    <div class="toolbar-group">
      <button class="tool-btn small" :title="$t('toolbar.rotateCCW')" @click="store.rotateCCW()">
        <span>↺</span>
      </button>
      <span class="zoom-display">{{ viewport.rotation || 0 }}°</span>
      <button class="tool-btn small" :title="$t('toolbar.rotateCW')" @click="store.rotateCW()">
        <span>↻</span>
      </button>
    </div>

    <div class="toolbar-separator"></div>

    <!-- Grid controls -->
    <div class="toolbar-group">
      <button
        :class="['tool-btn', { active: showGrid }]"
        :title="$t('toolbar.toggleGrid')"
        @click="toggleGrid"
      >
        <span class="icon">▦</span>
        <span class="label">{{ $t('toolbar.grid') }}</span>
      </button>
      <button
        :class="['tool-btn', { active: snapToGrid }]"
        :title="$t('toolbar.snapToGrid')"
        @click="toggleSnap"
      >
        <span class="icon">⊞</span>
        <span class="label">{{ $t('toolbar.snap') }}</span>
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
        <span class="label">{{ $t('layout.autoLayout') }}</span>
        <span class="dropdown-arrow">▾</span>
      </button>

      <!-- Layout menu (extracted component) -->
      <div v-if="showLayoutMenu" class="layout-menu">
        <LayoutSettings
          :canvas-width="canvasWidth"
          :canvas-height="canvasHeight"
          @applied="showLayoutMenu = false"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-toolbar {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
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
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-btn:hover {
  background-color: var(--color-bg-tertiary);
  border-color: var(--color-border);
}

.tool-btn.active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: #ffffff;
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
  background-color: var(--color-border);
  margin: 0 4px;
}

.zoom-display {
  min-width: 45px;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-muted);
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
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
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
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.menu-field {
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-border-light);
}

.menu-field:last-of-type {
  border-bottom: none;
}

.menu-field label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}

.menu-field select,
.menu-field input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 13px;
  color: var(--color-text);
  background-color: var(--color-bg-secondary);
  box-sizing: border-box;
}

.menu-field select:focus,
.menu-field input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.menu-actions {
  padding: 10px 14px;
  background-color: var(--color-bg);
  border-top: 1px solid var(--color-border);
}

.apply-btn {
  width: 100%;
  padding: 8px 16px;
  background-color: var(--color-primary);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.apply-btn:hover {
  background-color: var(--color-primary-hover);
}
</style>
