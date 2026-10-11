import { projects } from '@/data/projects'
import { profile } from '@/data/profile'

/**
 * Lumen's suggestion chips, ported from the old portfolio
 * (the myPortfolioV3 repo, src/lib/assistant-suggestions.ts). Client-safe on purpose:
 * it must never import lib/chat/prompt.ts, lib/chat/samples.ts or
 * data/cases, which would ship every case's content to every visitor.
 *
 * Every chip must get a real answer from the offline rules
 * (lib/chat/local.ts); tests/chat-local.test.ts holds them to that.
 */

const first = profile.name.split(' ')[0]

/** The first three sample sites, named the way a visitor would ask. */
const PROJECT_CHIPS = projects.sitesView.sites.slice(0, 3).map((s) => `Tell me about ${s.name}`)

type SuggestionRule = { match: RegExp; suggestions: string[] }

/** Generic intents only, no proper nouns; the sample names come from the data above. Checked in order, first match wins. */
const SUGGESTION_RULES: SuggestionRule[] = [
  {
    // What the sample chips send. Ahead of the about rule, which "about" would otherwise match.
    match: /^tell\s*me\s*about\b/i,
    suggestions: [PROJECT_CHIPS[1] ?? 'Show me the projects', 'Any AI agent builds?', 'Is he taking new work?'],
  },
  {
    match: /\b(projects?|case study|portfolio|samples?|recent work|built|shipped|made)\b/i,
    suggestions: [PROJECT_CHIPS[1] ?? 'Show me the projects', 'Any AI agent builds?', "What's the tech stack?"],
  },
  {
    match: /\b(experience|career|worked|history|years|background)\b/i,
    suggestions: ['What did he study?', 'Where is he based?', 'Show me the projects'],
  },
  {
    match: /\b(skill|stack|tech|tool|languages?|framework|typescript|react|next|node)\b/i,
    suggestions: ['Strongest part of the stack?', 'AI / LLM experience?', 'Comfortable with infra?'],
  },
  {
    match: /\b(prompt|llm|anthropic|claude|rag|retrieval|eval|agents?|\bai\b)\b/i,
    suggestions: ['What AI work has he built?', 'Any AI agent builds?', 'Show me the projects'],
  },
  {
    match: /\b(contact|hire|reach|engage|book|work\s*together|get\s*in\s*touch)\b/i,
    suggestions: ['How does he work?', 'Is he taking new work?', 'What does it cost?'],
  },
  {
    match: /\b(available|hiring|new\s*work|freelance|capacity|open|booking)\b/i,
    suggestions: ['How does he work?', 'What does it cost?', 'Can he join our team?'],
  },
  {
    match: /\b(rate|price|cost|budget|how\s*much|charge|quote)\b/i,
    suggestions: ['How does he work?', 'Who owns the code?', 'Show me the projects'],
  },
  {
    match: /\b(process|workflow|how\s*do\s*you\s*work|timeline|steps?)\b/i,
    suggestions: ['How does he communicate?', 'Who owns the code?', 'Is he taking new work?'],
  },
  {
    match: /\b(service|offer|engagement|automat\w*|what\s*can\s*(you|he)\s*build)\b/i,
    suggestions: ['What does he build?', 'Show me the projects', 'What does it cost?'],
  },
  {
    match: /\b(about|bio|who|story|location|where|based|timezone|remote)\b/i,
    suggestions: ['What did he study?', 'Is he taking new work?', 'Show me the projects'],
  },
]

const DEFAULT_SUGGESTIONS = [`What does ${first} do?`, PROJECT_CHIPS[0] ?? 'Show me the projects', 'How do I get in touch?']

/** The chips under the greeting, before anything is asked. */
export const STARTER_SUGGESTIONS = [`What does ${first} do?`, "What's the tech stack?", 'Is he taking new work?', PROJECT_CHIPS[0] ?? 'Show me the projects']

/** Every chip the widget can show, for the test that each one gets a real answer. */
export const ALL_SUGGESTIONS = [...new Set([...STARTER_SUGGESTIONS, ...DEFAULT_SUGGESTIONS, ...SUGGESTION_RULES.flatMap((r) => r.suggestions)])]

/**
 * Three chips for after a reply. The visitor's latest question is the
 * strongest signal, so it is checked first; the reply is the fallback.
 */
export function suggestionsFor(lastAssistant: string | null, lastUser: string | null): string[] {
  const haystacks = [lastUser, lastAssistant].filter((s): s is string => Boolean(s?.trim()))
  for (const haystack of haystacks) {
    for (const rule of SUGGESTION_RULES) if (rule.match.test(haystack)) return rule.suggestions
  }
  return DEFAULT_SUGGESTIONS
}
