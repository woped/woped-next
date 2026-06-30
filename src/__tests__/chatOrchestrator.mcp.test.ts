import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatOrchestrator } from "@/services/chatOrchestrator";
import type { LLMConfig } from "@/types/chat";
import type { ServicesConfig } from "@/types/config";

vi.mock("@/services/modelSerializer", () => ({
  modelSerializer: {
    getModelContext: () => "The model is currently empty.",
    getModelPnml: () => "",
  },
}));

const config: LLMConfig = {
  provider: "openai",
  apiKey: "test-key",
  model: "test-model",
  maxTokens: 100,
  temperature: 0,
};

const servicesConfig: ServicesConfig = {
  t2pEndpoint: "http://test-t2p",
  p2tEndpoint: "http://test-p2t",
  t2pEnabled: true,
  p2tEnabled: true,
  t2pPromptingStrategy: "zero_shot",
};

describe("ChatOrchestrator MCP integration", () => {
  beforeEach(() => {
    const requests: Record<string, unknown>[] = [];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body ?? "{}"));
        requests.push(body);

        if (requests.length === 1) {
          return new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    role: "assistant",
                    content: null,
                    tool_calls: [
                      {
                        id: "call-1",
                        type: "function",
                        function: {
                          name: "help_modeling",
                          arguments: JSON.stringify({ topic: "parallelism" }),
                        },
                      },
                    ],
                  },
                  finish_reason: "tool_calls",
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "Use an AND-split for parallel work.",
                },
                finish_reason: "stop",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("passes MCP tools to the LLM and returns MCP tool results to the chat loop", async () => {
    const orchestrator = new ChatOrchestrator(config, servicesConfig);
    const onToolStart = vi.fn();
    const response = await orchestrator.sendMessage(
      "How do I model parallelism?",
      [],
      { onToolStart },
    );
    const fetchMock = vi.mocked(fetch);
    const firstBody = JSON.parse(
      String(fetchMock.mock.calls[0][1]?.body ?? "{}"),
    );
    const secondBody = JSON.parse(
      String(fetchMock.mock.calls[1][1]?.body ?? "{}"),
    );

    expect(response).toEqual({
      message: "Use an AND-split for parallel work.",
      commands: [],
    });
    expect(onToolStart).toHaveBeenCalledWith("help_modeling");
    expect(firstBody.tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          function: expect.objectContaining({
            name: "help_modeling",
          }),
        }),
      ]),
    );
    expect(secondBody.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "tool",
          tool_call_id: "call-1",
          content: expect.stringContaining("AND-split"),
        }),
      ]),
    );
  });
});
