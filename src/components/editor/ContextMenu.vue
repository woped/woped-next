<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePetriNetStore } from '@/stores/petriNet'
import { isOperator, isSubProcess } from '@/types/petri-net'

const { t } = useI18n()
const store = usePetriNetStore()

const visible = ref(false)
const position = ref({ x: 0, y: 0 })
const targetId = ref(null)
const targetType = ref(null)

function show(x, y, elementId, elementType) {
  targetId.value = elementId
  targetType.value = elementType
  position.value = { x, y }
  visible.value = true
}

function hide() {
  visible.value = false
  targetId.value = null
  targetType.value = null
}

function handleDelete() {
  if (targetId.value) store.deleteElement(targetId.value)
  hide()
}

function handleSelect() {
  if (targetId.value) store.select(targetId.value, false)
  hide()
}

function handleDuplicate() {
  if (!targetId.value) return
  const net = store.net
  const offset = 40

  const place = net.places.find(p => p.id === targetId.value)
  if (place) {
    const dup = store.addPlace({ x: place.position.x + offset, y: place.position.y + offset }, place.name + ' (copy)')
    store.updatePlace(dup.id, { tokens: place.tokens, capacity: place.capacity })
  }

  const trans = net.transitions.find(t => t.id === targetId.value)
  if (trans && !isOperator(trans) && !isSubProcess(trans)) {
    store.addTransition({ x: trans.position.x + offset, y: trans.position.y + offset }, trans.name + ' (copy)')
  }

  hide()
}

function handleProperties() {
  if (targetId.value) store.select(targetId.value, false)
  hide()
}

function handleOpenSubprocess() {
  if (targetId.value) store.openSubProcess(targetId.value)
  hide()
}

function onClickOutside() {
  if (visible.value) hide()
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})

defineExpose({ show, hide })
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="context-menu"
      :style="{ left: position.x + 'px', top: position.y + 'px' }"
      @click.stop
    >
      <button class="cm-item" @click="handleSelect">
        {{ $t('contextMenu.select') }}
      </button>
      <button v-if="targetType === 'place' || targetType === 'transition'" class="cm-item" @click="handleDuplicate">
        {{ $t('contextMenu.duplicate') }}
      </button>
      <button v-if="targetType === 'subprocess'" class="cm-item" @click="handleOpenSubprocess">
        {{ $t('contextMenu.openSubprocess') }}
      </button>
      <button class="cm-item" @click="handleProperties">
        {{ $t('contextMenu.properties') }}
      </button>
      <div class="cm-separator" />
      <button class="cm-item danger" @click="handleDelete">
        {{ $t('contextMenu.delete') }}
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 160px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  padding: 4px 0;
  font-size: 13px;
}

.cm-item {
  display: block;
  width: 100%;
  padding: 8px 14px;
  border: none;
  background: none;
  text-align: left;
  color: var(--color-text);
  cursor: pointer;
}

.cm-item:hover {
  background: var(--color-bg-tertiary);
}

.cm-item.danger {
  color: var(--color-error);
}

.cm-item.danger:hover {
  background: #fef2f2;
}

:global(.dark) .cm-item.danger:hover {
  background: rgba(239, 68, 68, 0.15);
}

.cm-separator {
  height: 1px;
  background: var(--color-border);
  margin: 4px 0;
}
</style>
