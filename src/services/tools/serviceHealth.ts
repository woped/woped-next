/**
 * Best-effort reachability probe for an external service endpoint.
 *
 * Uses a `no-cors` GET so that cross-origin endpoints (which do not send CORS
 * headers for arbitrary requests) can still be reached: any HTTP response —
 * even an opaque one or an error status — counts as "reachable", while a
 * network-level failure (DNS, connection refused, timeout) counts as
 * "unreachable". This intentionally does not validate the response body; it
 * only answers "is the server responding?".
 */
export async function pingService(url: string, timeoutMs = 5000): Promise<boolean> {
  const target = (url ?? '').trim()
  if (!target) return false

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    await fetch(target, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
    })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}
