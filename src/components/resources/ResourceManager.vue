<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useResourceStore } from '@/stores/resources'
import { usePetriNetStore } from '@/stores/petriNet'

const { t } = useI18n()
const resourceStore = useResourceStore()
const petriNetStore = usePetriNetStore()
const { net } = storeToRefs(petriNetStore)

const activeTab = ref('resources')
const tabs = [
  { id: 'resources', label: 'resources.tabs.resources' },
  { id: 'roles', label: 'resources.tabs.roles' },
  { id: 'allocations', label: 'resources.tabs.allocations' },
]

// Resources tab
const newRes = ref({ name: '', type: 'human', capacity: 1, costPerTimeUnit: 0, roleId: '', groupId: '' })
const editingResId = ref(null)

const addResource = () => {
  if (!newRes.value.name.trim()) return
  resourceStore.addResource({
    name: newRes.value.name.trim(),
    type: newRes.value.type,
    capacity: Number(newRes.value.capacity) || 1,
    costPerTimeUnit: Number(newRes.value.costPerTimeUnit) || undefined,
    roleId: newRes.value.roleId || undefined,
    groupId: newRes.value.groupId || undefined,
  })
  newRes.value = { name: '', type: 'human', capacity: 1, costPerTimeUnit: 0, roleId: '', groupId: '' }
}

const startEditResource = (res) => {
  editingResId.value = res.id
  newRes.value = { ...res, costPerTimeUnit: res.costPerTimeUnit || 0 }
}

const saveEditResource = () => {
  if (!editingResId.value) return
  resourceStore.updateResource(editingResId.value, {
    name: newRes.value.name,
    type: newRes.value.type,
    capacity: Number(newRes.value.capacity),
    costPerTimeUnit: Number(newRes.value.costPerTimeUnit) || undefined,
    roleId: newRes.value.roleId || undefined,
    groupId: newRes.value.groupId || undefined,
  })
  editingResId.value = null
  newRes.value = { name: '', type: 'human', capacity: 1, costPerTimeUnit: 0, roleId: '', groupId: '' }
}

const cancelEdit = () => {
  editingResId.value = null
  newRes.value = { name: '', type: 'human', capacity: 1, costPerTimeUnit: 0, roleId: '', groupId: '' }
}

// Roles tab
const newRole = ref({ name: '', description: '' })
const addRole = () => {
  if (!newRole.value.name.trim()) return
  resourceStore.addRole({ name: newRole.value.name.trim(), description: newRole.value.description })
  newRole.value = { name: '', description: '' }
}

// Groups
const newGroup = ref({ name: '', description: '' })
const addGroup = () => {
  if (!newGroup.value.name.trim()) return
  resourceStore.addGroup({ name: newGroup.value.name.trim(), description: newGroup.value.description })
  newGroup.value = { name: '', description: '' }
}

// Allocations tab
const newAlloc = ref({ resourceId: '', transitionId: '', units: 1 })
const transitions = computed(() => [
  ...net.value.transitions,
  ...net.value.operators,
])

const addAllocation = () => {
  if (!newAlloc.value.resourceId || !newAlloc.value.transitionId) return
  resourceStore.addAllocation({
    resourceId: newAlloc.value.resourceId,
    transitionId: newAlloc.value.transitionId,
    units: Number(newAlloc.value.units) || 1,
  })
  newAlloc.value = { resourceId: '', transitionId: '', units: 1 }
}

const getResourceName = (id) => resourceStore.getById(id)?.name || id
const getTransitionName = (id) => {
  const t = transitions.value.find(tr => tr.id === id)
  return t?.name || id
}

const typeIcons = { human: '👤', machine: '⚙', system: '💻' }
</script>

