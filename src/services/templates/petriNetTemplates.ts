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
 * 10. Weighted Arcs - Demonstrate arc weights
 * Demonstrates: Multi-token consumption/production, capacity management
 */
const createWeightedArcs = (): PetriNet => ({
  id: nanoid(),
  name: 'Weighted Arcs',
  places: [
    createPlace('p1', 'Raw Material', 100, 200, 6),
    createPlace('p2', 'Assembled', 400, 200),
    createPlace('p3', 'Quality Check', 600, 100),
    createPlace('p4', 'Waste', 600, 300),
    createPlace('p5', 'Finished', 800, 200),
  ],
  transitions: [
    createTransition('t1', 'Assemble (needs 3)', 250, 200),
    createTransition('t2', 'Pass QC', 500, 100),
    createTransition('t3', 'Fail QC', 500, 300),
    createTransition('t4', 'Package (produces 2)', 700, 200),
  ],
  arcs: [
    { ...createArc('p1', 't1'), weight: 3 },
    createArc('t1', 'p2'),
    createArc('p2', 't2'),
    createArc('p2', 't3'),
    createArc('t2', 'p3'),
    createArc('t3', 'p4'),
    createArc('p3', 't4'),
    { ...createArc('t4', 'p5'), weight: 2 },
  ],
  operators: [],
  subProcesses: [],
})

/**
 * 11. Pipeline - Multi-stage processing
 * Demonstrates: Pipelining, intermediate buffers, throughput
 */
const createPipeline = (): PetriNet => ({
  id: nanoid(),
  name: 'Pipeline',
  places: [
    createPlace('p1', 'Input Queue', 100, 200, 3),
    createPlace('p2', 'Stage 1 Buffer', 300, 200),
    createPlace('p3', 'Stage 2 Buffer', 500, 200),
    createPlace('p4', 'Stage 3 Buffer', 700, 200),
    createPlace('p5', 'Output Queue', 900, 200),
    createPlace('p6', 'Worker 1 Free', 200, 80, 1),
    createPlace('p7', 'Worker 2 Free', 400, 80, 1),
    createPlace('p8', 'Worker 3 Free', 600, 80, 1),
  ],
  transitions: [
    createTransition('t1', 'Stage 1', 200, 200),
    createTransition('t2', 'Stage 2', 400, 200),
    createTransition('t3', 'Stage 3', 600, 200),
    createTransition('t4', 'Deliver', 800, 200),
  ],
  arcs: [
    createArc('p1', 't1'),
    createArc('p6', 't1'),
    createArc('t1', 'p2'),
    createArc('t1', 'p6'),
    createArc('p2', 't2'),
    createArc('p7', 't2'),
    createArc('t2', 'p3'),
    createArc('t2', 'p7'),
    createArc('p3', 't3'),
    createArc('p8', 't3'),
    createArc('t3', 'p4'),
    createArc('t3', 'p8'),
    createArc('p4', 't4'),
    createArc('t4', 'p5'),
  ],
  operators: [],
  subProcesses: [],
})

/**
 * 12. Readers-Writers - Classic concurrency problem
 * Demonstrates: Shared resource, multiple readers OR one writer
 */
const createReadersWriters = (): PetriNet => ({
  id: nanoid(),
  name: 'Readers-Writers',
  places: [
    createPlace('p1', 'Reader 1 Idle', 100, 100, 1),
    createPlace('p2', 'Reader 2 Idle', 100, 200, 1),
    createPlace('p3', 'Writer Idle', 100, 350, 1),
    createPlace('p4', 'Access Slots', 350, 200, 2),
    createPlace('p5', 'Reader 1 Reading', 550, 100),
    createPlace('p6', 'Reader 2 Reading', 550, 200),
    createPlace('p7', 'Writer Writing', 550, 350),
  ],
  transitions: [
    createTransition('t1', 'R1 Start Read', 250, 100),
    createTransition('t2', 'R2 Start Read', 250, 200),
    createTransition('t3', 'W Start Write', 250, 350),
    createTransition('t4', 'R1 End Read', 450, 100),
    createTransition('t5', 'R2 End Read', 450, 200),
    createTransition('t6', 'W End Write', 450, 350),
  ],
  arcs: [
    createArc('p1', 't1'),
    createArc('p4', 't1'),
    createArc('t1', 'p5'),
    createArc('p2', 't2'),
    createArc('p4', 't2'),
    createArc('t2', 'p6'),
    createArc('p3', 't3'),
    { ...createArc('p4', 't3'), weight: 2 },
    createArc('t3', 'p7'),
    createArc('p5', 't4'),
    createArc('t4', 'p1'),
    createArc('t4', 'p4'),
    createArc('p6', 't5'),
    createArc('t5', 'p2'),
    createArc('t5', 'p4'),
    createArc('p7', 't6'),
    createArc('t6', 'p3'),
    { ...createArc('t6', 'p4'), weight: 2 },
  ],
  operators: [],
  subProcesses: [],
})

