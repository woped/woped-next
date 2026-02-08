/**
 * Petri Net Templates for Educational Purposes
 * 
 * These templates demonstrate fundamental Petri net patterns and concepts
 * for beginners learning about process modeling and workflow analysis.
 */

import { nanoid } from 'nanoid'
import type { PetriNet, Place, Transition, Arc } from '@/types/petri-net'
import { OperatorType } from '@/types/petri-net'

export interface Template {
  id: string
  nameKey: string      // i18n key for template name
  descriptionKey: string // i18n key for description
  category: 'basic' | 'patterns' | 'workflow'
  create: () => PetriNet
}

// Helper to create a place
const createPlace = (id: string, name: string, x: number, y: number, tokens = 0): Place => ({
  id,
  name,
  position: { x, y },
  tokens,
})

// Helper to create a transition
const createTransition = (id: string, name: string, x: number, y: number): Transition => ({
  id,
  name,
  position: { x, y },
})

// Helper to create an arc
const createArc = (sourceId: string, targetId: string, weight = 1): Arc => ({
  id: nanoid(),
  sourceId,
  targetId,
  weight,
})

/**
 * 1. Simple Sequence - Basic sequential flow
 * Demonstrates: Basic flow from start to end
 */
const createSequence = (): PetriNet => ({
  id: nanoid(),
  name: 'Sequence',
  places: [
    createPlace('p1', 'Start', 100, 200, 1),
    createPlace('p2', 'Step 1 Done', 300, 200),
    createPlace('p3', 'Step 2 Done', 500, 200),
    createPlace('p4', 'End', 700, 200),
  ],
  transitions: [
    createTransition('t1', 'Step 1', 200, 200),
    createTransition('t2', 'Step 2', 400, 200),
    createTransition('t3', 'Step 3', 600, 200),
  ],
  arcs: [
    createArc('p1', 't1'),
    createArc('t1', 'p2'),
    createArc('p2', 't2'),
    createArc('t2', 'p3'),
    createArc('p3', 't3'),
    createArc('t3', 'p4'),
  ],
  operators: [],
  subProcesses: [],
})

/**
 * 2. Choice/Conflict - XOR decision pattern
 * Demonstrates: Non-deterministic choice, conflict situation
 */
const createChoice = (): PetriNet => ({
  id: nanoid(),
  name: 'Choice (Conflict)',
  places: [
    createPlace('p1', 'Ready', 100, 200, 1),
    createPlace('p2', 'Path A', 400, 100),
    createPlace('p3', 'Path B', 400, 300),
    createPlace('p4', 'Done', 600, 200),
  ],
  transitions: [
    createTransition('t1', 'Choose A', 250, 100),
    createTransition('t2', 'Choose B', 250, 300),
    createTransition('t3', 'Finish A', 500, 100),
    createTransition('t4', 'Finish B', 500, 300),
  ],
  arcs: [
    createArc('p1', 't1'),
    createArc('p1', 't2'),
    createArc('t1', 'p2'),
    createArc('t2', 'p3'),
    createArc('p2', 't3'),
    createArc('p3', 't4'),
    createArc('t3', 'p4'),
    createArc('t4', 'p4'),
  ],
  operators: [],
  subProcesses: [],
})

/**
 * 3. Parallelism - AND-split and AND-join
 * Demonstrates: Concurrent execution, synchronization
 */
const createParallelism = (): PetriNet => ({
  id: nanoid(),
  name: 'Parallelism (AND)',
  places: [
    createPlace('p1', 'Start', 100, 200, 1),
    createPlace('p2', 'Task A Running', 350, 100),
    createPlace('p3', 'Task B Running', 350, 300),
    createPlace('p4', 'Task A Done', 550, 100),
    createPlace('p5', 'Task B Done', 550, 300),
    createPlace('p6', 'End', 800, 200),
  ],
  transitions: [
    createTransition('t1', 'Split', 200, 200),
    createTransition('t2', 'Do Task A', 450, 100),
    createTransition('t3', 'Do Task B', 450, 300),
    createTransition('t4', 'Join', 700, 200),
  ],
  arcs: [
    createArc('p1', 't1'),
    createArc('t1', 'p2'),
    createArc('t1', 'p3'),
    createArc('p2', 't2'),
    createArc('p3', 't3'),
    createArc('t2', 'p4'),
    createArc('t3', 'p5'),
    createArc('p4', 't4'),
    createArc('p5', 't4'),
    createArc('t4', 'p6'),
  ],
  operators: [],
  subProcesses: [],
})

