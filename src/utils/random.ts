import type { Distribution } from '@/types/simulation'

/**
 * Seeded random number generator using Linear Congruential Generator
 * Allows reproducible random sequences for simulation
 */
export class SeededRandom {
  private seed: number

  constructor(seed?: number) {
    this.seed = seed ?? Date.now()
  }

  /**
   * Get the current seed
   */
  getSeed(): number {
    return this.seed
  }

  /**
   * Generate a random number in [0, 1)
   */
  random(): number {
    // LCG parameters (same as glibc)
    const a = 1103515245
    const c = 12345
    const m = 2 ** 31

    this.seed = (a * this.seed + c) % m
    return this.seed / m
  }

  /**
   * Generate a random integer in [min, max]
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min
  }

  /**
   * Sample from a distribution
   */
  sample(distribution: Distribution): number {
    switch (distribution.type) {
      case 'constant':
        return distribution.params[0]

      case 'exponential':
        // Inverse transform sampling
        // params[0] = mean (lambda = 1/mean)
        const mean = distribution.params[0]
        return -mean * Math.log(1 - this.random())

      case 'normal':
        // Box-Muller transform
        // params[0] = mean, params[1] = stdDev
        const mu = distribution.params[0]
        const sigma = distribution.params[1]
        const u1 = this.random()
        const u2 = this.random()
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
        return mu + sigma * z

      case 'uniform':
        // params[0] = min, params[1] = max
        const min = distribution.params[0]
        const max = distribution.params[1]
        return min + this.random() * (max - min)

      case 'triangular':
        // params[0] = min, params[1] = mode, params[2] = max
        const a = distribution.params[0]
        const b = distribution.params[1] // mode
        const c = distribution.params[2]
        const u = this.random()
        const fc = (b - a) / (c - a)
        if (u < fc) {
          return a + Math.sqrt(u * (c - a) * (b - a))
        } else {
          return c - Math.sqrt((1 - u) * (c - a) * (c - b))
        }

      default:
        return distribution.params[0] ?? 1
    }
  }
}

/**
 * Statistical helper functions
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

export function variance(values: number[]): number {
  if (values.length < 2) return 0
  const avg = mean(values)
  return values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1)
}

export function standardDeviation(values: number[]): number {
  return Math.sqrt(variance(values))
}

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower])
}

export function min(values: number[]): number {
  if (values.length === 0) return 0
  return Math.min(...values)
}

export function max(values: number[]): number {
  if (values.length === 0) return 0
  return Math.max(...values)
}
