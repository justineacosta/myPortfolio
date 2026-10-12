import { profile } from '@/data/profile'
import { about } from '@/data/about'
import { SERVICES, PROCESS } from '@/data/services'
import { FAQS } from '@/data/faqs'
import { TOOLS, EXPERIMENTAL } from '@/data/stack'
import { CERTS } from '@/data/credentials'
import { assistantFacts as facts } from '@/data/assistantFacts'
import { SAMPLE_PROJECTS, type SampleProject } from './samples'
import type { Page } from './pages'

/**
 * Lumen's offline tier, ported from the old portfolio
 * (the myPortfolioV3 repo, src/lib/assistant-local.ts): hand-tuned keyword rules that
 * answer from this site's data when there is no API key, or when the Claude
 * call fails. RULES is ordered and the first match wins, so a broad rule can
 * shadow a narrower one further down; the comments say where order matters.
 * Server-only: SAMPLE_PROJECTS pulls in every case.
 */

type Rule = {
  /** A pattern, or a test for the rules that need more than one. */
  match: RegExp | ((question: string) => boolean)
  /** Receives the question so a rule can search, and the visitor's page when it is known; most rules ignore both. */
  reply: (question: string, page: Page | null) => string
  /** Clear hiring intent only: the reply ends with the in-chat form. */
  leadForm?: boolean
}

const first = profile.name.split(' ')[0]
/** The job title mid-sentence: only its first letter lowered, so "AI" stays "AI". */
const role = profile.jobTitle[0].toLowerCase() + profile.jobTitle.slice(1)

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'what', 'how', 'why', 'when', 'does', 'did', 'can', 'should', 'would', 'you', 'your', 'this', 'that',
  'with', 'about', 'any', 'have', 'has', 'there', 'here', 'get', 'got', 'tell', 'show', 'sample', 'built', 'build',
  // "Tell me about this one" means the open page, never a sample whose name holds "one".
  'one', 'page',
])

/** Businesses close enough to a sample's trade that its sample is the nearest one to show, never the same business. */
const NEAR_TRADES: [RegExp, string][] = [
  [/clinic|therapy/, 'dental dentist medical chiropractor physio health wellness'],
  [/personal training/, 'gym fitness trainer coach coaching yoga pilates'],
  [/law/, 'legal lawyer lawyers attorney attorneys accountant accounting'],
  [/barbershop/, 'barber salon spa beauty'],
  [/vacation rental/, 'hospitality hotel hostel rentals'],
  [/residential developer/, 'estate realtor property properties'],
  [/moving/, 'removals logistics movers'],
  [/utility contractor/, 'construction builder builders'],
  [/automotive/, 'garage mechanic auto car cars'],
  [/solar/, 'energy renewable renewables'],
]

/** The words a sample is known by: its name, its trade, and the businesses near that trade. */
const sampleWords = (p: SampleProject) =>
  `${p.name} ${p.key.replace(/-/g, ' ')} ${p.trade} ${NEAR_TRADES.filter(([re]) => re.test(p.trade)).map(([, near]) => near).join(' ')}`.toLowerCase()

/** Trade words too general to match a business on alone: a "software company" is not the moving company. */
const WEAK_WORDS = new Set(['company', 'companies', 'business', 'services', 'agency', 'firm', 'manager', 'contractor', 'developer', 'studio', 'shop', 'small'])