/**
 * 4. Loop/Iteration - Cyclic behavior
 * Demonstrates: Repetitive processes, loops
 */
const createLoop = (): PetriNet => ({
  id: nanoid(),
  name: 'Loop (Iteration)',
  places: [
    createPlace('p1', 'Start', 100, 200, 1),
    createPlace('p2', 'In Loop', 300, 200),
    createPlace('p3', 'End', 600, 200),
  ],
  transitions: [
    createTransition('t1', 'Enter Loop', 200, 200),
    createTransition('t2', 'Repeat', 400, 100),
    createTransition('t3', 'Exit Loop', 450, 200),
  ],
  arcs: [
    createArc('p1', 't1'),
    createArc('t1', 'p2'),
    createArc('p2', 't2'),
    createArc('t2', 'p2'),
    createArc('p2', 't3'),
    createArc('t3', 'p3'),
  ],
  operators: [],
  subProcesses: [],
})

/**
 * 5. Mutual Exclusion (Mutex) - Resource sharing
 * Demonstrates: Shared resource access, critical section
 */
const createMutex = (): PetriNet => ({
  id: nanoid(),
  name: 'Mutual Exclusion',
  places: [
    createPlace('p1', 'Process A Ready', 100, 100, 1),
    createPlace('p2', 'Process B Ready', 100, 300, 1),
    createPlace('p3', 'Resource Free', 300, 200, 1),
    createPlace('p4', 'A in Critical', 450, 100),
    createPlace('p5', 'B in Critical', 450, 300),
    createPlace('p6', 'A Done', 650, 100),
    createPlace('p7', 'B Done', 650, 300),
  ],
  transitions: [
    createTransition('t1', 'A Acquires', 250, 100),
    createTransition('t2', 'B Acquires', 250, 300),
    createTransition('t3', 'A Releases', 550, 100),
    createTransition('t4', 'B Releases', 550, 300),
  ],
  arcs: [
    createArc('p1', 't1'),
    createArc('p3', 't1'),
    createArc('t1', 'p4'),
    createArc('p2', 't2'),
    createArc('p3', 't2'),
    createArc('t2', 'p5'),
    createArc('p4', 't3'),
    createArc('t3', 'p6'),
    createArc('t3', 'p3'),
    createArc('p5', 't4'),
    createArc('t4', 'p7'),
    createArc('t4', 'p3'),
  ],
  operators: [],
  subProcesses: [],
})

/**
 * 6. Producer-Consumer - Classic synchronization pattern
 * Demonstrates: Bounded buffer, producer-consumer problem
 */
const createProducerConsumer = (): PetriNet => ({
  id: nanoid(),
  name: 'Producer-Consumer',
  places: [
    createPlace('p1', 'Producer Ready', 100, 100, 1),
    createPlace('p2', 'Buffer (capacity 3)', 300, 200, 0),
    createPlace('p3', 'Consumer Ready', 100, 300, 1),
    createPlace('p4', 'Empty Slots', 300, 50, 3),
    createPlace('p5', 'Produced', 500, 100),
    createPlace('p6', 'Consumed', 500, 300),
  ],
  transitions: [
    createTransition('t1', 'Produce', 200, 100),
    createTransition('t2', 'Consume', 200, 300),
    createTransition('t3', 'Reset Producer', 400, 100),
    createTransition('t4', 'Reset Consumer', 400, 300),
  ],
  arcs: [
    createArc('p1', 't1'),
    createArc('p4', 't1'),
    createArc('t1', 'p2'),
    createArc('t1', 'p5'),
    createArc('p2', 't2'),
    createArc('p3', 't2'),
    createArc('t2', 'p4'),
    createArc('t2', 'p6'),
    createArc('p5', 't3'),
    createArc('t3', 'p1'),
    createArc('p6', 't4'),
    createArc('t4', 'p3'),
  ],
  operators: [],
  subProcesses: [],
})

/**
 * 7. Semaphore - Token-based synchronization
 * Demonstrates: Counting semaphore, resource pool
 */
