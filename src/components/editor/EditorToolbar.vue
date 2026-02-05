<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePetriNetStore } from '@/stores/petriNet'
import { OperatorType, OPERATOR_INFO } from '@/types/petri-net'

const store = usePetriNetStore()
const { tool, canUndo, canRedo, viewport, selectedOperatorType } = storeToRefs(store)

// Operator dropdown state
const showOperatorMenu = ref(false)

// Tool definitions
const tools = [
  { id: 'select', label: 'Select', shortcut: 'V', icon: '↖' },
  { id: 'place', label: 'Place', shortcut: 'P', icon: '○' },
  { id: 'transition', label: 'Transition', shortcut: 'T', icon: '□' },
  { id: 'operator', label: 'Operator', shortcut: 'O', icon: '◇', hasDropdown: true },
  { id: 'arc', label: 'Arc', shortcut: 'A', icon: '→' },
  { id: 'delete', label: 'Delete', shortcut: 'D', icon: '✕' },
]

// Operator types for dropdown
const operatorTypes = [
  { type: OperatorType.AND_SPLIT, label: 'AND-Split', icon: '◇→' },
  { type: OperatorType.AND_JOIN, label: 'AND-Join', icon: '→◇' },
  { type: OperatorType.XOR_SPLIT, label: 'XOR-Split', icon: '⊗→' },
  { type: OperatorType.XOR_JOIN, label: 'XOR-Join', icon: '→⊗' },
  { type: OperatorType.AND_SPLIT_JOIN, label: 'AND-Split-Join', icon: '◇◇' },
  { type: OperatorType.XOR_SPLIT_JOIN, label: 'XOR-Split-Join', icon: '⊗⊗' },
  { type: OperatorType.AND_JOIN_XOR_SPLIT, label: 'AND-Join/XOR-Split', icon: '◇⊗' },
  { type: OperatorType.XOR_JOIN_AND_SPLIT, label: 'XOR-Join/AND-Split', icon: '⊗◇' },
]

// Get current operator info
const currentOperatorInfo = () => OPERATOR_INFO[selectedOperatorType.value]

// Handle tool click
const handleToolClick = (toolId) => {
  if (toolId === 'operator') {
    showOperatorMenu.value = !showOperatorMenu.value
    store.setTool('operator')
  } else {
    showOperatorMenu.value = false
    store.setTool(toolId)
  }
}

// Handle operator type selection
const selectOperatorType = (type) => {
  store.setSelectedOperatorType(type)
  store.setTool('operator')
  showOperatorMenu.value = false
}

// Close dropdown when clicking outside
const handleClickOutside = (e) => {
  if (!e.target.closest('.operator-dropdown')) {
    showOperatorMenu.value = false
  }
}

// Handle keyboard shortcuts
const handleKeydown = (e) => {
  // Ignore if typing in input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return
  }

  // Tool shortcuts
  switch (e.key.toLowerCase()) {
    case 'v':
      store.setTool('select')
      showOperatorMenu.value = false
      break
    case 'p':
      store.setTool('place')
      showOperatorMenu.value = false
      break
    case 't':
      store.setTool('transition')
      showOperatorMenu.value = false
      break
    case 'o':
      store.setTool('operator')
      showOperatorMenu.value = !showOperatorMenu.value
      break
    case 'a':
      store.setTool('arc')
      showOperatorMenu.value = false
      break
    case 'd':
      store.setTool('delete')
      showOperatorMenu.value = false
      break
    case 'delete':
    case 'backspace':
      store.deleteSelected()
      break
    case 'z':
      if (e.metaKey || e.ctrlKey) {
        if (e.shiftKey) {
          store.redo()
        } else {
          store.undo()
        }
        e.preventDefault()
      }
      break
    case 'y':
      if (e.metaKey || e.ctrlKey) {
        store.redo()
        e.preventDefault()
      }
      break
    case 'escape':
      store.cancelArcCreation()
      store.clearSelection()
      showOperatorMenu.value = false
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('click', handleClickOutside)
})

// Format zoom percentage
const zoomPercent = () => Math.round(viewport.value.scale * 100)
</script>

