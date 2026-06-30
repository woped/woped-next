import type { ServicesConfig } from '@/types/config'

/**
 * Build-time endpoint defaults from environment variables. Used as a fallback
 * when no user-defined services config is available (e.g. in unit tests).
 */
export const DEFAULT_TOOL_ENDPOINTS = {
  p2t: import.meta.env.VITE_P2T_ENDPOINT,
  t2p: import.meta.env.VITE_T2P_ENDPOINT,
}

/**
 * Apply an optional port override to a URL. Returns the URL unchanged when no
 * valid port is given or the URL cannot be parsed.
 */
export function withPort(url: string, port?: number | null): string {
  if (!url) return url
  const numericPort = Number(port)
  if (port === undefined || port === null || !Number.isFinite(numericPort)) {
    return url
  }
  try {
    const parsed = new URL(url)
    parsed.port = String(numericPort)
    return parsed.toString()
  } catch {
    return url
  }
}

/**
 * Resolve the effective T2P/P2T endpoints.
 *
 * When a services config is provided, the user-defined URLs, optional port
 * overrides and enabled flags win: a disabled service resolves to an empty
 * endpoint so the caller can fall back to the LLM or report an error. Without a
 * services config the build-time environment defaults are used.
 */
export function getToolEndpoints(servicesConfig?: ServicesConfig): { p2t?: string; t2p?: string } {
  if (servicesConfig) {
    return {
      p2t: servicesConfig.p2tEnabled
        ? withPort(servicesConfig.p2tEndpoint.trim(), servicesConfig.p2tPort)
        : '',
      t2p: servicesConfig.t2pEnabled
        ? withPort(servicesConfig.t2pEndpoint.trim(), servicesConfig.t2pPort)
        : '',
    }
  }

  return DEFAULT_TOOL_ENDPOINTS
}
