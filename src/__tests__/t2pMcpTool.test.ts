import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  executeT2P,
  parseT2PArgs,
  t2pMcpTool,
} from "@/services/tools/t2pMcpTool";
import type { LLMConfig } from "@/types/chat";

vi.mock("@/services/tools/toolConfig", () => ({
  getToolEndpoints: vi.fn(() => ({
    t2p: "http://test-t2p/generate_pnml",
    p2t: "http://test-p2t/generateText",
  })),
}));

vi.mock("@/services/tools/llmFallback", () => ({
  llmFallbackT2P: vi.fn(async () =>
    JSON.stringify({ pnml: '<pnml fallback="true"/>' }),
  ),
  llmFallbackP2T: vi.fn(),
}));

const llmConfig: LLMConfig = {
  provider: "openai",
  apiKey: "sk-test",
  model: "gpt-4o",
  maxTokens: 4096,
  temperature: 0.7,
};

describe("t2pMcpTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exposes a valid MCP tool definition", () => {
    expect(t2pMcpTool.name).toBe("t2p_convert");
    expect(t2pMcpTool.inputSchema.required).toEqual(["text"]);
  });

  it("parses valid arguments with default language", () => {
    const parsed = parseT2PArgs({ text: "Order process" });
    expect(parsed.text).toBe("Order process");
  });

  it("parses valid arguments with explicit language", () => {
    const parsed = parseT2PArgs({ text: "Order process", language: "de" });
    expect(parsed.language).toBe("de");
  });

  it("rejects missing text", () => {
    expect(() => parseT2PArgs({})).toThrow();
  });

  it("rejects empty text", () => {
    expect(() => parseT2PArgs({ text: "" })).toThrow();
  });

  it("rejects unsupported language", () => {
    expect(() => parseT2PArgs({ text: "x", language: "fr" })).toThrow();
  });

  it("returns pnml from a successful T2P response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ result: "<pnml/>" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    const result = await executeT2P({ text: "order process" });

    expect(result.isError).toBeFalsy();
    const payload = JSON.parse(result.content[0].text);
    expect(payload.pnml).toBe("<pnml/>");
  });

  it("returns an error result when the T2P service responds non-2xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 500 })),
    );

    const result = await executeT2P({ text: "order process" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("500");
  });

  it("uses LLM fallback when the service fails and llmConfig is set", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 503 })),
    );

    const result = await executeT2P({ text: "order process" }, llmConfig);

    expect(result.isError).toBeFalsy();
    const payload = JSON.parse(result.content[0].text);
    expect(payload.pnml).toContain("fallback");
  });

  it("returns an error result when the network call throws without llmConfig", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    const result = await executeT2P({ text: "order process" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text.toLowerCase()).toContain("unreachable");
  });
});
