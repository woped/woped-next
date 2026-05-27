import { LLMClient } from '../llmClient'
import { chatLogger } from '../chatLogger'
import type { LLMConfig } from '@/types/chat'

export async function llmFallbackT2P(
  config: LLMConfig,
  text: string,
  language: string,
): Promise<string> {
  chatLogger.warn('T2P service unavailable — using LLM fallback')

  const client = new LLMClient({ ...config, temperature: 0.3 })
  const response = await client.chatCompletion([
    {
      role: 'system',
      content: `You are a Petri net expert. Convert the following process description into valid PNML (Petri Net Markup Language) XML. 
Rules:
- Create a well-formed workflow net with one source place and one sink place
- Use unique IDs for all elements (e.g., p1, p2, t1, t2)
- Include proper positioning (graphics/position) for visual layout
- Places are circles, transitions are rectangles
- Connect elements with arcs (place→transition or transition→place only)
- Return ONLY the PNML XML, no explanation
- The net type should be: http://www.pnml.org/version-2009/grammar/pnmlcoremodel`,
    },
    {
      role: 'user',
      content: `Convert this ${language === 'de' ? 'German' : 'English'} process description to PNML:\n\n${text}`,
    },
  ])

  const pnml = response.message.content || ''
  const cleaned = pnml.replace(/```xml\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.stringify({ pnml: cleaned })
}

export async function llmFallbackP2T(
  config: LLMConfig,
  pnml: string,
): Promise<string> {
  chatLogger.warn('P2T service unavailable — using LLM fallback')

  const client = new LLMClient({ ...config, temperature: 0.5 })
  const response = await client.chatCompletion([
    {
      role: 'system',
      content: `You are a Petri net expert. Analyze the given PNML XML and describe the modeled process in clear, concise natural language. 
Focus on:
- What the process does (start to end)
- Key activities (transitions)
- Parallel paths or choices if present
- The overall workflow structure
Keep the description under 200 words.`,
    },
    {
      role: 'user',
      content: `Describe this Petri net model:\n\n${pnml.substring(0, 6000)}`,
    },
  ])

  const description = response.message.content || 'Could not describe the model.'
  return JSON.stringify({ description })
}

export async function llmFallbackTransform(
  config: LLMConfig,
  xml: string,
  sourceFormat: 'pnml' | 'bpmn',
  targetFormat: 'pnml' | 'bpmn',
): Promise<string> {
  chatLogger.warn('Model Transformer service unavailable — using LLM fallback')

  const client = new LLMClient({ ...config, temperature: 0.2 })
  const response = await client.chatCompletion([
    {
      role: 'system',
      content: `You are an expert in process modeling formats. Convert the given ${sourceFormat.toUpperCase()} XML to valid ${targetFormat.toUpperCase()} XML. Return ONLY the resulting XML, no explanation.`,
    },
    {
      role: 'user',
      content: `Convert this ${sourceFormat.toUpperCase()} to ${targetFormat.toUpperCase()}:\n\n${xml.substring(0, 6000)}`,
    },
  ])

  const result = response.message.content || ''
  const cleaned = result.replace(/```xml\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.stringify({ result: cleaned })
}