const createSemaphore = (): PetriNet => ({
  id: nanoid(),
  name: 'Semaphore (k=2)',
  places: [
    createPlace('p1', 'Waiting A', 100, 100, 1),
    createPlace('p2', 'Waiting B', 100, 200, 1),
    createPlace('p3', 'Waiting C', 100, 300, 1),
    createPlace('p4', 'Semaphore', 300, 200, 2),
    createPlace('p5', 'Active A', 500, 100),
    createPlace('p6', 'Active B', 500, 200),
    createPlace('p7', 'Active C', 500, 300),
  ],
  transitions: [
    createTransition('t1', 'Enter A', 250, 100),
    createTransition('t2', 'Enter B', 250, 200),
    createTransition('t3', 'Enter C', 250, 300),
    createTransition('t4', 'Leave A', 400, 100),
    createTransition('t5', 'Leave B', 400, 200),
    createTransition('t6', 'Leave C', 400, 300),
  ],
  arcs: [
    createArc('p1', 't1'),
    createArc('p4', 't1'),
    createArc('t1', 'p5'),
    createArc('p2', 't2'),
    createArc('p4', 't2'),
    createArc('t2', 'p6'),
    createArc('p3', 't3'),
    createArc('p4', 't3'),
    createArc('t3', 'p7'),
    createArc('p5', 't4'),
    createArc('t4', 'p1'),
    createArc('t4', 'p4'),
    createArc('p6', 't5'),
    createArc('t5', 'p2'),
    createArc('t5', 'p4'),
    createArc('p7', 't6'),
    createArc('t6', 'p3'),
    createArc('t6', 'p4'),
  ],
  operators: [],
  subProcesses: [],
})

/**
 * 8. Workflow with Operators - WoPeD-specific pattern
 * Demonstrates: AND/XOR operators in workflow modeling
 */
const createWorkflowWithOperators = (): PetriNet => {
  const andSplitId = nanoid()
  const xorJoinId = nanoid()
  
  return {
    id: nanoid(),
    name: 'Workflow (Operators)',
    places: [
      createPlace('p1', 'Order Received', 100, 200, 1),
      createPlace('p2', 'Validated', 300, 200),
      createPlace('p3', 'Packaged', 550, 100),
      createPlace('p4', 'Invoice Created', 550, 300),
      createPlace('p5', 'Ready to Ship', 750, 200),
      createPlace('p6', 'Shipped', 950, 200),
    ],
    transitions: [
      createTransition('t1', 'Validate', 200, 200),
      createTransition('t2', 'Package', 450, 100),
      createTransition('t3', 'Create Invoice', 450, 300),
      createTransition('t4', 'Ship', 850, 200),
    ],
    arcs: [
      createArc('p1', 't1'),
      createArc('t1', 'p2'),
      createArc('p2', andSplitId),
      createArc(andSplitId, 't2'),
      createArc(andSplitId, 't3'),
      createArc('t2', 'p3'),
      createArc('t3', 'p4'),
      createArc('p3', xorJoinId),
      createArc('p4', xorJoinId),
      createArc(xorJoinId, 'p5'),
      createArc('p5', 't4'),
      createArc('t4', 'p6'),
    ],
    operators: [
      {
        id: andSplitId,
        type: OperatorType.AND_SPLIT,
        position: { x: 350, y: 200 },
        label: 'Parallel',
      },
      {
        id: xorJoinId,
        type: OperatorType.AND_JOIN,
        position: { x: 650, y: 200 },
        label: 'Sync',
      },
    ],
    subProcesses: [],
  }
}

/**
 * 9. Dining Philosophers (simplified) - Classic concurrency problem
 * Demonstrates: Deadlock potential, resource competition
 */
