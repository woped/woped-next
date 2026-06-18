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

export interface ModelInfoElement {
  id: string
  name: string
  type: 'place' | 'transition' | 'operator' | 'subprocess'
  operatorType?: string
}

export interface ModelInfoSummary {
  netName: string
  placesCount: number
  transitionsCount: number
  arcsCount: number
  operatorsCount: number
  subProcessesCount: number
  elementNames: string[]
  elements: ModelInfoElement[]
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
  const elements: ModelInfoElement[] = [
    ...net.places.map((place) => ({
      id: place.id,
      name: place.name || place.id,
      type: 'place' as const,
    })),
    ...net.transitions.map((transition) => ({
      id: transition.id,
      name: transition.name || transition.id,
      type: 'transition' as const,
    })),
    ...net.operators.map((operator) => ({
      id: operator.id,
      name: operator.name || operator.label || operator.id,
      type: 'operator' as const,
      operatorType: operator.operatorType,
    })),
    ...net.subProcesses.map((subProcess) => ({
      id: subProcess.id,
      name: subProcess.name || subProcess.id,
      type: 'subprocess' as const,
    })),
  ]

  const elementNames = elements.map((element) => element.name)

  return {
    netName: net.name,
    placesCount: net.places.length,
    transitionsCount: net.transitions.length,
    arcsCount: net.arcs.length,
    operatorsCount: net.operators.length,
    subProcessesCount: net.subProcesses.length,
    elementNames,
    elements,
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
