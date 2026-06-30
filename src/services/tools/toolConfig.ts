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
 * Map legacy T2P 1.x endpoints to the T2P 2.0 v2 API path.
 */
export function normalizeT2pEndpoint(url: string): string {
  const trimmed = (url ?? '').trim()
  if (!trimmed) return trimmed

  try {
    const parsed = new URL(trimmed)
    if (!parsed.pathname.endsWith('/generate_pnml')) {
      return trimmed
    }
    parsed.pathname = parsed.pathname.replace(/\/generate_pnml$/, '/v2/generate/pnml')
    return parsed.toString()
  } catch {
    return trimmed
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
        ? normalizeT2pEndpoint(
            withPort(servicesConfig.t2pEndpoint.trim(), servicesConfig.t2pPort),
          )
        : '',
    }
  }

  return {
    p2t: DEFAULT_TOOL_ENDPOINTS.p2t,
    t2p: DEFAULT_TOOL_ENDPOINTS.t2p
      ? normalizeT2pEndpoint(DEFAULT_TOOL_ENDPOINTS.t2p)
      : undefined,
  }
}
