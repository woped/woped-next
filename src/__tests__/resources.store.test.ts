import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useResourceStore, type ResourceDefinition } from '@/stores/resources'

describe('Resource Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('addResource', () => {
    it('should add a resource with generated id', () => {
      const store = useResourceStore()
      const resource = store.addResource({ name: 'Dev A', type: 'human', capacity: 1 })

      expect(resource.id).toBeDefined()
      expect(resource.name).toBe('Dev A')
      expect(resource.type).toBe('human')
      expect(resource.capacity).toBe(1)
      expect(store.resources).toHaveLength(1)
    })

    it('should include optional costPerTimeUnit', () => {
      const store = useResourceStore()
      const resource = store.addResource({ name: 'Server', type: 'machine', capacity: 3, costPerTimeUnit: 10 })

      expect(resource.costPerTimeUnit).toBe(10)
    })
  })

  describe('addResourceWithId', () => {
    it('should add a resource preserving the given id', () => {
      const store = useResourceStore()
      store.addResourceWithId({ id: 'r-42', name: 'Bot', type: 'system', capacity: 5 })

      expect(store.resources).toHaveLength(1)
      expect(store.resources[0].id).toBe('r-42')
    })

    it('should not duplicate when same id already exists', () => {
      const store = useResourceStore()
      store.addResourceWithId({ id: 'r-1', name: 'A', type: 'human', capacity: 1 })
      store.addResourceWithId({ id: 'r-1', name: 'A duplicate', type: 'human', capacity: 2 })

      expect(store.resources).toHaveLength(1)
      expect(store.resources[0].name).toBe('A')
    })
  })

  describe('updateResource', () => {
    it('should update existing resource fields', () => {
      const store = useResourceStore()
      const resource = store.addResource({ name: 'Old', type: 'human', capacity: 1 })

      store.updateResource(resource.id, { name: 'New', capacity: 5 })

      const updated = store.getById(resource.id)
      expect(updated?.name).toBe('New')
      expect(updated?.capacity).toBe(5)
      expect(updated?.type).toBe('human')
    })

    it('should do nothing for unknown id', () => {
      const store = useResourceStore()
      store.addResource({ name: 'A', type: 'human', capacity: 1 })
      store.updateResource('nonexistent', { name: 'B' })

      expect(store.resources[0].name).toBe('A')
    })
  })

  describe('removeResource', () => {
    it('should remove a resource by id', () => {
      const store = useResourceStore()
      const r1 = store.addResource({ name: 'A', type: 'human', capacity: 1 })
      store.addResource({ name: 'B', type: 'machine', capacity: 2 })

      store.removeResource(r1.id)

      expect(store.resources).toHaveLength(1)
      expect(store.resources[0].name).toBe('B')
    })
  })

  describe('clear', () => {
    it('should remove all resources', () => {
      const store = useResourceStore()
      store.addResource({ name: 'A', type: 'human', capacity: 1 })
      store.addResource({ name: 'B', type: 'machine', capacity: 2 })

      store.clear()

      expect(store.resources).toHaveLength(0)
    })
  })

  describe('getters', () => {
    it('getById should return the matching resource', () => {
      const store = useResourceStore()
      const resource = store.addResource({ name: 'X', type: 'system', capacity: 1 })

      expect(store.getById(resource.id)).toEqual(resource)
      expect(store.getById('nonexistent')).toBeUndefined()
    })

    it('getByName should return the matching resource', () => {
      const store = useResourceStore()
      store.addResource({ name: 'Unique Name', type: 'human', capacity: 1 })

      expect(store.getByName('Unique Name')?.name).toBe('Unique Name')
      expect(store.getByName('Missing')).toBeUndefined()
    })
  })
})
