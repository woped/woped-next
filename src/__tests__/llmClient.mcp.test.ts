import { describe, expect, it, vi } from "vitest";
import { LLMClient } from "@/services/llmClient";
import type { BrowserMcpServer, McpTool, McpToolCall } from "@/types/mcp";
import type { LLMConfig } from "@/types/chat";

const config: LLMConfig = {
  provider: "openai",
  apiKey: "test-key",
  model: "test-model",
  maxTokens: 100,
  temperature: 0,
};

describe("LLMClient MCP integration", () => {
  it("queries tools from the configured MCP server", () => {
    const tools: McpTool[] = [
      {
        name: "get_model_info",
        description: "Return model info",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
    ];
    const server: BrowserMcpServer = {
      registerTool: vi.fn(),
      listTools: vi.fn(() => tools),
      callTool: vi.fn(),
    };

    const client = new LLMClient(config, server);

    expect(client.getToolsForCompletion()).toEqual([
      {
        type: "function",
        function: {
          name: "get_model_info",
          description: "Return model info",
          parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
        },
      },
    ]);
    expect(server.listTools).toHaveBeenCalledOnce();
  });

  it("executes a tool call through the configured MCP server", async () => {
    const callTool = vi.fn(async (_call: McpToolCall) => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            command: {
              type: "add_place",
              params: { name: "Start" },
            },
          }),
        },
      ],
    }));
    const server: BrowserMcpServer = {
      registerTool: vi.fn(),
      listTools: vi.fn(() => []),
      callTool,
    };

    const client = new LLMClient(config, server);
    const result = await client.executeMcpToolCall({
      id: "call-1",
      name: "modify_model",
      arguments: {
        action: "add_place",
        params: { name: "Start" },
      },
    });

    expect(callTool).toHaveBeenCalledWith({
      name: "modify_model",
      arguments: {
        action: "add_place",
        params: { name: "Start" },
      },
    });
    expect(result.result.toolCallId).toBe("call-1");
    expect(result.commands).toEqual([
      {
        type: "add_place",
        params: { name: "Start" },
      },
    ]);
  });
});
