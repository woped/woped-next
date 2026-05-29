import { z } from 'zod'
import type { PetriNet } from '@/types/petri-net'
import type { McpTool, McpToolResult } from '@/types/mcp'

export interface GetModelInfoContext {
  getNet: () => PetriNet | null
}

export const defaultGetModelInfoContext: GetModelInfoContext = {
  getNet: () => null,
}

export const getModelInfoArgsSchema = z.object({}).strict()

export type GetModelInfoArgs = z.infer<typeof getModelInfoArgsSchema>

export interface ModelInfoSummary {
  netName: string
  placesCount: number
  transitionsCount: number
  arcsCount: number
  operatorsCount: number
  subProcessesCount: number
  elementNames: string[]
}

export const getModelInfoTool: McpTool = {
  name: 'get_model_info',
  description:
    'Return metadata about the current Petri net (counts and element names).',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
}

export function buildModelInfoSummary(net: PetriNet): ModelInfoSummary {
  const elementNames = [
    ...net.places.map((p) => p.name),
    ...net.transitions.map((t) => t.name),
    ...net.operators.map((o) => o.name),
    ...net.subProcesses.map((s) => s.name),
  ]

  return {
    netName: net.name,
    placesCount: net.places.length,
    transitionsCount: net.transitions.length,
    arcsCount: net.arcs.length,
    operatorsCount: net.operators.length,
    subProcessesCount: net.subProcesses.length,
    elementNames,
  }
}

export function parseGetModelInfoArgs(raw: unknown): GetModelInfoArgs {
  return getModelInfoArgsSchema.parse(raw ?? {})
}

export function executeGetModelInfo(
  _args: GetModelInfoArgs,
  context: GetModelInfoContext
): McpToolResult {
  const net = context.getNet()
  if (!net) {
    return {
      content: [{ type: 'text', text: 'No Petri net is loaded.' }],
      isError: true,
    }
  }

  const summary = buildModelInfoSummary(net)
  return {
    content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
  }
}
