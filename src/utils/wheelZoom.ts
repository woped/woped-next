/** Pixels → scale factor; lower values reduce wheel / trackpad zoom sensitivity */
const WHEEL_ZOOM_SENSITIVITY = 0.00045

/** Cap per wheel event so pinch gestures do not jump too far in one frame */
const MIN_SCALE_FACTOR = 0.94
const MAX_SCALE_FACTOR = 1.06

export function normalizeWheelDelta(deltaY: number, deltaMode: number): number {
  if (deltaMode === 1) return deltaY * 16
  if (deltaMode === 2) return deltaY * 100
  return deltaY
}

export function scaleFromWheelDelta(
  currentScale: number,
  deltaY: number,
  deltaMode: number,
  minScale: number,
  maxScale: number
): number {
  const delta = normalizeWheelDelta(deltaY, deltaMode)
  const rawFactor = Math.exp(-delta * WHEEL_ZOOM_SENSITIVITY)
  const factor = Math.max(MIN_SCALE_FACTOR, Math.min(MAX_SCALE_FACTOR, rawFactor))
  return Math.min(maxScale, Math.max(minScale, currentScale * factor))
}