<template>
  <div class="resource-manager">
    <div class="manager-header">
      <h3>{{ t('resources.title') }}</h3>
    </div>

    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ t(tab.label) }}
      </button>
    </div>

    <!-- Resources Tab -->
    <div v-if="activeTab === 'resources'" class="tab-content">
      <div class="form-row">
        <input
          v-model="newRes.name"
          :placeholder="t('resources.namePlaceholder')"
          class="input"
          @keyup.enter="editingResId ? saveEditResource() : addResource()"
        />
        <select v-model="newRes.type" class="select-sm">
          <option value="human">👤 {{ t('resources.typeHuman') }}</option>
          <option value="machine">⚙ {{ t('resources.typeMachine') }}</option>
          <option value="system">💻 {{ t('resources.typeSystem') }}</option>
        </select>
        <input
          v-model.number="newRes.capacity"
          type="number"
          min="1"
          class="input-sm"
          :placeholder="t('resources.capacity')"
        />
      </div>
      <div class="form-row">
        <select v-model="newRes.roleId" class="select-sm">
          <option value="">{{ t('resources.noRole') }}</option>
          <option v-for="role in resourceStore.roles" :key="role.id" :value="role.id">
            {{ role.name }}
          </option>
        </select>
        <select v-model="newRes.groupId" class="select-sm">
          <option value="">{{ t('resources.noGroup') }}</option>
          <option v-for="group in resourceStore.groups" :key="group.id" :value="group.id">
            {{ group.name }}
          </option>
        </select>
        <input
          v-model.number="newRes.costPerTimeUnit"
          type="number"
          min="0"
          step="0.1"
          class="input-sm"
          :placeholder="t('resources.cost')"
        />
      </div>
      <div class="form-actions">
        <button v-if="editingResId" class="btn-primary" @click="saveEditResource">{{ t('common.save') }}</button>
        <button v-if="editingResId" class="btn-secondary" @click="cancelEdit">{{ t('common.cancel') }}</button>
        <button v-else class="btn-primary" :disabled="!newRes.name.trim()" @click="addResource">
          + {{ t('resources.add') }}
        </button>
      </div>

      <div class="item-list">
        <div
          v-for="res in resourceStore.resources"
          :key="res.id"
          class="item-card"
        >
          <div class="item-main">
            <span class="item-icon">{{ typeIcons[res.type] || '📦' }}</span>
            <div class="item-info">
              <span class="item-name">{{ res.name }}</span>
              <span class="item-meta">
                {{ t('resources.capacity') }}: {{ res.capacity }}
                <template v-if="res.roleId">
                  · {{ resourceStore.getRoleById(res.roleId)?.name }}
                </template>
                <template v-if="res.groupId">
                  · {{ resourceStore.getGroupById(res.groupId)?.name }}
                </template>
              </span>
            </div>
          </div>
          <div class="item-actions">
            <button class="btn-icon" @click="startEditResource(res)" :title="t('common.edit')">✎</button>
            <button class="btn-icon danger" @click="resourceStore.removeResource(res.id)" :title="t('common.delete')">✕</button>
          </div>
        </div>
        <div v-if="resourceStore.resources.length === 0" class="empty">
          {{ t('resources.noResources') }}
        </div>
      </div>
    </div>

    <!-- Roles & Groups Tab -->
    <div v-if="activeTab === 'roles'" class="tab-content">
      <h4>{{ t('resources.rolesTitle') }}</h4>
      <div class="form-row">
        <input
          v-model="newRole.name"
          :placeholder="t('resources.roleName')"
          class="input"
          @keyup.enter="addRole"
        />
        <input v-model="newRole.description" :placeholder="t('resources.description')" class="input" />
        <button class="btn-primary" :disabled="!newRole.name.trim()" @click="addRole">+</button>
      </div>
      <div class="item-list">
        <div v-for="role in resourceStore.roles" :key="role.id" class="item-card">
          <div class="item-main">
            <div class="item-info">
              <span class="item-name">{{ role.name }}</span>
              <span v-if="role.description" class="item-meta">{{ role.description }}</span>
              <span class="item-meta">{{ resourceStore.getResourcesByRole(role.id).length }} {{ t('resources.members') }}</span>
            </div>
          </div>
          <button class="btn-icon danger" @click="resourceStore.removeRole(role.id)">✕</button>
        </div>
      </div>

      <h4>{{ t('resources.groupsTitle') }}</h4>
      <div class="form-row">
        <input
          v-model="newGroup.name"
          :placeholder="t('resources.groupName')"
          class="input"
          @keyup.enter="addGroup"
        />
        <input v-model="newGroup.description" :placeholder="t('resources.description')" class="input" />
        <button class="btn-primary" :disabled="!newGroup.name.trim()" @click="addGroup">+</button>
      </div>
      <div class="item-list">
        <div v-for="group in resourceStore.groups" :key="group.id" class="item-card">
          <div class="item-main">
            <div class="item-info">
              <span class="item-name">{{ group.name }}</span>
              <span v-if="group.description" class="item-meta">{{ group.description }}</span>
              <span class="item-meta">{{ resourceStore.getResourcesByGroup(group.id).length }} {{ t('resources.members') }}</span>
            </div>
          </div>
          <button class="btn-icon danger" @click="resourceStore.removeGroup(group.id)">✕</button>
        </div>
      </div>
    </div>

    <!-- Allocations Tab -->
    <div v-if="activeTab === 'allocations'" class="tab-content">
      <div class="form-row">
        <select v-model="newAlloc.resourceId" class="select-sm">
          <option value="">{{ t('resources.selectResource') }}</option>
          <option v-for="res in resourceStore.resources" :key="res.id" :value="res.id">
            {{ res.name }}
          </option>
        </select>
        <select v-model="newAlloc.transitionId" class="select-sm">
          <option value="">{{ t('resources.selectTransition') }}</option>
          <option v-for="tr in transitions" :key="tr.id" :value="tr.id">
            {{ tr.name }}
          </option>
        </select>
        <input v-model.number="newAlloc.units" type="number" min="1" class="input-sm" />
        <button
          class="btn-primary"
          :disabled="!newAlloc.resourceId || !newAlloc.transitionId"
          @click="addAllocation"
        >
          +
        </button>
      </div>

      <div class="item-list">
        <div v-for="alloc in resourceStore.allocations" :key="alloc.id" class="item-card">
          <div class="item-main">
            <div class="item-info">
              <span class="item-name">{{ getResourceName(alloc.resourceId) }} → {{ getTransitionName(alloc.transitionId) }}</span>
              <span class="item-meta">{{ alloc.units }} {{ t('resources.units') }}</span>
            </div>
          </div>
          <button class="btn-icon danger" @click="resourceStore.removeAllocation(alloc.id)">✕</button>
        </div>
        <div v-if="resourceStore.allocations.length === 0" class="empty">
          {{ t('resources.noAllocations') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resource-manager {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  max-width: 400px;
}

.manager-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.manager-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.tab-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}

.tab-btn {
  flex: 1;
  padding: 6px 8px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.tab-btn:hover {
  background: var(--color-bg);
}

.tab-btn.active {
  background: var(--color-primary);
  color: white;
}

.tab-content h4 {
  margin: 12px 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.tab-content h4:first-child {
  margin-top: 0;
}

.form-row {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}

.form-actions {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 12px;
}

.input-sm {
  width: 60px;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 12px;
}

.select-sm {
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 12px;
  min-width: 80px;
}

.btn-primary {
  padding: 6px 12px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 6px 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  color: var(--color-text);
}

.btn-icon {
  padding: 2px 6px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: 13px;
  border-radius: 3px;
}

.btn-icon:hover {
  background: var(--color-bg);
}

.btn-icon.danger:hover {
  color: #ef4444;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.item-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
}

.item-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.item-icon {
  font-size: 16px;
}

.item-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.item-name {
  font-weight: 600;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  font-size: 11px;
  color: var(--color-text-muted);
}

.item-actions {
  display: flex;
  gap: 2px;
}

.empty {
  text-align: center;
  padding: 16px;
  color: var(--color-text-muted);
  font-size: 12px;
}
</style>
