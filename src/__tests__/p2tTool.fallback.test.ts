import { afterEach, describe, expect, it, vi } from "vitest";
import type { LLMConfig } from "@/types/chat";
import { llmFallbackP2T } from "@/services/tools/llmFallback";

vi.mock("@/services/tools/llmFallback", () => ({
  llmFallbackP2T: vi.fn(),
  llmFallbackT2P: vi.fn(),
}));

vi.mock("@/services/tools/toolConfig", () => ({
  TOOL_ENDPOINTS: { p2t: undefined, t2p: undefined },
}));

const llmConfig: LLMConfig = {
  apiKey: "test-key",
  model: "gemini-2.5-flash",
  maxTokens: 256,
  temperature: 0.2,
};

describe("P2T LLM fallback", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses LLM fallback when the P2T endpoint is not configured", async () => {
    vi.mocked(llmFallbackP2T).mockResolvedValue(
      JSON.stringify({ description: "Parallel tasks A and B." }),
    );

    const { runP2T } = await import("@/services/tools/t2pP2tCore");
    const result = await runP2T({ pnml: "<pnml />" }, llmConfig);
    const parsed = JSON.parse(result);

    expect(parsed.description).toContain("Parallel tasks");
    expect(llmFallbackP2T).toHaveBeenCalled();
  });
});