/**
 * 13. Batch Processing - Accumulate then process
 * Demonstrates: Weighted arcs for accumulation, batch firing
 */
const createBatchProcessing = (): PetriNet => ({
  id: nanoid(),
  name: 'Batch Processing',
  places: [
    createPlace('p1', 'Incoming Items', 100, 200, 5),
    createPlace('p2', 'Batch Buffer', 350, 200),
    createPlace('p3', 'Machine Ready', 350, 80, 1),
    createPlace('p4', 'Processed Batch', 600, 200),
    createPlace('p5', 'Output', 800, 200),
  ],
  transitions: [
    createTransition('t1', 'Collect', 220, 200),
    createTransition('t2', 'Process Batch (3)', 480, 200),
    createTransition('t3', 'Distribute', 700, 200),
  ],
  arcs: [
    createArc('p1', 't1'),
    createArc('t1', 'p2'),
    { ...createArc('p2', 't2'), weight: 3 },
    createArc('p3', 't2'),
    createArc('t2', 'p4'),
    createArc('t2', 'p3'),
    createArc('p4', 't3'),
    { ...createArc('t3', 'p5'), weight: 3 },
  ],
  operators: [],
  subProcesses: [],
})

/**
 * 14. Order Fulfillment - Realistic business workflow
 * Demonstrates: Complex workflow with parallel and alternative paths
 */
const createOrderFulfillment = (): PetriNet => {
  const splitId = nanoid()
  const joinId = nanoid()
  
  return {
    id: nanoid(),
    name: 'Order Fulfillment',
    places: [
      createPlace('p1', 'Order Placed', 80, 250, 1),
      createPlace('p2', 'Payment Verified', 280, 250),
      createPlace('p3', 'Inventory Reserved', 530, 150),
      createPlace('p4', 'Label Printed', 530, 350),
      createPlace('p5', 'Ready to Ship', 730, 250),
      createPlace('p6', 'Shipped', 930, 150),
      createPlace('p7', 'Delivered', 1130, 250),
      createPlace('p8', 'Notification Sent', 930, 350),
    ],
    transitions: [
      createTransition('t1', 'Verify Payment', 180, 250),
      createTransition('t2', 'Reserve Stock', 430, 150),
      createTransition('t3', 'Print Label', 430, 350),
      createTransition('t4', 'Ship Order', 830, 150),
      createTransition('t5', 'Confirm Delivery', 1030, 250),
      createTransition('t6', 'Notify Customer', 830, 350),
    ],
    arcs: [
      createArc('p1', 't1'),
      createArc('t1', 'p2'),
      createArc('p2', splitId),
      createArc(splitId, 't2'),
      createArc(splitId, 't3'),
      createArc('t2', 'p3'),
      createArc('t3', 'p4'),
      createArc('p3', joinId),
      createArc('p4', joinId),
      createArc(joinId, 'p5'),
      createArc('p5', 't4'),
      createArc('p5', 't6'),
      createArc('t4', 'p6'),
      createArc('t6', 'p8'),
      createArc('p6', 't5'),
      createArc('t5', 'p7'),
    ],
    operators: [
      {
        id: splitId,
        type: OperatorType.AND_SPLIT,
        position: { x: 380, y: 250 },
        label: 'Prepare',
      },
      {
        id: joinId,
        type: OperatorType.AND_JOIN,
        position: { x: 630, y: 250 },
        label: 'Sync',
      },
    ],
    subProcesses: [],
  }
}

/**
 * 15. Approval Process - Decision workflow with retry loop
 * Demonstrates: Choice, loop-back for rejection, multi-step approval
 */
const createApprovalProcess = (): PetriNet => ({
  id: nanoid(),
  name: 'Approval Process',
  places: [
    createPlace('p1', 'Draft', 100, 200, 1),
    createPlace('p2', 'Submitted', 300, 200),
    createPlace('p3', 'Under Review', 500, 200),
    createPlace('p4', 'Approved', 750, 100),
    createPlace('p5', 'Rejected', 750, 300),
    createPlace('p6', 'Published', 950, 100),
    createPlace('p7', 'Revision Needed', 500, 400),
  ],
  transitions: [
    createTransition('t1', 'Submit', 200, 200),
    createTransition('t2', 'Assign Reviewer', 400, 200),
    createTransition('t3', 'Approve', 625, 100),
    createTransition('t4', 'Reject', 625, 300),
    createTransition('t5', 'Publish', 850, 100),
    createTransition('t6', 'Revise & Resubmit', 350, 400),
  ],
  arcs: [
    createArc('p1', 't1'),
    createArc('t1', 'p2'),
    createArc('p2', 't2'),
    createArc('t2', 'p3'),
    createArc('p3', 't3'),
    createArc('p3', 't4'),
    createArc('t3', 'p4'),
    createArc('t4', 'p5'),
    createArc('p4', 't5'),
    createArc('t5', 'p6'),
    createArc('p5', 't6'),
    createArc('t6', 'p7'),
    createArc('p7', 't2'),
  ],
  operators: [],
  subProcesses: [],
})

