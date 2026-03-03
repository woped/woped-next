import { z } from 'zod'

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

export const PlaceSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  position: PositionSchema,
  tokens: z.number().int().min(0).default(0),
  capacity: z.number().int().default(-1),
})

export const TriggerSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string(),
    type: z.literal('time'),
    delay: z.number().min(0),
    timeUnit: z.enum(['seconds', 'minutes', 'hours', 'days']),
  }),
  z.object({
    id: z.string(),
    type: z.literal('resource'),
    resourceId: z.string(),
    quantity: z.number().int().min(1),
    role: z.string().optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('message'),
    messageType: z.string(),
    source: z.string().optional(),
  }),
])

export const TransitionSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  position: PositionSchema,
  label: z.string().optional(),
  triggers: z.array(TriggerSchema).optional(),
})

export const OperatorTypeSchema = z.enum([
  'and-split', 'and-join', 'xor-split', 'xor-join',
  'and-split-join', 'xor-split-join',
  'and-join-xor-split', 'xor-join-and-split',
])

export const OperatorTransitionSchema = TransitionSchema.extend({
  operatorType: OperatorTypeSchema,
})

export const SubProcessSchema = TransitionSchema.extend({
  subNetId: z.string().min(1),
  collapsed: z.boolean(),
})

export const ArcSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  weight: z.number().int().min(1).default(1),
  waypoints: z.array(PositionSchema).default([]),
  routingMode: z.enum(['direct', 'orthogonal', 'bezier', 'manual']).optional(),
})

export const PetriNetSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  parentId: z.string().optional(),
  places: z.array(PlaceSchema),
  transitions: z.array(TransitionSchema),
  operators: z.array(OperatorTransitionSchema).default([]),
  subProcesses: z.array(SubProcessSchema).default([]),
  arcs: z.array(ArcSchema),
})

export type ZodPetriNet = z.infer<typeof PetriNetSchema>

/**
 * Validate a PetriNet object with Zod. Returns the parsed (coerced) net or throws.
 */
export function validatePetriNetSchema(data: unknown) {
  return PetriNetSchema.parse(data)
}

/**
 * Safe validation — returns success/error result instead of throwing.
 */
export function safeParsePetriNet(data: unknown) {
  return PetriNetSchema.safeParse(data)
}
