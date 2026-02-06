/**
 * Trigger types for transitions
 */
export type TriggerType = 'time' | 'resource' | 'message'

/**
 * Base trigger interface
 */
export interface BaseTrigger {
  id: string
  type: TriggerType
}

/**
 * Time trigger - fires after a delay
 */
export interface TimeTrigger extends BaseTrigger {
  type: 'time'
  delay: number
  timeUnit: 'seconds' | 'minutes' | 'hours' | 'days'
}

/**
 * Resource trigger - requires resource to be available
 */
export interface ResourceTrigger extends BaseTrigger {
  type: 'resource'
  resourceId: string
  quantity: number
  role?: string
}

/**
 * Message trigger - fires when message received
 */
export interface MessageTrigger extends BaseTrigger {
  type: 'message'
  messageType: string
  source?: string
}

/**
 * Union type for all triggers
 */
export type Trigger = TimeTrigger | ResourceTrigger | MessageTrigger

/**
 * Default time trigger
 */
export const DEFAULT_TIME_TRIGGER: Omit<TimeTrigger, 'id'> = {
  type: 'time',
  delay: 5,
  timeUnit: 'minutes',
}

/**
 * Default resource trigger
 */
export const DEFAULT_RESOURCE_TRIGGER: Omit<ResourceTrigger, 'id' | 'resourceId'> = {
  type: 'resource',
  quantity: 1,
}

/**
 * Default message trigger
 */
export const DEFAULT_MESSAGE_TRIGGER: Omit<MessageTrigger, 'id'> = {
  type: 'message',
  messageType: '',
}

/**
 * Trigger icon mapping
 */
export const TRIGGER_ICONS: Record<TriggerType, string> = {
  time: '⏰',
  resource: '👤',
  message: '📨',
}

/**
 * Trigger colors
 */
export const TRIGGER_COLORS: Record<TriggerType, string> = {
  time: '#FFC107',
  resource: '#4CAF50',
  message: '#2196F3',
}
