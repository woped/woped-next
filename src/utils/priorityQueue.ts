/**
 * Min-heap based Priority Queue implementation
 * Used for discrete event simulation event scheduling
 */
export class PriorityQueue<T> {
  private heap: T[] = []
  private compare: (a: T, b: T) => number

  /**
   * Create a new priority queue
   * @param compareFn Comparison function (negative = a before b, positive = b before a)
   */
  constructor(compareFn: (a: T, b: T) => number) {
    this.compare = compareFn
  }

  /**
   * Get the number of elements in the queue
   */
  get size(): number {
    return this.heap.length
  }

  /**
   * Check if the queue is empty
   */
  get isEmpty(): boolean {
    return this.heap.length === 0
  }

  /**
   * Add an element to the queue
   */
  push(item: T): void {
    this.heap.push(item)
    this.bubbleUp(this.heap.length - 1)
  }

  /**
   * Remove and return the highest priority element
   */
  pop(): T | undefined {
    if (this.heap.length === 0) return undefined
    if (this.heap.length === 1) return this.heap.pop()

    const result = this.heap[0]
    this.heap[0] = this.heap.pop()!
    this.bubbleDown(0)
    return result
  }

  /**
   * Return the highest priority element without removing it
   */
  peek(): T | undefined {
    return this.heap[0]
  }

  /**
   * Clear all elements from the queue
   */
  clear(): void {
    this.heap = []
  }

  /**
   * Convert queue to array (does not modify queue)
   */
  toArray(): T[] {
    return [...this.heap].sort(this.compare)
  }

  /**
   * Move element up the heap to maintain heap property
   */
  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)
      if (this.compare(this.heap[index], this.heap[parentIndex]) >= 0) break
      this.swap(index, parentIndex)
      index = parentIndex
    }
  }

  /**
   * Move element down the heap to maintain heap property
   */
  private bubbleDown(index: number): void {
    const length = this.heap.length

    while (true) {
      const leftChild = 2 * index + 1
      const rightChild = 2 * index + 2
      let smallest = index

      if (leftChild < length && this.compare(this.heap[leftChild], this.heap[smallest]) < 0) {
        smallest = leftChild
      }

      if (rightChild < length && this.compare(this.heap[rightChild], this.heap[smallest]) < 0) {
        smallest = rightChild
      }

      if (smallest === index) break

      this.swap(index, smallest)
      index = smallest
    }
  }

  /**
   * Swap two elements in the heap
   */
  private swap(i: number, j: number): void {
    const temp = this.heap[i]
    this.heap[i] = this.heap[j]
    this.heap[j] = temp
  }
}
