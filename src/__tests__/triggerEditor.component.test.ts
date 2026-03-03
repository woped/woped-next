import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useResourceStore } from '@/stores/resources'
import type { TimeTrigger, ResourceTrigger, MessageTrigger, Trigger } from '@/types/triggers'
import {
  DEFAULT_TIME_TRIGGER,
  DEFAULT_RESOURCE_TRIGGER,
  DEFAULT_MESSAGE_TRIGGER,
  TRIGGER_ICONS,
  TRIGGER_COLORS,
} from '@/types/triggers'

describe('TriggerEditor — logic & resource integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Trigger defaults', () => {
    it('should have correct default time trigger', () => {
      expect(DEFAULT_TIME_TRIGGER.type).toBe('time')
      expect(DEFAULT_TIME_TRIGGER.delay).toBe(5)
      expect(DEFAULT_TIME_TRIGGER.timeUnit).toBe('minutes')
    })

    it('should have correct default resource trigger', () => {
      expect(DEFAULT_RESOURCE_TRIGGER.type).toBe('resource')
      expect(DEFAULT_RESOURCE_TRIGGER.quantity).toBe(1)
    })

    it('should have correct default message trigger', () => {
      expect(DEFAULT_MESSAGE_TRIGGER.type).toBe('message')
      expect(DEFAULT_MESSAGE_TRIGGER.messageType).toBe('')
    })
  })

  describe('Trigger icons and colors', () => {
    it('should have icons for all types', () => {
      expect(TRIGGER_ICONS.time).toBe('⏰')
      expect(TRIGGER_ICONS.resource).toBe('👤')
      expect(TRIGGER_ICONS.message).toBe('📨')
    })

    it('should have colors for all types', () => {
      expect(TRIGGER_COLORS.time).toBe('#FFC107')
      expect(TRIGGER_COLORS.resource).toBe('#4CAF50')
      expect(TRIGGER_COLORS.message).toBe('#2196F3')
    })
  })

  describe('Resource store integration', () => {
    it('should provide resources for the resource trigger dropdown', () => {
      const store = useResourceStore()
      store.addResource({ name: 'Dev', type: 'human', capacity: 2 })
      store.addResource({ name: 'Server', type: 'machine', capacity: 5 })

      expect(store.resources).toHaveLength(2)
      expect(store.resources[0].name).toBe('Dev')
      expect(store.resources[1].name).toBe('Server')
    })

    it('should allow selecting a resource by id for a trigger', () => {
      const store = useResourceStore()
      const dev = store.addResource({ name: 'Developer', type: 'human', capacity: 1 })

      const trigger: ResourceTrigger = {
        id: 'trig-1',
        type: 'resource',
        resourceId: dev.id,
        quantity: 1,
      }

      const resolved = store.getById(trigger.resourceId)
      expect(resolved).toBeDefined()
      expect(resolved?.name).toBe('Developer')
    })

    it('should handle removed resource gracefully', () => {
      const store = useResourceStore()
      const res = store.addResource({ name: 'Temp', type: 'system', capacity: 1 })
      const resId = res.id

      store.removeResource(resId)

      const resolved = store.getById(resId)
      expect(resolved).toBeUndefined()
    })
  })

  describe('Trigger list manipulation', () => {
    it('should add a trigger to a list', () => {
      const triggers: Trigger[] = []
      const newTrigger: TimeTrigger = {
        id: 'new-1',
        type: 'time',
        delay: 10,
        timeUnit: 'hours',
      }

      const updated = [...triggers, newTrigger]
      expect(updated).toHaveLength(1)
      expect(updated[0].type).toBe('time')
    })

    it('should remove a trigger from a list', () => {
      const triggers: Trigger[] = [
        { id: 't1', type: 'time', delay: 5, timeUnit: 'minutes' } as TimeTrigger,
        { id: 'm1', type: 'message', messageType: 'ping' } as MessageTrigger,
      ]

      const updated = triggers.filter((t) => t.id !== 't1')
      expect(updated).toHaveLength(1)
      expect(updated[0].type).toBe('message')
    })

    it('should update a trigger in a list', () => {
      const triggers: Trigger[] = [
        { id: 't1', type: 'time', delay: 5, timeUnit: 'minutes' } as TimeTrigger,
      ]

      const updated = triggers.map((t) =>
        t.id === 't1' ? { ...t, delay: 15 } : t
      )
      expect((updated[0] as TimeTrigger).delay).toBe(15)
    })
  })
})
