import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'

export type ResourceType = 'human' | 'machine' | 'system'

export interface ResourceDefinition {
  id: string
  name: string
  type: ResourceType
  capacity: number
  costPerTimeUnit?: number
}

export const useResourceStore = defineStore('resources', {
  state: () => ({
    resources: [] as ResourceDefinition[],
  }),

  getters: {
    getById: (state) => (id: string): ResourceDefinition | undefined =>
      state.resources.find((r) => r.id === id),

    getByName: (state) => (name: string): ResourceDefinition | undefined =>
      state.resources.find((r) => r.name === name),

    getByType: (state) => (type: ResourceType): ResourceDefinition[] =>
      state.resources.filter((r) => r.type === type),

    getResourcesByRole: (state) => (role: string): ResourceDefinition[] =>
      state.resources.filter((r) => r.name.toLowerCase().includes(role.toLowerCase())),

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
    },

    clear() {
      this.resources = []
    },
  },
})
