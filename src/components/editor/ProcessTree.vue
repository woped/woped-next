<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { usePetriNetStore } from '@/stores/petriNet'
import type { PetriNet } from '@/types/petri-net'

const { t } = useI18n()
const store = usePetriNetStore()
const { nets, activeNetId, breadcrumb } = storeToRefs(store)

// Local collapsed state per net id (for tree UI)
const collapsedIds = ref<Set<string>>(new Set())

interface TreeNode {
  net: PetriNet
  children: TreeNode[]
}

/** Build tree structure from nets: root has no parentId, children have matching parentId */
function buildNode(net: PetriNet, netMap: Record<string, PetriNet>): TreeNode {
  const children = Object.values(netMap)
    .filter((n) => n.parentId === net.id)
    .map((n) => buildNode(n, netMap))
  return { net, children }
}

const treeRoots = computed<TreeNode[]>(() => {
  const netMap = nets.value
  const nodes: TreeNode[] = []
  for (const net of Object.values(netMap)) {
    if (!net.parentId) {
      nodes.push(buildNode(net, netMap))
    }
  }
  return nodes
})

/** Build path from root to target (by walking parentId chain) */
function getPathToNet(netId: string): string[] {
  const path: string[] = []
  let cur: PetriNet | undefined = nets.value[netId]
  while (cur) {
    path.unshift(cur.id)
    cur = cur.parentId ? nets.value[cur.parentId] : undefined
  }
  return path
}

/** Navigate to a net: use navigateTo for ancestors/current, openSubProcess chain for descendants */
function navigateToNet(netId: string) {
  if (breadcrumb.value.includes(netId)) {
    store.navigateTo(netId)
    return
  }

  const netMap = nets.value
  const targetPath = getPathToNet(netId)

  // Find common ancestor: last net in breadcrumb that appears in target path
  let commonAncestorIdx = -1
  for (let i = breadcrumb.value.length - 1; i >= 0; i--) {
    const idx = targetPath.indexOf(breadcrumb.value[i])
    if (idx !== -1) {
      commonAncestorIdx = idx
      break
    }
  }

  if (commonAncestorIdx === -1) return

  const commonId = targetPath[commonAncestorIdx]
  if (activeNetId.value !== commonId) {
    store.navigateTo(commonId)
  }

  for (let i = commonAncestorIdx; i < targetPath.length - 1; i++) {
    const fromNetId = targetPath[i]
    const toNetId = targetPath[i + 1]
    const fromNet = netMap[fromNetId]
    const subprocess = fromNet?.subProcesses?.find((sp) => sp.subNetId === toNetId)
    if (subprocess) {
      store.openSubProcess(subprocess.id)
    }
  }
}

function toggleCollapsed(netId: string) {
  collapsedIds.value = new Set(collapsedIds.value)
  if (collapsedIds.value.has(netId)) {
    collapsedIds.value.delete(netId)
  } else {
    collapsedIds.value.add(netId)
  }
}

function isCollapsed(netId: string) {
  return collapsedIds.value.has(netId)
}

function getCountSummary(net: PetriNet) {
  const p = net.places?.length ?? 0
  const t = net.transitions?.length ?? 0
  const o = net.operators?.length ?? 0
  const a = net.arcs?.length ?? 0
  const transitionsTotal = t + o + (net.subProcesses?.length ?? 0)
  return { places: p, transitions: transitionsTotal, arcs: a }
}

/** Flat list of nodes for rendering (respects collapsed state) */
const flatNodes = computed<{ node: TreeNode; depth: number; isLast: boolean; parentPath: boolean[] }[]>(() => {
  const result: { node: TreeNode; depth: number; isLast: boolean; parentPath: boolean[] }[] = []
  function visit(n: TreeNode, d: number, isLast: boolean, parentPath: boolean[]) {
    result.push({ node: n, depth: d, isLast, parentPath })
    if (!collapsedIds.value.has(n.net.id) && n.children.length > 0) {
      n.children.forEach((c, i) => {
        const childIsLast = i === n.children.length - 1
        visit(c, d + 1, childIsLast, [...parentPath, !childIsLast])
      })
    }
  }
  treeRoots.value.forEach((r, i) => {
    const isLast = i === treeRoots.value.length - 1 && r.children.length === 0
    visit(r, 0, isLast, [])
  })
  return result
})
</script>

<template>
  <div class="process-tree">
    <div class="pt-header">
      <span class="pt-title">{{ t('processTree.title', 'Process hierarchy') }}</span>
    </div>
    <div class="pt-content">
      <div
        v-for="{ node, depth, parentPath } in flatNodes"
        :key="node.net.id"
        class="tree-node"
        :class="{ active: node.net.id === activeNetId }"
      >
        <div
          class="node-row"
          @click="navigateToNet(node.net.id)"
        >
          <div class="indent" :style="{ width: `${depth * 16}px` }">
            <span
              v-for="(showLine, idx) in parentPath"
              :key="idx"
              class="line-v"
              :class="{ visible: showLine }"
            />
          </div>
          <span
            class="toggle"
            :class="{ expandable: node.children.length > 0 }"
            @click.stop="node.children.length ? toggleCollapsed(node.net.id) : null"
          >
            {{ node.children.length ? (isCollapsed(node.net.id) ? '▶' : '▼') : '·' }}
          </span>
          <span class="node-name">{{ node.net.name }}</span>
          <span class="badge">
            {{ getCountSummary(node.net).places }}/{{ getCountSummary(node.net).transitions }}/{{ getCountSummary(node.net).arcs }}
          </span>
        </div>
      </div>
      <div v-if="treeRoots.length === 0" class="pt-empty">
        {{ t('processTree.empty', 'No processes') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.process-tree {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.pt-header {
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.pt-content {
  padding: 8px 0;
  max-height: 280px;
  overflow-y: auto;
}

.pt-empty {
  padding: 12px 16px;
  color: var(--color-text-muted);
  font-size: 13px;
}

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
  color: var(--color-text);
  background: transparent;
  border-radius: 4px;
  transition: background 0.15s;
  min-height: 28px;
}

.node-row:hover {
  background: var(--color-bg-secondary);
}

.tree-node.active .node-row {
  background: var(--color-primary);
  color: white;
}

.tree-node.active .node-row:hover {
  background: var(--color-primary);
  filter: brightness(1.05);
}

.indent {
  flex-shrink: 0;
  display: flex;
  min-height: 28px;
  align-items: stretch;
}

.line-v {
  width: 16px;
  flex-shrink: 0;
  border-left: 1px solid transparent;
  transition: border-color 0.15s;
}

.line-v.visible {
  border-left-color: var(--color-border);
}

.tree-node.active .line-v.visible {
  border-left-color: rgba(255, 255, 255, 0.4);
}

.toggle {
  width: 14px;
  flex-shrink: 0;
  font-size: 10px;
  color: var(--color-text-muted);
  text-align: center;
}

.toggle.expandable {
  cursor: pointer;
}

.tree-node.active .toggle {
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
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);
}

.tree-node.active .badge {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}
</style>
