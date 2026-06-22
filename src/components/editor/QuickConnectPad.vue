<script setup>
import { ref, computed } from 'vue'
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

const emit = defineEmits(['connect'])

const { t } = useI18n()
const store = usePetriNetStore()
const configStore = useConfigStore()
const { operatorNotation } = storeToRefs(configStore)

const showOperatorSubmenu = ref(false)

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
  if (target === 'operator') {
    showOperatorSubmenu.value = !showOperatorSubmenu.value
    return
  }
  showOperatorSubmenu.value = false
  const newId = store.quickConnectAdd(props.elementId, target)
  if (newId) emit('connect', newId)
}

function handleOperatorConnect(type) {
  showOperatorSubmenu.value = false
  const newId = store.quickConnectAdd(props.elementId, 'operator', type)
  if (newId) emit('connect', newId)
}
</script>

<template>
  <div
    class="quick-connect-pad"
    :style="{ left: `${screenX}px`, top: `${screenY}px` }"
    @mousedown.stop
    @click.stop
  >
    <div
      v-for="opt in options"
      :key="opt.target"
      class="qc-item"
    >
      <button
        :class="['qc-btn', { active: opt.target === 'operator' && showOperatorSubmenu }]"
        :title="t(opt.labelKey)"
        :aria-label="t(opt.labelKey)"
        :aria-expanded="opt.target === 'operator' ? showOperatorSubmenu : undefined"
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
