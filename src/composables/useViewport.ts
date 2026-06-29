import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePetriNetStore } from '@/stores/petriNet'
import type { Position } from '@/types/petri-net'
import { DEFAULTS, VISUAL } from '@/types/petri-net'
import { scaleFromWheelDelta } from '@/utils/wheelZoom'

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

/**
 * Composable for viewport management
 */
export function useViewport() {
  const store = usePetriNetStore()
  const { viewport, places, transitions, operators } = storeToRefs(store)
  const subProcesses = computed(() => store.subProcesses)

  /**
   * Calculate bounds of all elements including subprocesses
   */
  const elementBounds = computed((): Bounds | null => {
    const allPositions: Position[] = [
      ...places.value.map((p) => p.position),
      ...transitions.value.map((t) => t.position),
      ...operators.value.map((o) => o.position),
      ...subProcesses.value.map((s) => s.position),
    ]

    if (allPositions.length === 0) return null

    const padding = 100 // Padding around elements

    const xs = allPositions.map((p) => p.x)
    const ys = allPositions.map((p) => p.y)

    const minX = Math.min(...xs) - padding
    const maxX = Math.max(...xs) + padding
    const minY = Math.min(...ys) - padding
    const maxY = Math.max(...ys) + padding

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    }
  })

  /**
   * Fit the view to show all elements
   */
  function fitToView(canvasWidth: number, canvasHeight: number) {
    const bounds = elementBounds.value
    if (!bounds) {
      // No elements, reset to default view
      store.setViewport({ x: 0, y: 0, scale: 1 })
      return
    }

    // Calculate scale to fit all elements
    const scaleX = canvasWidth / bounds.width
    const scaleY = canvasHeight / bounds.height
    let scale = Math.min(scaleX, scaleY, DEFAULTS.viewport.maxScale)
    scale = Math.max(scale, DEFAULTS.viewport.minScale)

    // Calculate position to center the view
    const centerX = bounds.minX + bounds.width / 2
    const centerY = bounds.minY + bounds.height / 2

    const x = canvasWidth / 2 - centerX * scale
    const y = canvasHeight / 2 - centerY * scale

    store.setViewport({ x, y, scale })
  }

  /**
   * Zoom to a specific scale centered on canvas
   */
  function zoomTo(newScale: number, canvasWidth: number, canvasHeight: number) {
    const clampedScale = Math.max(
      DEFAULTS.viewport.minScale,
      Math.min(newScale, DEFAULTS.viewport.maxScale)
    )

    // Zoom towards center of canvas
    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2

    const mousePointTo = {
      x: (centerX - viewport.value.x) / viewport.value.scale,
      y: (centerY - viewport.value.y) / viewport.value.scale,
    }

    store.setViewport({
      scale: clampedScale,
      x: centerX - mousePointTo.x * clampedScale,
      y: centerY - mousePointTo.y * clampedScale,
    })
  }

  /**
   * Pan the viewport by a delta
   */
  function pan(dx: number, dy: number) {
    store.setViewport({
      x: viewport.value.x + dx,
      y: viewport.value.y + dy,
    })
  }

  /**
   * Zoom towards a specific point
   */
  function zoomAtPoint(point: Position, deltaY: number, deltaMode = 0) {
    const oldScale = viewport.value.scale
    const newScale = scaleFromWheelDelta(
      oldScale,
      deltaY,
      deltaMode,
      DEFAULTS.viewport.minScale,
      DEFAULTS.viewport.maxScale
    )

    if (newScale === oldScale) return

    const mousePointTo = {
      x: (point.x - viewport.value.x) / oldScale,
      y: (point.y - viewport.value.y) / oldScale,
    }

    store.setViewport({
      scale: newScale,
      x: point.x - mousePointTo.x * newScale,
      y: point.y - mousePointTo.y * newScale,
    })
  }

  /**
   * Center on a specific element
   */
  function centerOnElement(elementId: string, canvasWidth: number, canvasHeight: number) {
    const element = store.getElementById(elementId)
    if (!element || !('position' in element)) return

    const pos = element.position
    const x = canvasWidth / 2 - pos.x * viewport.value.scale
    const y = canvasHeight / 2 - pos.y * viewport.value.scale

    store.setViewport({ x, y })
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  function screenToWorld(screenPos: Position): Position {
    return {
      x: (screenPos.x - viewport.value.x) / viewport.value.scale,
      y: (screenPos.y - viewport.value.y) / viewport.value.scale,
    }
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  function worldToScreen(worldPos: Position): Position {
    return {
      x: worldPos.x * viewport.value.scale + viewport.value.x,
      y: worldPos.y * viewport.value.scale + viewport.value.y,
    }
  }

  /**
   * Get zoom percentage
   */
  const zoomPercent = computed(() => Math.round(viewport.value.scale * 100))

  return {
    viewport,
    elementBounds,
    zoomPercent,
    fitToView,
    zoomTo,
    pan,
    zoomAtPoint,
    centerOnElement,
    screenToWorld,
    worldToScreen,
  }
}
