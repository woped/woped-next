/**
 * Command pattern for undo/redo operations.
 *
 * Wraps the snapshot-based history in the petriNet store with a typed
 * command interface. Each command carries a description used for UI
 * display (e.g. "Add Place P3") and delegates execution to a callback
 * that mutates the store. Undo/redo is handled by the store's existing
 * snapshot mechanism — calling saveToHistory() before the mutation.
 */

export interface EditorCommand {
  type: string
  description: string
  execute: () => void
}

export type CommandType =
  | 'addPlace'
  | 'addTransition'
  | 'addOperator'
  | 'addSubProcess'
  | 'addArc'
  | 'updatePlace'
  | 'updateTransition'
  | 'updateOperator'
  | 'updateSubProcess'
  | 'updateArc'
  | 'deleteElement'
  | 'moveElement'
  | 'applyLayout'
  | 'batchEdit'

export function createCommand(
  type: CommandType,
  description: string,
  execute: () => void,
): EditorCommand {
  return { type, description, execute }
}

/**
 * Command history tracker.
 * Keeps a human-readable log parallel to the store's snapshot history.
 */
export class CommandHistory {
  private log: { type: string; description: string; timestamp: number }[] = []
  private pointer = -1
  private maxSize: number

  constructor(maxSize = 50) {
    this.maxSize = maxSize
  }

  push(cmd: EditorCommand) {
    if (this.pointer < this.log.length - 1) {
      this.log = this.log.slice(0, this.pointer + 1)
    }
    this.log.push({
      type: cmd.type,
      description: cmd.description,
      timestamp: Date.now(),
    })
    if (this.log.length > this.maxSize) {
      this.log.shift()
    } else {
      this.pointer++
    }
  }

  undo() {
    if (this.pointer > 0) this.pointer--
  }

  redo() {
    if (this.pointer < this.log.length - 1) this.pointer++
  }

  get current() {
    return this.log[this.pointer] ?? null
  }

  get entries() {
    return [...this.log]
  }

  get index() {
    return this.pointer
  }

  clear() {
    this.log = []
    this.pointer = -1
  }
}
