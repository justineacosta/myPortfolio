import { siteKnowledge, type Knowledge } from '@/lib/assistant/knowledge'
import { PERSONA } from '@/lib/assistant/prompt'
import { siteTools, type ToolRunner } from '@/lib/assistant/tools'

/** What makes an assistant this site's: what it knows, how it behaves and what it may do. */
export type AssistantConfig = { knowledge: Knowledge; persona: string; tools: ToolRunner[] }

/** This site's assistant. */
export function siteAssistant(): AssistantConfig {
  return { knowledge: siteKnowledge, persona: PERSONA, tools: siteTools() }
}
