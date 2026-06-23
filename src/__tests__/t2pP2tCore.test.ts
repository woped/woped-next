import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runP2T, runT2P } from "@/services/tools/t2pP2tCore";
import type { LLMConfig } from "@/types/chat";
import type { ServicesConfig } from "@/types/config";

const llmConfig: LLMConfig = {
  provider: "openai",
  apiKey: "sk-test",
  model: "gpt-4o",
  maxTokens: 4096,
  temperature: 0.7,
};

const servicesConfig: ServicesConfig = {
  t2pEndpoint: "http://test-t2p/generate_pnml",
  p2tEndpoint: "http://test-p2t/generateText",
  t2pEnabled: true,
  p2tEnabled: true,
};

vi.mock("@/services/tools/llmFallback", () => ({
  llmFallbackT2P: vi.fn(async () =>
    JSON.stringify({ pnml: '<pnml fallback="true"/>' }),
  ),
  llmFallbackP2T: vi.fn(async () =>
    JSON.stringify({ description: "LLM bypass description" }),
  ),
}));

import { llmFallbackP2T, llmFallbackT2P } from "@/services/tools/llmFallback";

describe("t2pP2tCore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("runT2P returns pnml from service without calling fallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ result: "<pnml/>" }), { status: 200 }),
      ),
    );

    const json = await runT2P(
      { text: "order process" },
      undefined,
      servicesConfig,
    );
    expect(JSON.parse(json).pnml).toBe("<pnml/>");
    expect(llmFallbackT2P).not.toHaveBeenCalled();
  });

  it("runT2P bypasses service and calls LLM fallback on HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 503 })),
    );

    const json = await runT2P(
      { text: "order process" },
      llmConfig,
      servicesConfig,
    );
    expect(JSON.parse(json).pnml).toContain("fallback");
    expect(llmFallbackT2P).toHaveBeenCalledOnce();
  });

  it("runT2P returns error when service fails and no API key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 500 })),
    );

    const json = await runT2P(
      { text: "order process" },
      undefined,
      servicesConfig,
    );
    expect(JSON.parse(json).error).toBeDefined();
    expect(llmFallbackT2P).not.toHaveBeenCalled();
  });

  it("runT2P falls back to LLM when T2P is disabled and API key is present", async () => {
    const disabledConfig = { ...servicesConfig, t2pEnabled: false };

    const json = await runT2P(
      { text: "order process" },
      llmConfig,
      disabledConfig,
    );
    expect(JSON.parse(json).pnml).toContain("fallback");
    expect(llmFallbackT2P).toHaveBeenCalledOnce();
  });

  it("runT2P returns error when T2P is disabled and no API key", async () => {
    const disabledConfig = { ...servicesConfig, t2pEnabled: false };

    const json = await runT2P(
      { text: "order process" },
      undefined,
      disabledConfig,
    );
    expect(JSON.parse(json).error).toContain("disabled");
    expect(llmFallbackT2P).not.toHaveBeenCalled();
  });

  it("runP2T bypasses service and calls LLM fallback on network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    const json = await runP2T({ pnml: "<pnml/>" }, llmConfig, servicesConfig);
    expect(JSON.parse(json).description).toBe("LLM bypass description");
    expect(llmFallbackP2T).toHaveBeenCalledOnce();
  });

  it("runP2T falls back to LLM when P2T is disabled and API key is present", async () => {
    const disabledConfig = { ...servicesConfig, p2tEnabled: false };

    const json = await runP2T({ pnml: "<pnml/>" }, llmConfig, disabledConfig);
    expect(JSON.parse(json).description).toBe("LLM bypass description");
    expect(llmFallbackP2T).toHaveBeenCalledOnce();
  });
});
