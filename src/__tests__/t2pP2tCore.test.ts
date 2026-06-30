import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runP2T, runT2P } from "@/services/tools/t2pP2tCore";
import type { LLMConfig } from "@/types/chat";

const llmConfig: LLMConfig = {
  provider: "openai",
  apiKey: "sk-test",
  model: "gpt-4o",
  maxTokens: 4096,
  temperature: 0.7,
};

vi.mock("@/services/tools/toolConfig", () => ({
  getToolEndpoints: () => ({
    t2p: "http://test-t2p/generate_pnml",
    p2t: "http://test-p2t/generateText",
  }),
}));

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
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ result: "<pnml/>" }), { status: 200 }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const json = await runT2P({ text: "order process" }, llmConfig)
    expect(JSON.parse(json).pnml).toBe("<pnml/>")
    expect(llmFallbackT2P).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledWith(
      "http://test-t2p/generate_pnml",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer sk-test",
        },
        body: JSON.stringify({
          text: "order process",
          provider: "openai",
          model: "gpt-4o",
          prompting_strategy: "zero_shot",
        }),
      }),
    )
  })

  it("runT2P returns error when T2P is enabled but no API key is configured", async () => {
    const json = await runT2P({ text: "order process" })
    expect(JSON.parse(json).error).toContain("API key")
    expect(llmFallbackT2P).not.toHaveBeenCalled()
  })

  it("runT2P uses prompting strategy from services config", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ result: "<pnml/>" }), { status: 200 }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const services = {
      t2pEndpoint: "http://test-t2p/v2/generate/pnml",
      t2pEnabled: true,
      t2pPromptingStrategy: "zero_shot" as const,
      p2tEndpoint: "",
      p2tEnabled: false,
    }

    await runT2P({ text: "atm process" }, llmConfig, services)

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          text: "atm process",
          provider: "openai",
          model: "gpt-4o",
          prompting_strategy: "zero_shot",
        }),
      }),
    )
  })

  it("runT2P bypasses service and calls LLM fallback on HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            error: { code: "upstream_error", message: "The LLM provider call failed." },
          }),
          { status: 500 },
        ),
      ),
    )

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    const json = await runT2P({ text: "order process" }, llmConfig)
    expect(JSON.parse(json).pnml).toContain("fallback")
    expect(llmFallbackT2P).toHaveBeenCalledOnce()
    expect(warnSpy.mock.calls.some((call) => String(call[0]).includes("upstream_error"))).toBe(
      true,
    )

    warnSpy.mockRestore()
  })

  it("runP2T bypasses service and calls LLM fallback on network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    const json = await runP2T({ pnml: "<pnml/>" }, llmConfig);
    expect(JSON.parse(json).description).toBe("LLM bypass description");
    expect(llmFallbackP2T).toHaveBeenCalledOnce();
  });
});