<template>
  <div class="editor-toolbar">
    <!-- Tool buttons -->
    <div class="toolbar-group">
      <template v-for="t in tools" :key="t.id">
        <!-- Regular tool button -->
        <button
          v-if="!t.hasDropdown"
          :class="['tool-btn', { active: tool === t.id }]"
          :title="`${t.label} (${t.shortcut})`"
          @click="handleToolClick(t.id)"
        >
          <span class="tool-icon">{{ t.icon }}</span>
          <span class="tool-label">{{ t.label }}</span>
        </button>

        <!-- Operator button with dropdown -->
        <div v-else class="operator-dropdown">
          <button
            :class="['tool-btn', { active: tool === 'operator' }]"
            :title="`${t.label} (${t.shortcut})`"
            @click.stop="handleToolClick('operator')"
          >
            <span class="tool-icon">{{ currentOperatorInfo()?.symbol || t.icon }}</span>
            <span class="tool-label">{{ currentOperatorInfo()?.label || t.label }}</span>
            <span class="dropdown-arrow">▾</span>
          </button>

          <!-- Dropdown menu -->
          <div v-if="showOperatorMenu" class="operator-menu">
            <div class="operator-menu-header">Select Operator Type</div>
            <button
              v-for="op in operatorTypes"
              :key="op.type"
              :class="['operator-option', { selected: selectedOperatorType === op.type }]"
              @click="selectOperatorType(op.type)"
            >
              <span class="op-icon">{{ op.icon }}</span>
              <span class="op-label">{{ op.label }}</span>
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Separator -->
    <div class="toolbar-separator"></div>

    <!-- History buttons -->
    <div class="toolbar-group">
      <button
        class="tool-btn"
        :disabled="!canUndo"
        title="Undo (Ctrl+Z)"
        @click="store.undo()"
      >
        <span class="tool-icon">↩</span>
        <span class="tool-label">Undo</span>
      </button>
      <button
        class="tool-btn"
        :disabled="!canRedo"
        title="Redo (Ctrl+Y)"
        @click="store.redo()"
      >
        <span class="tool-icon">↪</span>
        <span class="tool-label">Redo</span>
      </button>
    </div>

    <!-- Separator -->
    <div class="toolbar-separator"></div>

    <!-- Zoom controls -->
    <div class="toolbar-group">
      <button
        class="tool-btn"
        title="Zoom Out"
        @click="store.zoomOut()"
      >
        <span class="tool-icon">−</span>
      </button>
      <span class="zoom-display">{{ zoomPercent() }}%</span>
      <button
        class="tool-btn"
        title="Zoom In"
        @click="store.zoomIn()"
      >
        <span class="tool-icon">+</span>
      </button>
      <button
        class="tool-btn"
        title="Reset Zoom"
        @click="store.resetZoom()"
      >
        <span class="tool-icon">⟲</span>
      </button>
    </div>

    <!-- Spacer -->
    <div class="toolbar-spacer"></div>

    <!-- Net info -->
    <div class="toolbar-info">
      <span>{{ store.net.name }}</span>
    </div>
  </div>
</template>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  gap: 8px;
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
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #ffffff;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.tool-btn.active {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tool-icon {
  font-size: 16px;
  line-height: 1;
}

.tool-label {
  font-size: 12px;
}

.dropdown-arrow {
  font-size: 10px;
  margin-left: 4px;
}

/* Operator dropdown */
.operator-dropdown {
  position: relative;
}

.operator-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 200px;
  overflow: hidden;
}

.operator-menu-header {
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.operator-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background-color: transparent;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.1s ease;
  text-align: left;
}

.operator-option:hover {
  background-color: #f3f4f6;
}

.operator-option.selected {
  background-color: #eff6ff;
  color: #3b82f6;
}

.op-icon {
  font-size: 16px;
  width: 24px;
  text-align: center;
}

.op-label {
  flex: 1;
}

.toolbar-separator {
  width: 1px;
  height: 24px;
  background-color: #e5e7eb;
  margin: 0 8px;
}

.toolbar-spacer {
  flex: 1;
}

.zoom-display {
  min-width: 50px;
  text-align: center;
  font-size: 12px;
  color: #6b7280;
}

.toolbar-info {
  font-size: 13px;
  color: #6b7280;
}
</style>
