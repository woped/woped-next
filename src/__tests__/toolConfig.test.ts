import { describe, it, expect } from "vitest";
import { getToolEndpoints, normalizeT2pEndpoint, withPort } from "@/services/tools/toolConfig";
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

  it("trims configured endpoint URLs", () => {
    const endpoints = getToolEndpoints({
      ...servicesConfig,
      t2pEndpoint: "  http://custom-t2p  ",
    });

    expect(endpoints.t2p).toBe("http://custom-t2p");
  });

  it("applies an optional port override to the endpoints", () => {
    const endpoints = getToolEndpoints({
      ...servicesConfig,
      t2pEndpoint: "https://woped.example.com/t2p",
      t2pPort: 8443,
    });

    expect(endpoints.t2p).toBe("https://woped.example.com:8443/t2p");
    // Untouched service keeps its URL without a port.
    expect(endpoints.p2t).toBe("http://custom-p2t");
  });

  it("normalizes legacy T2P endpoints to the v2 API path", () => {
    expect(
      normalizeT2pEndpoint("https://woped.dhbw-karlsruhe.de/t2p-2.0/generate_pnml"),
    ).toBe("https://woped.dhbw-karlsruhe.de/t2p-2.0/v2/generate/pnml")
  })

  it("rewrites legacy T2P endpoints when resolving tool config", () => {
    const endpoints = getToolEndpoints({
      ...servicesConfig,
      t2pEndpoint: "https://woped.example.com/t2p-2.0/generate_pnml",
    })

    expect(endpoints.t2p).toBe("https://woped.example.com/t2p-2.0/v2/generate/pnml")
  })

  it("falls back to env defaults when no config is provided", () => {
    const endpoints = getToolEndpoints()

    const expectedT2p = import.meta.env.VITE_T2P_ENDPOINT
      ? normalizeT2pEndpoint(import.meta.env.VITE_T2P_ENDPOINT)
      : undefined
    expect(endpoints.t2p).toBe(expectedT2p)
    expect(endpoints.p2t).toBe(import.meta.env.VITE_P2T_ENDPOINT)
  })
})

describe("withPort", () => {
  it("overrides the port when a valid port is given", () => {
    expect(withPort("http://localhost/api", 8080)).toBe("http://localhost:8080/api");
  });

  it("returns the URL unchanged for null/invalid ports", () => {
    expect(withPort("http://localhost:9000/api", null)).toBe("http://localhost:9000/api");
    expect(withPort("http://localhost:9000/api", undefined)).toBe(
      "http://localhost:9000/api",
    );
    expect(withPort("http://localhost:9000/api", Number.NaN)).toBe(
      "http://localhost:9000/api",
    );
  });

  it("returns the input unchanged when the URL cannot be parsed", () => {
    expect(withPort("not a url", 8080)).toBe("not a url");
    expect(withPort("", 8080)).toBe("");
  });
});
