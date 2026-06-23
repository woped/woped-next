import { describe, it, expect } from "vitest";
import { getToolEndpoints } from "@/services/tools/toolConfig";
import type { ServicesConfig } from "@/types/config";

const servicesConfig: ServicesConfig = {
  t2pEndpoint: "http://custom-t2p",
  p2tEndpoint: "http://custom-p2t",
  t2pEnabled: true,
  p2tEnabled: true,
};

describe("toolConfig", () => {
  it("returns configured endpoints when services are enabled", () => {
    const endpoints = getToolEndpoints(servicesConfig);

    expect(endpoints.t2p).toBe("http://custom-t2p");
    expect(endpoints.p2t).toBe("http://custom-p2t");
  });

  it("returns empty endpoints when services are disabled", () => {
    const endpoints = getToolEndpoints({
      ...servicesConfig,
      t2pEnabled: false,
      p2tEnabled: false,
    });

    expect(endpoints.t2p).toBe("");
    expect(endpoints.p2t).toBe("");
  });

  it("falls back to env defaults when no config is provided", () => {
    const endpoints = getToolEndpoints();

    expect(endpoints.t2p).toBe(import.meta.env.VITE_T2P_ENDPOINT);
    expect(endpoints.p2t).toBe(import.meta.env.VITE_P2T_ENDPOINT);
  });
});
