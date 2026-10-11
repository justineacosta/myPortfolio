import { profile } from '@/data/profile'
import { about } from '@/data/about'
import { SERVICES, PROCESS } from '@/data/services'
import { FAQS } from '@/data/faqs'
import { TOOLS, EXPERIMENTAL } from '@/data/stack'
import { CERTS } from '@/data/credentials'
import { assistantFacts as facts } from '@/data/assistantFacts'
import { SAMPLE_PROJECTS, type SampleProject } from './samples'

/**
 * Lumen's offline tier, ported from the old portfolio
 * (oldportfolio/src/lib/assistant-local.ts): hand-tuned keyword rules that
 * answer from this site's data when there is no API key, or when the Claude
 * call fails. RULES is ordered and the first match wins, so a broad rule can
 * shadow a narrower one further down; the comments say where order matters.
 * Server-only: SAMPLE_PROJECTS pulls in every case.
 */

type Rule = {
  match: RegExp
  /** Receives the question so a rule can search; most rules ignore it. */
  reply: (question: string) => string
  /** Clear hiring intent only: the reply ends with the in-chat form. */
  leadForm?: boolean
}

const first = profile.name.split(' ')[0]
/** The job title mid-sentence: only its first letter lowered, so "AI" stays "AI". */
const role = profile.jobTitle[0].toLowerCase() + profile.jobTitle.slice(1)

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'what', 'how', 'why', 'when', 'does', 'did', 'can', 'should', 'would', 'you', 'your', 'this', 'that',
  'with', 'about', 'any', 'have', 'has', 'there', 'here', 'get', 'got', 'tell', 'show', 'sample', 'built', 'build',
])

/** The words a sample is known by: its name and its trade. */
const sampleWords = (p: SampleProject) => `${p.name} ${p.key.replace(/-/g, ' ')} ${p.trade}`.toLowerCase()

