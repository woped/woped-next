import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'

export type ResourceType = 'human' | 'machine' | 'system'

export interface ResourceDefinition {
  id: string
  name: string
  type: ResourceType
  capacity: number
  costPerTimeUnit?: number
  roleId?: string
  groupId?: string
}

export interface ResourceRole {
  id: string
  name: string
  description?: string
}

export interface ResourceGroup {
  id: string
  name: string
  description?: string
}

export interface ResourceAllocation {
  id: string
  resourceId: string
  transitionId: string
  units: number
}

export const useResourceStore = defineStore('resources', {
  state: () => ({
    resources: [] as ResourceDefinition[],
    roles: [] as ResourceRole[],
    groups: [] as ResourceGroup[],
    allocations: [] as ResourceAllocation[],
  }),

  getters: {
    getById: (state) => (id: string): ResourceDefinition | undefined =>
      state.resources.find((r) => r.id === id),

    getByName: (state) => (name: string): ResourceDefinition | undefined =>
      state.resources.find((r) => r.name === name),

    getByType: (state) => (type: ResourceType): ResourceDefinition[] =>
      state.resources.filter((r) => r.type === type),

    getResourcesByRole: (state) => (roleId: string): ResourceDefinition[] =>
      state.resources.filter((r) => r.roleId === roleId),

    getResourcesByGroup: (state) => (groupId: string): ResourceDefinition[] =>
      state.resources.filter((r) => r.groupId === groupId),

    getRoleById: (state) => (id: string): ResourceRole | undefined =>
      state.roles.find((r) => r.id === id),

    getGroupById: (state) => (id: string): ResourceGroup | undefined =>
      state.groups.find((g) => g.id === id),

    getAllocationsForResource: (state) => (resourceId: string): ResourceAllocation[] =>
      state.allocations.filter((a) => a.resourceId === resourceId),

    getAllocationsForTransition: (state) => (transitionId: string): ResourceAllocation[] =>
      state.allocations.filter((a) => a.transitionId === transitionId),

    totalCapacity: (state): number =>
      state.resources.reduce((sum, r) => sum + r.capacity, 0),
  },

  actions: {
    addResource(data: Omit<ResourceDefinition, 'id'>): ResourceDefinition {
      const resource: ResourceDefinition = { ...data, id: nanoid() }
      this.resources.push(resource)
      return resource
    },

    addResourceWithId(resource: ResourceDefinition) {
      if (!this.resources.find((r) => r.id === resource.id)) {
        this.resources.push({ ...resource })
      }
    },

    updateResource(id: string, updates: Partial<Omit<ResourceDefinition, 'id'>>) {
      const resource = this.resources.find((r) => r.id === id)
      if (resource) Object.assign(resource, updates)
    },

    removeResource(id: string) {
      this.resources = this.resources.filter((r) => r.id !== id)
      this.allocations = this.allocations.filter((a) => a.resourceId !== id)
    },

    addRole(data: Omit<ResourceRole, 'id'>): ResourceRole {
      const role: ResourceRole = { ...data, id: nanoid() }
      this.roles.push(role)
      return role
    },

    updateRole(id: string, updates: Partial<Omit<ResourceRole, 'id'>>) {
      const role = this.roles.find((r) => r.id === id)
      if (role) Object.assign(role, updates)
    },

    removeRole(id: string) {
      this.roles = this.roles.filter((r) => r.id !== id)
      for (const res of this.resources) {
        if (res.roleId === id) res.roleId = undefined
      }
    },

    addGroup(data: Omit<ResourceGroup, 'id'>): ResourceGroup {
      const group: ResourceGroup = { ...data, id: nanoid() }
      this.groups.push(group)
      return group
    },

    updateGroup(id: string, updates: Partial<Omit<ResourceGroup, 'id'>>) {
      const group = this.groups.find((g) => g.id === id)
      if (group) Object.assign(group, updates)
    },

    removeGroup(id: string) {
      this.groups = this.groups.filter((g) => g.id !== id)
      for (const res of this.resources) {
        if (res.groupId === id) res.groupId = undefined
      }
    },

    addAllocation(data: Omit<ResourceAllocation, 'id'>): ResourceAllocation {
      const allocation: ResourceAllocation = { ...data, id: nanoid() }
      this.allocations.push(allocation)
      return allocation
    },

    removeAllocation(id: string) {
      this.allocations = this.allocations.filter((a) => a.id !== id)
    },

    clear() {
      this.resources = []
      this.roles = []
      this.groups = []
      this.allocations = []
    },
  },
})
