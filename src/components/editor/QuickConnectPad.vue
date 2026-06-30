<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { usePetriNetStore } from '@/stores/petriNet'
import { useConfigStore } from '@/stores/config'
import { OperatorType } from '@/types/petri-net'
import { getQuickConnectOptions } from '@/utils/quickConnect'
import OperatorAalstIcon from '@/components/editor/OperatorAalstIcon.vue'

const props = defineProps({
  elementId: {
    type: String,
    required: true,
  },
  elementType: {
    type: String,
    required: true,
  },
  screenX: {
    type: Number,
    required: true,
  },
  screenY: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['connect', 'drag-start', 'drag-move', 'drag-end', 'drag-cancel'])

const { t } = useI18n()
const store = usePetriNetStore()
const configStore = useConfigStore()
const { operatorNotation } = storeToRefs(configStore)

const showOperatorSubmenu = ref(false)

// Drag-and-drop: pressing a suggestion and dragging lets the user drop the new
// element anywhere on the canvas instead of using its auto-placed position.
const DRAG_THRESHOLD = 5
const suppressClick = ref(false)
let dragData = null

const isVanDerAalst = computed(() => operatorNotation.value === 'vanDerAalst')
const options = computed(() => getQuickConnectOptions(props.elementType))

const operatorTypes = computed(() => [
  { type: OperatorType.AND_SPLIT, label: t('operators.andSplit'), icon: '◇→' },
  { type: OperatorType.AND_JOIN, label: t('operators.andJoin'), icon: '→◇' },
  { type: OperatorType.XOR_SPLIT, label: t('operators.xorSplit'), icon: '⊗→' },
  { type: OperatorType.XOR_JOIN, label: t('operators.xorJoin'), icon: '→⊗' },
  { type: OperatorType.AND_SPLIT_JOIN, label: 'AND-Split-Join', icon: '◇◇' },
  { type: OperatorType.XOR_SPLIT_JOIN, label: 'XOR-Split-Join', icon: '⊗⊗' },
  { type: OperatorType.AND_JOIN_XOR_SPLIT, label: 'AND-Join/XOR-Split', icon: '◇⊗' },
  { type: OperatorType.XOR_JOIN_AND_SPLIT, label: 'XOR-Join/AND-Split', icon: '⊗◇' },
])

function handleConnect(target) {
  if (suppressClick.value) return
  if (target === 'operator') {
    showOperatorSubmenu.value = !showOperatorSubmenu.value
    return
  }
  showOperatorSubmenu.value = false
  const newId = store.quickConnectAdd(props.elementId, target)
  if (newId) emit('connect', newId)
}

function handleOperatorConnect(type) {
  if (suppressClick.value) return
  showOperatorSubmenu.value = false
  const newId = store.quickConnectAdd(props.elementId, 'operator', type)
  if (newId) emit('connect', newId)
}

function iconFor(target, operatorType) {
  if (operatorType !== undefined) {
    const op = operatorTypes.value.find((o) => o.type === operatorType)
    return op ? op.icon : '◇'
  }
  const opt = options.value.find((o) => o.target === target)
  return opt ? opt.icon : ''
}

function onItemMouseDown(e, target, operatorType) {
  // Only the primary button starts a drag; the operator parent button (no type)
  // only toggles its submenu, so it is not draggable.
  if (e.button !== 0) return
  if (target === 'operator' && operatorType === undefined) return

  e.preventDefault()
  dragData = { startX: e.clientX, startY: e.clientY, target, operatorType, started: false }
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragUp)
  window.addEventListener('keydown', onDragKey)
}

function onDragMove(e) {
  if (!dragData) return

  if (!dragData.started) {
    const dx = Math.abs(e.clientX - dragData.startX)
    const dy = Math.abs(e.clientY - dragData.startY)
    if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) return

    dragData.started = true
    suppressClick.value = true
    showOperatorSubmenu.value = false
    emit('drag-start', {
      target: dragData.target,
      operatorType: dragData.operatorType,
      icon: iconFor(dragData.target, dragData.operatorType),
    })
  }

  emit('drag-move', { clientX: e.clientX, clientY: e.clientY })
}

function onDragUp(e) {
  removeDragListeners()
  const wasDragging = dragData?.started
  dragData = null

  if (wasDragging) {
    emit('drag-end', { clientX: e.clientX, clientY: e.clientY })
    // The trailing click (fired right after mouseup) must be ignored so we
    // don't also create an auto-placed element. Reset after that click.
    setTimeout(() => {
      suppressClick.value = false
    }, 0)
  }
}

function onDragKey(e) {
  if (e.key === 'Escape') cancelDrag()
}

function cancelDrag() {
  removeDragListeners()
  if (dragData?.started) emit('drag-cancel')
  dragData = null
  suppressClick.value = false
}

function removeDragListeners() {
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragUp)
  window.removeEventListener('keydown', onDragKey)
}

onUnmounted(removeDragListeners)
</script>

<template>
  <div
    class="quick-connect-pad"
    :style="{ left: `${screenX}px`, top: `${screenY}px` }"
    @mousedown.stop
    @click.stop
    @contextmenu.prevent.stop
  >
    <div
      v-for="opt in options"
      :key="opt.target"
      class="qc-item"
    >
      <button
        :class="['qc-btn', { active: opt.target === 'operator' && showOperatorSubmenu }]"
        :title="opt.target === 'operator' ? t(opt.labelKey) : `${t(opt.labelKey)} — ${t('quickConnect.dragHint')}`"
        :aria-label="t(opt.labelKey)"
        :aria-expanded="opt.target === 'operator' ? showOperatorSubmenu : undefined"
        @mousedown="onItemMouseDown($event, opt.target)"
        @click="handleConnect(opt.target)"
      >
        <span class="qc-icon">{{ opt.icon }}</span>
      </button>

      <div
        v-if="opt.target === 'operator' && showOperatorSubmenu"
        class="qc-submenu"
        role="menu"
      >
        <div class="qc-submenu-header">{{ $t('operators.selectType') }}</div>
        <button
          v-for="op in operatorTypes"
          :key="op.type"
          class="qc-submenu-item"
          role="menuitem"
          :title="`${op.label} — ${t('quickConnect.dragHint')}`"
          @mousedown="onItemMouseDown($event, 'operator', op.type)"
          @click="handleOperatorConnect(op.type)"
        >
          <span class="qc-submenu-icon">
            <OperatorAalstIcon v-if="isVanDerAalst" :type="op.type" />
            <template v-else>{{ op.icon }}</template>
          </span>
          <span class="qc-submenu-label">{{ op.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quick-connect-pad {
  position: absolute;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transform: translateY(-50%);
  pointer-events: auto;
}

.qc-item {
  position: relative;
}

.qc-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transition: all 0.15s ease;
}

.qc-btn:hover,
.qc-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  transform: scale(1.08);
}

.qc-icon {
  font-size: 15px;
  line-height: 1;
}

.qc-submenu {
  position: absolute;
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  min-width: 190px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  z-index: 21;
}

.qc-submenu-header {
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.qc-submenu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.1s ease;
}

.qc-submenu-item:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}

.qc-submenu-icon {
  width: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.qc-submenu-label {
  flex: 1;
  white-space: nowrap;
}
</style>
