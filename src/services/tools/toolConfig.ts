import type { ServicesConfig } from "@/types/config";

/**
 * Build-time endpoint defaults from environment variables.
 */
export const DEFAULT_TOOL_ENDPOINTS = {
  p2t: import.meta.env.VITE_P2T_ENDPOINT,
  t2p: import.meta.env.VITE_T2P_ENDPOINT,
};

/**
 * Resolve the effective T2P/P2T endpoints.
 *
 * When a services config is provided, the user-defined URLs and enabled flags
 * are used. Disabled services return an empty endpoint so the caller can fall
 * back or report an error. Otherwise the build-time env variables are used.
 */
export function getToolEndpoints(servicesConfig?: ServicesConfig) {
  if (servicesConfig) {
    return {
      p2t: servicesConfig.p2tEnabled ? servicesConfig.p2tEndpoint : "",
      t2p: servicesConfig.t2pEnabled ? servicesConfig.t2pEndpoint : "",
    };
  }

  return DEFAULT_TOOL_ENDPOINTS;
}