/**
 * 16. Error Handling Workflow - Process with exception path
 * Demonstrates: Normal flow with error detection and recovery
 */
const createErrorHandling = (): PetriNet => {
  const xorSplitId = nanoid()
  const xorJoinId = nanoid()

  return {
    id: nanoid(),
    name: 'Error Handling',
    places: [
      createPlace('p1', 'Request', 80, 250, 1),
      createPlace('p2', 'Validated', 280, 250),
      createPlace('p3', 'Processing OK', 530, 100),
      createPlace('p4', 'Processing Error', 530, 400),
      createPlace('p5', 'Result Ready', 730, 100),
      createPlace('p6', 'Error Logged', 730, 300),
      createPlace('p7', 'Retry Ready', 730, 500),
      createPlace('p8', 'Completed', 980, 250),
    ],
    transitions: [
      createTransition('t1', 'Validate', 180, 250),
      createTransition('t2', 'Execute', 430, 100),
      createTransition('t3', 'Fail', 430, 400),
      createTransition('t4', 'Return Result', 630, 100),
      createTransition('t5', 'Log Error', 630, 300),
      createTransition('t6', 'Retry', 630, 500),
      createTransition('t7', 'Deliver', 880, 100),
      createTransition('t8', 'Escalate', 880, 300),
    ],
    arcs: [
      createArc('p1', 't1'),
      createArc('t1', 'p2'),
      createArc('p2', xorSplitId),
      createArc(xorSplitId, 't2'),
      createArc(xorSplitId, 't3'),
      createArc('t2', 'p3'),
      createArc('t3', 'p4'),
      createArc('p3', 't4'),
      createArc('t4', 'p5'),
      createArc('p4', 't5'),
      createArc('p4', 't6'),
      createArc('t5', 'p6'),
      createArc('t6', 'p7'),
      createArc('p7', 't1'),
      createArc('p5', 't7'),
      createArc('t7', 'p8'),
      createArc('p6', 't8'),
      createArc('t8', xorJoinId),
      createArc('p8', xorJoinId),
      createArc(xorJoinId, 'p8'),
    ],
    operators: [
      {
        id: xorSplitId,
        type: OperatorType.XOR_SPLIT,
        position: { x: 380, y: 250 },
        label: 'Route',
      },
      {
        id: xorJoinId,
        type: OperatorType.XOR_JOIN,
        position: { x: 930, y: 250 },
        label: 'Merge',
      },
    ],
    subProcesses: [],
  }
}

/**
 * 17. State Machine - Simple traffic light
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
  {
    id: 'weightedArcs',
    nameKey: 'templates.weightedArcs',
    descriptionKey: 'templates.weightedArcsDesc',
    category: 'basic',
    create: createWeightedArcs,
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
  {
    id: 'pipeline',
    nameKey: 'templates.pipeline',
    descriptionKey: 'templates.pipelineDesc',
    category: 'patterns',
    create: createPipeline,
  },
  {
    id: 'readersWriters',
    nameKey: 'templates.readersWriters',
    descriptionKey: 'templates.readersWritersDesc',
    category: 'patterns',
    create: createReadersWriters,
  },
  {
    id: 'batchProcessing',
    nameKey: 'templates.batchProcessing',
    descriptionKey: 'templates.batchProcessingDesc',
    category: 'patterns',
    create: createBatchProcessing,
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
    id: 'orderFulfillment',
    nameKey: 'templates.orderFulfillment',
    descriptionKey: 'templates.orderFulfillmentDesc',
    category: 'workflow',
    create: createOrderFulfillment,
  },
  {
    id: 'approvalProcess',
    nameKey: 'templates.approvalProcess',
    descriptionKey: 'templates.approvalProcessDesc',
    category: 'workflow',
    create: createApprovalProcess,
  },
  {
    id: 'errorHandling',
    nameKey: 'templates.errorHandling',
    descriptionKey: 'templates.errorHandlingDesc',
    category: 'workflow',
    create: createErrorHandling,
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