const createDiningPhilosophers = (): PetriNet => ({
  id: nanoid(),
  name: 'Dining Philosophers (2)',
  places: [
    createPlace('p1', 'Phil 1 Thinking', 150, 100, 1),
    createPlace('p2', 'Phil 2 Thinking', 150, 300, 1),
    createPlace('p3', 'Fork 1', 300, 50, 1),
    createPlace('p4', 'Fork 2', 300, 200, 1),
    createPlace('p5', 'Fork 3', 300, 350, 1),
    createPlace('p6', 'Phil 1 Eating', 500, 100),
    createPlace('p7', 'Phil 2 Eating', 500, 300),
  ],
  transitions: [
    createTransition('t1', 'Phil 1 Takes Forks', 350, 100),
    createTransition('t2', 'Phil 2 Takes Forks', 350, 300),
    createTransition('t3', 'Phil 1 Releases', 450, 100),
    createTransition('t4', 'Phil 2 Releases', 450, 300),
  ],
  arcs: [
    createArc('p1', 't1'),
    createArc('p3', 't1'),
    createArc('p4', 't1'),
    createArc('t1', 'p6'),
    createArc('p2', 't2'),
    createArc('p4', 't2'),
    createArc('p5', 't2'),
    createArc('t2', 'p7'),
    createArc('p6', 't3'),
    createArc('t3', 'p1'),
    createArc('t3', 'p3'),
    createArc('t3', 'p4'),
    createArc('p7', 't4'),
    createArc('t4', 'p2'),
    createArc('t4', 'p4'),
    createArc('t4', 'p5'),
  ],
  operators: [],
  subProcesses: [],
})

/**
 * 10. State Machine - Simple traffic light
 * Demonstrates: State-based modeling
 */
const createStateMachine = (): PetriNet => ({
  id: nanoid(),
  name: 'Traffic Light',
  places: [
    createPlace('p1', 'Red', 200, 100, 1),
    createPlace('p2', 'Yellow', 400, 200),
    createPlace('p3', 'Green', 200, 300),
  ],
  transitions: [
    createTransition('t1', 'Red→Yellow', 300, 100),
    createTransition('t2', 'Yellow→Green', 400, 300),
    createTransition('t3', 'Green→Yellow', 300, 300),
    createTransition('t4', 'Yellow→Red', 200, 200),
  ],
  arcs: [
    createArc('p1', 't1'),
    createArc('t1', 'p2'),
    createArc('p2', 't2'),
    createArc('t2', 'p3'),
    createArc('p3', 't3'),
    createArc('t3', 'p2'),
    createArc('p2', 't4'),
    createArc('t4', 'p1'),
  ],
  operators: [],
  subProcesses: [],
})

// Export all templates
export const templates: Template[] = [
  // Basic patterns
  {
    id: 'sequence',
    nameKey: 'templates.sequence',
    descriptionKey: 'templates.sequenceDesc',
    category: 'basic',
    create: createSequence,
  },
  {
    id: 'choice',
    nameKey: 'templates.choice',
    descriptionKey: 'templates.choiceDesc',
    category: 'basic',
    create: createChoice,
  },
  {
    id: 'parallelism',
    nameKey: 'templates.parallelism',
    descriptionKey: 'templates.parallelismDesc',
    category: 'basic',
    create: createParallelism,
  },
  {
    id: 'loop',
    nameKey: 'templates.loop',
    descriptionKey: 'templates.loopDesc',
    category: 'basic',
    create: createLoop,
  },
  // Synchronization patterns
  {
    id: 'mutex',
    nameKey: 'templates.mutex',
    descriptionKey: 'templates.mutexDesc',
    category: 'patterns',
    create: createMutex,
  },
  {
    id: 'producerConsumer',
    nameKey: 'templates.producerConsumer',
    descriptionKey: 'templates.producerConsumerDesc',
    category: 'patterns',
    create: createProducerConsumer,
  },
  {
    id: 'semaphore',
    nameKey: 'templates.semaphore',
    descriptionKey: 'templates.semaphoreDesc',
    category: 'patterns',
    create: createSemaphore,
  },
  {
    id: 'diningPhilosophers',
    nameKey: 'templates.diningPhilosophers',
    descriptionKey: 'templates.diningPhilosophersDesc',
    category: 'patterns',
    create: createDiningPhilosophers,
  },
  // Workflow patterns
  {
    id: 'workflow',
    nameKey: 'templates.workflow',
    descriptionKey: 'templates.workflowDesc',
    category: 'workflow',
    create: createWorkflowWithOperators,
  },
  {
    id: 'stateMachine',
    nameKey: 'templates.stateMachine',
    descriptionKey: 'templates.stateMachineDesc',
    category: 'workflow',
    create: createStateMachine,
  },
]

// Get templates by category
export const getTemplatesByCategory = (category: Template['category']): Template[] => {
  return templates.filter(t => t.category === category)
}

// Get all categories
export const categories = ['basic', 'patterns', 'workflow'] as const