/** The sample system a question names, scored on its name and trade; two weak hits are not enough. */
function findSample(question: string): SampleProject | undefined {
  const terms = (question.toLowerCase().match(/[a-z0-9&.+#-]{3,}/g) ?? []).filter((t) => !STOP_WORDS.has(t))
  let best: { p: SampleProject; score: number } | undefined
  for (const p of SAMPLE_PROJECTS) {
    const name = p.name.toLowerCase()
    const words = sampleWords(p)
    let score = 0
    for (const t of terms) {
      if (name.includes(t)) score += 3
      else if (words.includes(t)) score += 2
    }
    if (score > 0 && (!best || score > best.score)) best = { p, score }
  }
  return best && best.score >= 2 ? best.p : undefined
}

function sampleReply(p: SampleProject): string {
  const agents = p.builds.length ? ` AI agents: ${p.builds.join(', ')}.` : ''
  const flows = p.flows.length ? ` Flows: ${p.flows.join(', ')}.` : ''
  return `**${p.name}** is a sample system for a fictional ${p.trade}: a full [site](${p.site}), plus the agents and automations behind it.${agents}${flows} Full write-up in [the case study](${p.href}).\n\n[[project:${p.key}]]`
}

const using = TOOLS.map((t) => t.name).filter((n) => !EXPERIMENTAL.includes(n))
const INFRA = ['Docker', 'Vercel', 'Cloudflare', 'GitHub Actions', 'Redis', 'Supabase', 'PostgreSQL'].filter((n) => using.includes(n))
const github = profile.socials.find((s) => s.label === 'GitHub')
/** "Based in Manila, Philippines", to follow a name. */
const based = about.location.title.replace(/^Based/, 'based')
const bio = () => `**${profile.name}** is a ${role}, ${based}. ${facts.summary} More on [the about page](/about).`

const RULES: Rule[] = [
  {
    match: /^(hi|hey|hello|sup|yo|howdy|gm|good\s*(morning|afternoon|evening))\b/i,
    reply: () => `Hi, happy to help. Ask me about ${first}'s [projects](/projects), [services](/services), or how to [get in touch](/contact).`,
  },
  {
    match: /\b(thanks|thank\s*you|thx|ty)\b/i,
    reply: () => `Anytime. Anything else you want to know about ${first}?`,
  },
  {
    match: /\b(who\s+is\s+(justine|he)|about\s+(justine|him)|^about$|background|^bio$|^story$)\b/i,
    reply: bio,
  },
  {
    // Before the stack rule, whose "languages?" would otherwise take "what languages does he speak".
    match: /\b(speak|fluent|filipino|tagalog|english)\b/i,
    reply: () => `${facts.personal.languages.join(' and ')}.`,
  },
  {
    // Before the stack rule: "Strongest part of the stack?" is a chip.
    match: /\b(strongest|best.*at|specialty|specialise|specialize|expertise|core)\b/i,
    reply: () => `${FAQS[0].a} See [the services](/services).`,
  },
  {
    // Stems are pluralised on purpose: a bare `tool` inside \b(...)\b never matches "tools".
    match: /\b(stacks?|tech|tools?|languages?|frameworks?|primary)\b/i,
    reply: () => `In use: ${using.join(', ')}.\n\nStill testing: ${EXPERIMENTAL.join(', ')}. The full stack is on [the about page](/about).`,
  },
  {
    match: /\b(infra|infrastructure|devops|deploy(s|ed|ment)?|hosting|cloud|aws|vercel|cloudflare|docker|ci\/?cd|pipelines?)\b/i,
    reply: () => `Yes: ${INFRA.join(', ')}, and ${CERTS[0]?.name ?? 'cloud courses'}. More on [the about page](/about).`,
  },
  {
    // Before the projects rule: "Any AI agent builds?" is a chip.
    match: /\b(prompts?|llms?|anthropic|claude|rag|retrieval|evals?|agents?|chatbots?|\bai\b)\b/i,
    reply: () => {
      const ai = SERVICES.find((s) => /ai/i.test(s.name))
      const builds = SAMPLE_PROJECTS.flatMap((p) => p.builds.slice(0, 1).map((b) => `- **${b}** for ${p.name}, a fictional ${p.trade}`)).slice(0, 3)
      return `${ai ? `**${ai.name}**: ${ai.line} ${ai.bullets.join('. ')}.` : ''} Sample builds:\n${builds.join('\n')}\n\nAll of them on [the AI agents page](/ai-agents.html).`
    },
  },
  {
    match: /\b(projects?|case|portfolio|samples?|examples?|recent\s*work|built|shipped|made)\b/i,
    reply: () => {
      const list = SAMPLE_PROJECTS.slice(0, 3).map((p) => `- [**${p.name}**](${p.href}): a fictional ${p.trade}`)
      return `${first} builds full sample systems (a site, AI agents and automations) for fictional businesses. A few:\n${list.join('\n')}\n\nThe full set is on [the projects page](/projects).`
    },
  },
  {
    match: /\b(experience|career|history|previous|past\s*job|milestones?|graduat\w*|degrees?|university|college|school|stud(y|ied|ies)|educat\w*|majors?|courses?|certificat\w*)\b/i,
    reply: () => `**Education:** ${facts.personal.education}. **Courses:** ${CERTS.map((c) => c.name).join(', ')}. ${facts.personal.origin} More on [the about page](/about).`,
  },
  {
    // Before the process rule: "How does he communicate?" is a chip.
    match: /\b(communicat(e|es|ion|ing)|check[-\s]?ins?|status\s*updates?|stay\s*in\s*touch)\b/i,
    reply: () => `${facts.communication} Start a thread on [the contact page](/contact).`,
  },
  {
    match: /\b(process|how\s*(do|does)\s*(you|he)\s*work|workflow|what.*expect|steps?|onboard|kickoff)\b/i,
    reply: () => `Every project runs through the same five steps:\n${PROCESS.map((s) => `- **${s.name}**: ${s.line}`).join('\n')}\n\nMore on [the services page](/services).`,
  },
  {
    match: /\b(own(s|ership)?\s*the\s*code|who\s*owns|license|licensing|ip\b|intellectual\s*property)\b/i,
    reply: () => `${facts.ownership} Ask the specifics on [the contact page](/contact).`,
  },
  {
    match: /\b(teams?|collaborat\w*|agency|solo|alone|in-house)\b/i,
    reply: () => `${facts.faq[0].answer} [Get in touch](/contact) with what your setup looks like.`,
  },
  {
    match: /\b(maintain\w*|maintenance|support|after\s*launch|ongoing)\b/i,
    reply: () => `${FAQS[4].a} Raise it on [the contact page](/contact).`,
  },
  {
    match: /\b(designs?|ui|ux|figma|mockups?|brand)\b/i,
    reply: () => `${facts.faq[1].answer} See [the services](/services) for the shapes that takes.`,
  },
  {
    match: /\b(hobby|hobbies|outside\s*work|free\s*time|fun|interests?|sports?|esports?|games?)\b/i,
    reply: () => `${facts.personal.interests} ${facts.personal.origin}`,
  },
  {
    match: /\b(contact|hire|email|reach|engage|book|work\s*together|get\s*in.*touch)\b/i,
    reply: () => `Easiest way: [the contact page](/contact). ${facts.reply}`,
    leadForm: true,
  },
  {
    // "open to", not a bare "open", so "is his code open source?" doesn't get the form.
    match: /\b(available|availability|hiring|new\s*work|freelance|capacity|open\s+to|booking|start)\b/i,
    reply: () => `${facts.availability} ${facts.start} Drop a note via [contact](/contact) with the shape of the work.`,
    leadForm: true,
  },
  {
    // "build" lands "What does he build?" (a chip) here; the projects rule owns "built".
    match: /\b(services?|offers?|build(s|ing)?|automat\w*|kind.*work|what.*do.*you.*do)\b/i,
    reply: () => `${first} works across six areas:\n${SERVICES.map((s) => `- **${s.name}**: ${s.line}`).join('\n')}\n\nMore on [the services page](/services).`,
  },
  {
    match: /\b(location|where|based|timezone|remote|onsite|country|city)\b/i,
    reply: () => `${first} is ${based}, and works remotely with teams worldwide, overlapping US, EU and CA hours.`,
  },
  {
    match: /\b(prices?|rates?|costs?|how\s*much|budget|fees?|quotes?|charges?|pricing)\b/i,
    reply: () => `There's no set rate published; it depends on scope. ${facts.billing} Send the shape of the project via [the contact page](/contact) and ${first} will come back with a number.`,
  },
  {
    match: /\b(github|repos?|repositor(y|ies)|code|source|open\s*source)\b/i,
    reply: () => (github ? `Public work lives on [GitHub](${github.href}).` : `Ask about the code on [the contact page](/contact).`),
  },
  {
    match: /\b(linkedin|social|follow)\b/i,
    reply: () => `Find ${first} on ${profile.socials.map((s) => `[${s.label}](${s.href})`).join(' and ')}.`,
  },
  {
    match: /\b(who\s+are\s+you|what\s+are\s+you|are\s+you\s+(a\s+)?(ai|bot|chatbot|human|real|robot)|what\s+model|powered\s+by|who\s+built\s+you|are\s+you\s+claude|what's\s+lumen)\b/i,
    reply: () => `I'm **Lumen**, a small assistant ${first} built, powered by Claude when the API is live, or a hand-tuned rule set otherwise.`,
  },
  {
    // Deliberately last of the topical rules: "what's/does ... he/Justine" matches almost every
    // third-person question, so above the others it would answer all of them with the bio.
    match: /\bwhat('?s|\s+(does|do|is|are|kind|sort|type))\b[\s\S]*\b(justine|he|him|his|developer|engineer|role|specialty)\b/i,
    reply: bio,
  },
  {
    match: /\b(help|what\s*can\s*you|how\s*do\s*i\s*use)\b/i,
    reply: () => `Ask me about ${first}'s [projects](/projects), [services](/services), [background](/about), or how to [get in touch](/contact). Specific questions work best.`,
  },
]

/** The reply when no rule matches. */
export const FALLBACK = `I don't have that detail. The fastest way to get an answer is [the contact page](/contact). In the meantime, you might want to see [projects](/projects), [services](/services), or [about](/about).`

/** Lumen's offline answer to a question: a named sample first, then the first rule that matches. */
export function localAnswer(question: string): string {
  const trimmed = question.trim()
  if (!trimmed) return FALLBACK
  // "Tell me about <sample>" is what the sample chips send; the bio rule would otherwise take "tell me about".
  if (/^tell\s*me\s*about\b/i.test(trimmed)) {
    const named = findSample(trimmed)
    if (named) return sampleReply(named)
  }
  for (const rule of RULES) {
    if (!rule.match.test(trimmed)) continue
    const reply = rule.reply(trimmed)
    return rule.leadForm ? `${reply}\n\n[[lead-form]]` : reply
  }
  // Nothing matched: a named sample still beats the generic answer.
  const named = findSample(trimmed)
  return named ? sampleReply(named) : FALLBACK
}
