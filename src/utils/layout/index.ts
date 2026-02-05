import type { PetriNet, Position } from '@/types/petri-net'
import { hierarchicalLayout } from './hierarchical'
import { forceDirectedLayout } from './force'
import { gridLayout } from './grid'

/**
 * Layout direction options
 */
export type LayoutDirection = 'LR' | 'TB' | 'RL' | 'BT'

/**
 * Layout algorithm options
 */
export type LayoutAlgorithm = 'hierarchical' | 'force' | 'grid'

/**
 * Layout options interface
 */
export interface LayoutOptions {
  algorithm: LayoutAlgorithm
  direction: LayoutDirection
  nodeSpacing: number
  rankSpacing: number
  animate?: boolean
}

/**
 * Default layout options
 */
export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  algorithm: 'hierarchical',
  direction: 'LR',
  nodeSpacing: 80,
  rankSpacing: 120,
  animate: true,
}

/**
 * Result of layout calculation
 */
export interface LayoutResult {
  positions: Map<string, Position>
  success: boolean
  message?: string
}

/**
 * Apply auto-layout to a Petri net
 */
export function autoLayout(net: PetriNet, options: Partial<LayoutOptions> = {}): LayoutResult {
  const opts: LayoutOptions = { ...DEFAULT_LAYOUT_OPTIONS, ...options }

  try {
    switch (opts.algorithm) {
      case 'hierarchical':
        return hierarchicalLayout(net, opts)
      case 'force':
        return forceDirectedLayout(net, opts)
      case 'grid':
        return gridLayout(net, opts)
      default:
        return {
          positions: new Map(),
          success: false,
          message: `Unknown algorithm: ${opts.algorithm}`,
        }
    }
  } catch (error) {
    return {
      positions: new Map(),
      success: false,
      message: error instanceof Error ? error.message : 'Layout failed',
    }
  }
}

export { hierarchicalLayout } from './hierarchical'
export { forceDirectedLayout } from './force'
export { gridLayout } from './grid'
