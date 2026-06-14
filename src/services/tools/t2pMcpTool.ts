import { z } from "zod";
import type { LLMConfig } from "@/types/chat";
import type { McpTool, McpToolResult } from "@/types/mcp";
import { jsonStringToMcpResult } from "./mcpJsonResult";
import { runT2P } from "./t2pP2tCore";

export const t2pArgsSchema = z
  .object({
    text: z.string().min(1, "text is required"),
    language: z.enum(["en", "de"]).optional(),
  })
  .strict();

export type T2PArgs = z.infer<typeof t2pArgsSchema>;

export const t2pMcpTool: McpTool = {
  name: "t2p_convert",
  description:
    "Convert natural language text to a Petri net (PNML format) using the T2P 2.0 service, with LLM fallback if the service is unavailable.",
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "Process description in natural language",
      },
      language: {
        type: "string",
        description: "Language of the text (defaults to en)",
      },
    },
    required: ["text"],
    additionalProperties: false,
  },
};

export function parseT2PArgs(raw: unknown): T2PArgs {
  return t2pArgsSchema.parse(raw ?? {});
}

export async function executeT2P(
  args: T2PArgs,
  llmConfig?: LLMConfig,
): Promise<McpToolResult> {
  const json = await runT2P(args, llmConfig);
  return jsonStringToMcpResult(json);
}
