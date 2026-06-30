import { describe, it, expect, vi, beforeEach } from "vitest";
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

vi.mock("@/services/tools/llmFallback", () => ({
  llmFallbackT2P: vi.fn(async () =>
    JSON.stringify({ pnml: '<pnml fallback="true"/>' }),
  ),
  llmFallbackP2T: vi.fn(async () =>
    JSON.stringify({ description: "LLM bypass description" }),
  ),
}));

import { llmFallbackP2T, llmFallbackT2P } from "@/services/tools/llmFallback";

describe("t2pP2tCore with disabled services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Fetch must never be called when the service is disabled.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("fetch should not be called for a disabled service");
      }),
    );
  });

  const disabled: ServicesConfig = {
    t2pEndpoint: "http://example.com/t2p",
    p2tEndpoint: "http://example.com/p2t",
    t2pEnabled: false,
    p2tEnabled: false,
  };

  it("runT2P uses the LLM fallback when T2P is disabled", async () => {
    const json = await runT2P({ text: "order process" }, llmConfig, disabled);

    expect(JSON.parse(json).pnml).toContain("fallback");
    expect(llmFallbackT2P).toHaveBeenCalledOnce();
  });

  it("runP2T uses the LLM fallback when P2T is disabled", async () => {
    const json = await runP2T({ pnml: "<pnml/>" }, llmConfig, disabled);

    expect(JSON.parse(json).description).toBe("LLM bypass description");
    expect(llmFallbackP2T).toHaveBeenCalledOnce();
  });

  it("runT2P returns an error when disabled and no API key is available", async () => {
    const json = await runT2P({ text: "order process" }, undefined, disabled);

    expect(JSON.parse(json).error).toBeDefined();
    expect(llmFallbackT2P).not.toHaveBeenCalled();
  });
});