/** The sample system a question names, scored on its name and trade; two weak hits are not enough. */
function findSample(question: string): SampleProject | undefined {
  // A full stop ending a sentence is not part of the word: "I own a gym." names a gym.
  const terms = (question.toLowerCase().match(/[a-z0-9&.+#-]{3,}/g) ?? []).map((t) => t.replace(/[.-]+$/, '')).filter((t) => t.length >= 3 && !STOP_WORDS.has(t))
  let best: { p: SampleProject; score: number } | undefined
  for (const p of SAMPLE_PROJECTS) {
    const name = p.name.toLowerCase()
    const words = sampleWords(p)
    let score = 0
    for (const t of terms) {
      if (name.includes(t)) score += 3
      else if (words.includes(t)) score += WEAK_WORDS.has(t) ? 1 : 2
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

/** The samples' trades, each once, for "is there one like my business?". */
const TRADES = [...new Set(SAMPLE_PROJECTS.map((p) => p.trade))]

/** "I run a dental clinic", "my salon", "for a law firm": the visitor names their own business. */
const OWN_BUSINESS = /\b(i|we)\s+(run|own|have|manage|operate|are)\b|\b(my|our)\s+(business|company|clinic|shop|store|firm|practice|agency|restaurant|studio|salon|gym|office|team)\b|\bfor\s+(a|an|my|our)\s+[a-z]+/i
/** …and asks whether he has done something like it. */
const ASKS_SIMILAR = /\b(built|done|made|anything|something|similar|like\s+(that|this|mine|ours|it)|experience\s+(with|in)|examples?|work(ed)?\s+(with|for))\b/i

/** A sample for the visitor's own business: the one it names, the closest by trade, or the trades the samples cover. */
function tradeReply(question: string): string {
  const p = findSample(question)
  if (p && (question.toLowerCase().includes(p.trade) || question.toLowerCase().includes(p.name.toLowerCase()))) return sampleReply(p)
  if (p) {
    const agents = p.builds.slice(0, 2).join(' and ')
    const flows = p.flows.slice(0, 2).join(' and ')
    return `There's no sample for that exact business, but the closest is **${p.name}**, a fictional ${p.trade}: agents like the ${agents}, and flows like ${flows}. Most of it carries over. See [the case study](${p.href}).\n\n[[project:${p.key}]]`
  }
  const trades = TRADES.slice(0, 6).map((t) => `a ${t}`)
  return `There's no sample for that exact business yet. The samples cover ${trades.slice(0, -1).join(', ')} and ${trades.at(-1)}, among others, and the pieces (enquiry and booking flows, follow-ups, a Q&A bot over your own documents) carry over to most trades. See [the projects](/projects), or describe yours on [the contact page](/contact).`
}

/** Words a "did he build X?" question may hold without naming someone else's product. */
const OWN_WORDS = new Set(
  [first, 'He', 'His', 'Him', 'I', 'You', 'Your', 'AI', 'API', 'APIs', 'CRM', 'CMS', 'SEO', 'RAG', 'LLM', 'SaaS', 'Lumen', 'Kraft', ...SAMPLE_PROJECTS.flatMap((p) => p.name.split(/\s+/))].map((w) => w.toLowerCase()),
)
/** "Did you build Airbnb's booking system?": a claim about a named product or company the site never mentions. */
function claimsOther(question: string): boolean {
  if (!/\b(did|has|have)\s+(you|he|justine)\s+(ever\s+)?(build|built|make|made|create|created|work(ed)?\s+(on|for|at)|design(ed)?)\b/i.test(question)) return false
  // A capital that starts a sentence is just grammar ("I run a clinic. Have you…"), so only capitals mid-sentence count.
  const words = question.split(/\s+/)
  const names = words.flatMap((w, i) => (i === 0 || /[.!?]$/.test(words[i - 1]) ? [] : (/^[A-Z][\w&.-]*/.exec(w.replace(/^[^\w]+/, ''))?.[0].replace(/['’]s$/, '') ?? [])))
  return names.some((n) => !OWN_WORDS.has(n.toLowerCase()) && !findTool(n))
}

const availabilityReply = `${facts.availability} ${facts.start} Drop a note via [contact](/contact) with the shape of the work.`

const processReply =`Every project runs through the same five steps:\n${PROCESS.map((s) => `- **${s.name}**: ${s.line}`).join('\n')}\n\nMore on [the services page](/services).`

/** Requests that have nothing to do with Justine's work. */
const OFF_TOPIC = /\b(poems?|haiku|jokes?|songs?|lyrics|recipes?|weather|forecast|horoscope|stock\s*(price|market)s?|bitcoin|homework|essays?|capital\s+of|translate|(tell|write)\s+(me\s+)?a\s+story|meaning\s+of\s+life)\b/i

/** "What would that look like?", "tell me more", "for example?": a follow-up that leans on the last question. */
const FOLLOW_UP = /^examples?\??$|\b(look\s*like|(an?|any|for|some)\s+examples?|show\s+me\s+(that|it|one|how)|more\s*(detail|details|info)|how\s*so|tell\s*me\s*more|go\s*on|elaborate|like\s*what|such\s*as|what\s*about\s*(it|that|this)|how\s*would\s*(that|it|this)\s*work)\b/i

/** Where to see the kind of work the last question was about. */
function exampleReply(previous: string): string | null {
  if (/\b(prompts?|llms?|rag|retrieval|agents?|chatbots?|bots?|\bai\b)\b/i.test(previous)) {
    return `For AI agents, see [the AI agents page](/ai-agents.html): Q&A bots that answer from a business's own documents, and agents that triage an inbox or follow up with buyers, each with how it works.`
  }
  const sample = findSample(previous)
  if (sample) return sampleReply(sample)
  const service = findService(previous)
  if (!service) return null
  if (service.name === 'Automation & Workflows') {
    return `It looks like the flows on [the automations page](/automations.html): a form or an email starts the flow, the steps run on n8n, Make or Zapier with retries and alerts, and a person approves where it matters. [The build plan](/build-plan.html) shows one planned end to end before it's built.`
  }
  if (service.name === 'Full-Stack Web & SaaS') {
    return `Every sample system has a full site: open one from [the projects page](/projects) and spin the sites carousel.`
  }
  return `**${service.name}** work runs through the same five steps: ${PROCESS.map((s) => s.name).join(', ')}. To see it for your setup, describe it on [the contact page](/contact).`
}

const using = TOOLS.map((t) => t.name).filter((n) => !EXPERIMENTAL.includes(n))
const INFRA = ['Docker', 'Vercel', 'Cloudflare', 'GitHub Actions', 'Redis', 'Supabase', 'PostgreSQL'].filter((n) => using.includes(n))
const github = profile.socials.find((s) => s.label === 'GitHub')
/** "Based in Manila, Philippines", to follow a name. */
const based = about.location.title.replace(/^Based/, 'based')
/** Every tool a visitor might ask about by name: the stack, then the ones the services name. */
const TOOL_NAMES = [...new Set([...TOOLS.map((t) => t.name), ...EXPERIMENTAL, ...SERVICES.flatMap((s) => s.logos.map((l) => l.name))])]
/** Other ways a visitor writes a tool's name. A lowercase "make" is the verb, so Make is only found by these or by its capital. */
const TOOL_ALIASES: Record<string, string> = {
  node: 'Node.js', nodejs: 'Node.js', nextjs: 'Next.js', postgres: 'PostgreSQL', tailwindcss: 'Tailwind', 'make.com': 'Make',
  integromat: 'Make', 'gh actions': 'GitHub Actions', huggingface: 'Hugging Face', mongo: 'MongoDB',
}
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** The names a question may use, longest first, so "GitHub Actions" wins over "Git". */
const TOOL_RES = [...TOOL_NAMES.filter((n) => n !== 'Make').map((n) => [n, n] as const), ...Object.entries(TOOL_ALIASES)]
  .sort((a, b) => b[0].length - a[0].length)
  .map(([word, name]) => ({ name, re: new RegExp(`(^|[^a-z0-9.])${escapeRe(word.toLowerCase())}($|[^a-z0-9])`) }))
/** The tool a question names, if any. A capital "Make" past the first word is the tool, as in "does he use Make?". */
const findTool = (question: string) => TOOL_RES.find((t) => t.re.test(question.toLowerCase()))?.name ?? (/\S\s+Make\b/.test(question) ? 'Make' : undefined)
/** "Does he use…", "experience with…", "is he good at…": asking whether he works with something. */
const ASKS_ABOUT_TOOL = /\b(use[sd]?|using|know[sn]?|work(s|ed)?\s*with|familiar|experience[d]?|skilled|comfortable|proficient|good\s*(at|with)|supports?|do(es)?\s*(he|you)\s*do)\b/i

function toolReply(question: string): string {
  const name = findTool(question)!
  if (EXPERIMENTAL.includes(name)) return `**${name}** is one ${first} is still testing, not in everyday use yet. The full stack is on [the about page](/about).`
  if (using.includes(name)) return `Yes, **${name}** is part of ${first}'s everyday stack. The full list is on [the about page](/about).`
  const service = SERVICES.find((s) => s.logos.some((l) => l.name === name))!
  return `**${name}** is one of the tools behind his **${service.name}** work. More on [the services page](/services).`
}

/** The services a visitor names by what they need. AI agents are left to their own rule, which shows the sample builds. */
const SERVICE_WORDS: [RegExp, string][] = [
  [/\b(seo|search\s*engines?|google\s*rank\w*|rankings?|page\s*speed|core\s*web\s*vitals|lighthouse|performance)\b/i, 'SEO & Performance'],
  [/\b(crms?|cms|internal\s*tools?|admin\s*(panel|dashboard)?|dashboards?|back\s*office|portals?)\b/i, 'CRM, CMS & Internal Tools'],
  [/\b(apis?|integrat\w*|webhooks?)\b/i, 'APIs & Integrations'],
  [/\b(automat\w*|workflows?|flows|zaps?)\b/i, 'Automation & Workflows'],
  [/\b(web\s*apps?|saas|websites?|landing\s*pages?|funnels?|full[-\s]?stack|front[-\s]?end|back[-\s]?end)\b/i, 'Full-Stack Web & SaaS'],
]
const findService = (question: string) => {
  const name = SERVICE_WORDS.find(([re]) => re.test(question))?.[1]
  return SERVICES.find((s) => s.name === name)
}

/** "What's on this page?", "tell me about this one", "what am I looking at". */
const THIS_PAGE = /\b(this|current)\s+(page|one|section|view|card|screen)\b|\bwhat\s*am\s*i\s*(looking\s*at|seeing)\b|\bwhat('?s|\s+is)\s+(on\s+)?(this|here)\b|\bwhere\s*am\s*i\b/i

const bio = () => `**${profile.name}** is a ${role}, ${based}. ${facts.summary} More on [the about page](/about).`

const RULES: Rule[] = [
  {
    // First: "tell me about this one" would otherwise reach the bio or the projects rule.
    match: THIS_PAGE,
    reply: (_, page) =>
      page
        ? `You're on **${page.name}**. ${page.about}`
        : `Which page do you mean? The site has [projects](/projects), [services](/services), [about](/about) and [contact](/contact); ask me about any of them.`,
  },
  {
    // Ahead of the greeting, so "hi, tell me a joke" gets this and not just a hello.
    match: OFF_TOPIC,
    reply: () => `That one's outside my lane: I only know ${first} and his work. Try "What has he built?" or "How does a project start?"`,
  },
  {
    // Ahead of everything a product name could trip ("booking", "built"): never confirm work the site doesn't show.
    match: claimsOther,
    reply: () =>
      `Nothing on this site says ${first} built that, so I won't claim it. What's here are sample systems for fictional businesses, on [the projects page](/projects). For his wider history, ask him on [the contact page](/contact).`,
  },
  {
    // Ahead of the projects rule, whose "built" would answer "I run a clinic, built anything like that?" with any three samples.
    match: (q) => OWN_BUSINESS.test(q) && ASKS_SIMILAR.test(q),
    reply: tradeReply,
  },
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
    // Before the team rule, whose "agency" would otherwise take "why him over an agency".
    match: /\b(why\s+(should|would)\s+(i|we)|why\s+(him|justine)|why\s+(work\s+with|hire|choose)|what\s*makes\s*(him|justine)|stand\s*out|different\s*from|over\s*an?\s*agency)\b/i,
    reply: () =>
      `${facts.summary} He designs and builds rather than handing off mockups, works solo with no agency in between, and every handover includes documentation and full access. See [the projects](/projects) for what that looks like.`,
  },
  {
    // Before the stack and AI rules, which would answer "does he use Claude?" with a whole list.
    match: (q) => ASKS_ABOUT_TOOL.test(q) && Boolean(findTool(q)),
    reply: toolReply,
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
    // Before the projects rule, whose "project" would take "how does a project start?".
    match: /\bhow\s+(does|do|would|will|did)\s+(a|the|my|our|your|this)?\s*(projects?|builds?|engagements?)\s+(start|begin|kick\s*off|run|work|go)\b|\bfirst\s+steps?\b/i,
    reply: () => processReply,
  },
  {
    // Before the projects rule, whose "projects" would take "is he taking new projects?".
    match: /\b(taking|booking|accepting)\s+(on\s+)?(new\s+|more\s+)?(work|projects?|clients?)\b/i,
    reply: () => availabilityReply,
    leadForm: true,
  },
  {
    // Before the projects rule, whose "case" would take "any case studies from clients?".
    match: /\b(testimonials?|reviews?|references?|clients?|customers?|track\s*record)\b/i,
    reply: () =>
      `The projects on this site are sample systems for fictional businesses, built to show the whole stack end to end. For references, ask ${first} on [the contact page](/contact).`,
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
    reply: () => processReply,
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
    // Before the contact rule, whose "reach" would take "how fast will he reach back?".
    match: /\b(repl(y|ies)|respond|response\s*time|hear\s*back|get\s*back|reach\s*back)\b/i,
    reply: () => `${facts.reply} Write to him on [the contact page](/contact).`,
  },
  {
    // Before the availability rule, whose "start" would take "how long before it starts?".
    // "how long does it take", never "how long has he been coding".
    match: /\b(how\s*long\s*(does|do|will|would|to|for)\b|timelines?|turnaround|deadlines?|duration|how\s*many\s*(weeks|months|days))\b/i,
    reply: () => `There's no fixed timeline; it depends on the build. ${facts.start} Describe the project on [the contact page](/contact) and he'll scope it.`,
  },
  {
    match: /\b(contact|hire|email|reach|engage|book|work\s*together|get\s*in.*touch)\b/i,
    reply: () => `Easiest way: [the contact page](/contact). ${facts.reply}`,
    leadForm: true,
  },
  {
    // "open to", not a bare "open", so "is his code open source?" doesn't get the form.
    // "booking new work", never a bare "booking", which is usually a system ("a booking flow").
    match: /\b(available|availability|hiring|new\s*work|freelance|capacity|open\s+to|booking\s+(new\s+)?(work|projects?|clients?)|start)\b/i,
    reply: () => availabilityReply,
    leadForm: true,
  },
  {
    // Before the service lookup, so "how much is a website?" gets how billing works, not the web service.
    match: /\b(prices?|rates?|costs?|how\s*much|budget|fees?|quotes?|charges?|pricing)\b/i,
    reply: () => `There's no set rate published; it depends on scope. ${facts.billing} Send the shape of the project via [the contact page](/contact) and ${first} will come back with a number.`,
  },
  {
    // After the price rule, so "a guaranteed price?" is a price question.
    match: /\b(guarantee[sd]?|promise[sd]?|warrant(y|ies))\b|\b(sales|revenue|leads|traffic|bookings|conversions?|profits?)\s+(will\s+)?(double|triple|grow|increase|go\s+up)\b/i,
    reply: () =>
      `He won't promise business results like that; nobody honest can. What he does commit to is the build: a written proposal with scope and price, and a handover with documentation and full access. Talk through your goals on [the contact page](/contact).`,
  },
  {
    // After hiring intent, so "can I hire him for SEO?" still gets the form; before the services rule, which lists all six.
    match: (q) => Boolean(findService(q)),
    reply: (q) => {
      const s = findService(q)!
      return `Yes: **${s.name}**. ${s.line} ${s.bullets.join('. ')}. More on [the services page](/services).`
    },
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

/**
 * Lumen's offline answer to a question: a follow-up first, then a named
 * sample, then the first rule that matches. `page` is the one the visitor has
 * open, and `previous` the question before this one, when known.
 */
export function localAnswer(question: string, page: Page | null = null, previous: string | null = null): string {
  const trimmed = question.trim()
  if (!trimmed) return FALLBACK
  // "What would that look like?" means the last question's topic; with no topic to lean on, the rules answer it as asked.
  if (previous && FOLLOW_UP.test(trimmed) && trimmed.split(/\s+/).length <= 8) {
    const example = exampleReply(previous)
    if (example) return example
  }
  // "Tell me about <sample>" is what the sample chips send; the bio rule would otherwise take "tell me about".
  if (/^tell\s*me\s*about\b/i.test(trimmed)) {
    const named = findSample(trimmed)
    if (named) return sampleReply(named)
  }
  for (const rule of RULES) {
    if (!(typeof rule.match === 'function' ? rule.match(trimmed) : rule.match.test(trimmed))) continue
    const reply = rule.reply(trimmed, page)
    return rule.leadForm ? `${reply}\n\n[[lead-form]]` : reply
  }
  // Nothing matched: a named sample still beats the generic answer.
  const named = findSample(trimmed)
  return named ? sampleReply(named) : FALLBACK
}
