<script setup lang="ts">
import type { PetriNet } from '@/types/petri-net'

interface TreeNode {
  net: PetriNet
  children: TreeNode[]
}

defineProps<{
  node: TreeNode
  depth: number
  activeNetId: string
  isCollapsed: (netId: string) => boolean
  getCountSummary: (net: PetriNet) => { places: number; transitions: number; arcs: number }
}>()

const emit = defineEmits<{
  navigate: [netId: string]
  toggle: [netId: string]
}>()
</script>

<template>
  <div class="tree-node">
    <div
      class="node-row"
      :class="{ active: node.net.id === activeNetId }"
      :style="{ paddingLeft: `${depth * 16 + 8}px` }"
      @click="emit('navigate', node.net.id)"
    >
      <span
        class="toggle"
        @click.stop="emit('toggle', node.net.id)"
      >
        {{ node.children.length ? (isCollapsed(node.net.id) ? '▶' : '▼') : '·' }}
      </span>
      <span class="node-name">{{ node.net.name }}</span>
      <span class="badge">
        {{ getCountSummary(node.net).places }}/{{ getCountSummary(node.net).transitions }}/{{ getCountSummary(node.net).arcs }}
      </span>
    </div>
    <template v-if="node.children.length && !isCollapsed(node.net.id)">
      <div class="children">
        <ProcessTreeNode
          v-for="child in node.children"
          :key="child.net.id"
          :node="child"
          :depth="depth + 1"
          :active-net-id="activeNetId"
          :is-collapsed="isCollapsed"
          :get-count-summary="getCountSummary"
          @navigate="emit('navigate', $event)"
          @toggle="emit('toggle', $event)"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.tree-node {
  position: relative;
}

.node-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text, #374151);
  background: transparent;
  border-radius: 4px;
  transition: background 0.15s;
}

.node-row:hover {
  background: var(--color-bg-secondary, #f3f4f6);
}

.node-row.active {
  background: var(--color-primary, #3b82f6);
  color: white;
}

.node-row.active:hover {
  background: var(--color-primary, #2563eb);
}

.toggle {
  width: 14px;
  flex-shrink: 0;
  font-size: 10px;
  color: var(--color-text-muted, #9ca3af);
}

.node-row.active .toggle {
  color: rgba(255, 255, 255, 0.9);
}

.node-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  flex-shrink: 0;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--color-bg-secondary, #e5e7eb);
  color: var(--color-text-muted, #6b7280);
}

.node-row.active .badge {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

.children {
  position: relative;
  border-left: 1px solid var(--color-border, #e5e7eb);
  margin-left: 12px;
  padding-left: 4px;
}
</style>
