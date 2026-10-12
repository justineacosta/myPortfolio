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

/** What the offline rules know beyond the question: the page the visitor has open, and the business they said they run. */
type Context = { page: Page | null; business: string | null }

type Rule = {
  /** A pattern, or a test for the rules that need more than one. */
  match: RegExp | ((question: string) => boolean)
  /** Receives the question so a rule can search, and what is known of the conversation; most rules ignore both. */
  reply: (question: string, context: Context) => string
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
  return `**${p.name}** is one of ${first}'s sample systems, built for a fictional ${p.trade}: a full [site](${p.site}), plus the agents and automations behind it.${agents}${flows} [The case study](${p.href}) walks through all of it.\n\n[[project:${p.key}]]`
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
    return `Good question! There isn't a sample for that exact kind of business yet, but the closest is **${p.name}**, a fictional ${p.trade}. It has agents like the ${agents}, and flows like ${flows}, and most of that would carry over to yours. Have a look at [the case study](${p.href}).\n\n[[project:${p.key}]]`
  }
  const trades = TRADES.slice(0, 6).map((t) => `a ${t}`)
  return `Good question! There isn't a sample for that exact kind of business yet. The samples cover ${trades.slice(0, -1).join(', ')} and ${trades.at(-1)}, among others, and the building blocks (enquiry and booking flows, follow-ups, a Q&A bot over your own documents) carry over to most businesses. Browse [the projects](/projects), or tell ${first} about yours on [the contact page](/contact) and he'll say what would fit.`
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

/** "Taking on new work…" as an answer: "Yes, he's taking on new work…". */
const available = /^Taking\b/.test(facts.availability) ? `Yes, he's ${facts.availability.replace(/^Taking/, 'taking')}` : `Yes! ${facts.availability}`
const availabilityReply = `${available} ${facts.start} Tell him a little about what you're building:`

const processReply = `Happy to walk you through it. Every project goes through the same five steps:\n${PROCESS.map((s) => `- **${s.name}**: ${s.line}`).join('\n')}\n\nIt all starts with a message on [the contact page](/contact). ${facts.reply}`

/** Requests that have nothing to do with Justine's work. */
const OFF_TOPIC = /\b(poems?|haiku|jokes?|songs?|lyrics|recipes?|weather|forecast|horoscope|stock\s*(price|market)s?|bitcoin|homework|essays?|capital\s+of|translate|(tell|write)\s+(me\s+)?a\s+story|meaning\s+of\s+life)\b/i

/** "What would that look like?", "tell me more", "for example?": a follow-up that leans on the last question. */
const FOLLOW_UP = /^examples?\??$|\b(look\s*like|(an?|any|for|some)\s+examples?|show\s+me\s+(that|it|one|how)|more\s*(detail|details|info)|how\s*so|tell\s*me\s*more|go\s*on|elaborate|like\s*what|such\s*as|what\s*about\s*(it|that|this)|how\s*would\s*(that|it|this)\s*work)\b/i

/** Where to see the kind of work the last question was about. */
function exampleReply(previous: string): string | null {
  if (/\b(prompts?|llms?|rag|retrieval|agents?|chatbots?|bots?|\bai\b)\b/i.test(previous)) {
    return `Sure! [The AI agents page](/ai-agents.html) shows them at work: Q&A bots that answer from a business's own documents, and agents that triage an inbox or follow up with buyers, each with a look at how it works.`
  }
  const sample = findSample(previous)
  if (sample) return sampleReply(sample)
  const service = findService(previous)
  if (!service) return null
  if (service.name === 'Automation & Workflows') {
    return `Sure! The flows on [the automations page](/automations.html) show it well: a form or an email kicks things off, the steps run on n8n, Make or Zapier with retries and alerts, and a person approves where it matters. To see one planned out before it's built, there's [the build plan](/build-plan.html).`
  }
  if (service.name === 'Full-Stack Web & SaaS') {
    return `Sure! Every sample system comes with a full site. Open one from [the projects page](/projects) and give the sites carousel a spin.`
  }
  return `Sure! **${service.name}** work follows the same five steps as everything else: ${PROCESS.map((s) => s.name).join(', ')}. The best way to see it for your setup is to describe it on [the contact page](/contact).`
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
  if (EXPERIMENTAL.includes(name)) return `**${name}** is one ${first} is still testing, so it isn't part of his everyday work yet. You'll find his full stack on [the about page](/about).`
  if (using.includes(name)) return `Yes, **${name}** is part of ${first}'s everyday stack. You'll find the full list on [the about page](/about).`
  const service = SERVICES.find((s) => s.logos.some((l) => l.name === name))!
  return `Yes, **${name}** is one of the tools behind his **${service.name}** work. There's more on [the services page](/services).`
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

const bio = () => `**${profile.name}** is a ${role}, ${based}. ${facts.summary} There's more about him on [the about page](/about).`

const RULES: Rule[] = [
  {
    // First: "tell me about this one" would otherwise reach the bio or the projects rule.
    match: THIS_PAGE,
    reply: (_, { page }) =>
      page
        ? `You're on **${page.name}**. ${page.about}`
        : `Happy to help. Which page do you mean? The site has [projects](/projects), [services](/services), [about](/about) and [contact](/contact), and you can ask me about any of them.\n\n[[options:${CLARIFY_OPTIONS.join('|')}]]`,
  },
  {
    // Ahead of the greeting, so "hi, tell me a joke" gets this and not just a hello.
    match: OFF_TOPIC,
    reply: () => `Ha, I'd love to help, but that one's outside what I know. I'm all about ${first} and his work. You could ask "What has he built?" or "How does a project start?"`,
  },
  {
    // Ahead of everything a product name could trip ("booking", "built"): never confirm work the site doesn't show.
    match: claimsOther,
    reply: () =>
      `Nothing on this site mentions that one, so I'd rather not claim it. What you'll find here are sample systems for fictional businesses, on [the projects page](/projects). For anything beyond those, just ask him on [the contact page](/contact).`,
  },
  {
    // Ahead of the projects rule, whose "built" would answer "I run a clinic, built anything like that?" with any three samples.
    match: (q) => OWN_BUSINESS.test(q) && ASKS_SIMILAR.test(q),
    reply: tradeReply,
  },
  {
    match: /^(hi|hey|hello|sup|yo|howdy|gm|good\s*(morning|afternoon|evening))\b/i,
    reply: () => `Hi there! Happy to help. You can ask me about ${first}'s [projects](/projects), [services](/services), or how to [get in touch](/contact).`,
  },
  {
    match: /\b(thanks|thank\s*you|thx|ty)\b/i,
    reply: () => `You're welcome! Anything else you'd like to know about ${first}?`,
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
    reply: () => `He speaks ${facts.personal.languages.join(' and ')}.`,
  },
  {
    // Before the stack rule: "Strongest part of the stack?" is a chip.
    match: /\b(strongest|best.*at|specialty|specialise|specialize|expertise|core)\b/i,
    reply: () => `Great question. ${FAQS[0].a} You can see each one on [the services page](/services).`,
  },
  {
    // Stems are pluralised on purpose: a bare `tool` inside \b(...)\b never matches "tools".
    match: /\b(stacks?|tech|tools?|languages?|frameworks?|primary)\b/i,
    reply: () => `Here's what ${first} works with day to day: ${using.join(', ')}.\n\nAnd a few he's still testing: ${EXPERIMENTAL.join(', ')}. The full stack is on [the about page](/about).`,
  },
  {
    match: /\b(infra|infrastructure|devops|deploy(s|ed|ment)?|hosting|cloud|aws|vercel|cloudflare|docker|ci\/?cd|pipelines?)\b/i,
    reply: () => `Yes, he's comfortable there: ${INFRA.join(', ')}, plus ${CERTS[0]?.name ?? 'cloud courses'}. More on [the about page](/about).`,
  },
  {
    // Before the projects rule: "Any AI agent builds?" is a chip.
    match: /\b(prompts?|llms?|anthropic|claude|rag|retrieval|evals?|agents?|chatbots?|\bai\b)\b/i,
    reply: () => {
      const ai = SERVICES.find((s) => /ai/i.test(s.name))
      const builds = SAMPLE_PROJECTS.flatMap((p) => p.builds.slice(0, 1).map((b) => `- **${b}** for ${p.name}, a fictional ${p.trade}`)).slice(0, 3)
      return `Yes, that's one of his main areas!${ai ? ` **${ai.name}**: ${ai.line} ${ai.bullets.join('. ')}.` : ''} A few sample builds:\n${builds.join('\n')}\n\nYou can see all of them on [the AI agents page](/ai-agents.html).`
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
      `Fair question! The projects on this site are sample systems for fictional businesses, built to show the whole stack end to end. For references, you can ask ${first} directly on [the contact page](/contact).`,
  },
  {
    match: /\b(projects?|case|portfolio|samples?|examples?|recent\s*work|built|shipped|made)\b/i,
    reply: () => {
      const list = SAMPLE_PROJECTS.slice(0, 3).map((p) => `- [**${p.name}**](${p.href}): a fictional ${p.trade}`)
      return `${first} builds full sample systems (a site, AI agents and automations) for fictional businesses. Here are a few:\n${list.join('\n')}\n\nYou'll find the whole set on [the projects page](/projects).`
    },
  },
  {
    match: /\b(experience|career|history|previous|past\s*job|milestones?|graduat\w*|degrees?|university|college|school|stud(y|ied|ies)|educat\w*|majors?|courses?|certificat\w*)\b/i,
    reply: () => `Here's his background. **Education:** ${facts.personal.education}. **Courses:** ${CERTS.map((c) => c.name).join(', ')}. ${facts.personal.origin} More on [the about page](/about).`,
  },
  {
    // Before the process rule: "How does he communicate?" is a chip.
    match: /\b(communicat(e|es|ion|ing)|check[-\s]?ins?|status\s*updates?|stay\s*in\s*touch)\b/i,
    reply: () => `${facts.communication} Whenever you're ready, [the contact page](/contact) is the place to start.`,
  },
  {
    match: /\b(process|how\s*(do|does)\s*(you|he)\s*work|workflow|what.*expect|steps?|onboard|kickoff)\b/i,
    reply: () => processReply,
  },
  {
    match: /\b(own(s|ership)?\s*the\s*code|who\s*owns|license|licensing|ip\b|intellectual\s*property)\b/i,
    reply: () => `Good thing to sort out early. ${facts.ownership} You can ask about the specifics on [the contact page](/contact).`,
  },
  {
    match: /\b(teams?|collaborat\w*|agency|solo|alone|in-house)\b/i,
    reply: () => `${facts.faq[0].answer} Tell him a bit about your setup on [the contact page](/contact).`,
  },
  {
    match: /\b(maintain\w*|maintenance|support|after\s*launch|ongoing)\b/i,
    reply: () => `${FAQS[4].a} Just mention it on [the contact page](/contact).`,
  },
  {
    match: /\b(designs?|ui|ux|figma|mockups?|brand)\b/i,
    reply: () => `${facts.faq[1].answer} [The services page](/services) shows what that looks like.`,
  },
  {
    match: /\b(hobby|hobbies|outside\s*work|free\s*time|fun|interests?|sports?|esports?|games?)\b/i,
    reply: () => `Outside work, he's into ${facts.personal.interests[0].toLowerCase()}${facts.personal.interests.slice(1)} ${facts.personal.origin}`,
  },
  {
    // Before the contact rule, whose "reach" would take "how fast will he reach back?".
    match: /\b(repl(y|ies)|respond|response\s*time|hear\s*back|get\s*back|reach\s*back)\b/i,
    reply: () => `Pretty quickly! ${facts.reply} You can reach him on [the contact page](/contact).`,
  },
  {
    // Before the availability rule, whose "start" would take "how long before it starts?".
    // "how long does it take", never "how long has he been coding".
    match: /\b(how\s*long\s*(does|do|will|would|to|for)\b|timelines?|turnaround|deadlines?|duration|how\s*many\s*(weeks|months|days))\b/i,
    reply: (_, { business }) => `It depends on ${business ? `what your ${business} needs` : 'the build'}, so there's no fixed timeline. ${facts.start} If you describe the project on [the contact page](/contact), he'll scope it for you.`,
  },
  {
    match: /\b(contact|hire|email|reach|engage|book|work\s*together|get\s*in.*touch)\b/i,
    reply: () => `The easiest way is [the contact page](/contact). ${facts.reply} Or send him a note right here:`,
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
    reply: (_, { business }) => `There's no set rate published, since it depends on ${business ? `what your ${business} needs` : 'scope'}. ${facts.billing} If you share the shape of the project on [the contact page](/contact), ${first} will come back with a number.`,
  },
  {
    // After the price rule, so "a guaranteed price?" is a price question.
    match: /\b(guarantee[sd]?|promise[sd]?|warrant(y|ies))\b|\b(sales|revenue|leads|traffic|bookings|conversions?|profits?)\s+(will\s+)?(double|triple|grow|increase|go\s+up)\b/i,
    reply: () =>
      `Totally fair thing to want! Honestly, no one can promise results like that, and ${first} won't pretend to. What he can promise is a clear written proposal with scope and price, and a handover with full documentation and access. If you share your goals on [the contact page](/contact), he'll tell you what's realistic.`,
  },
  {
    // After hiring intent, so "can I hire him for SEO?" still gets the form; before the services rule, which lists all six.
    match: (q) => Boolean(findService(q)),
    reply: (q) => {
      const s = findService(q)!
      return `He can help with that! **${s.name}**: ${s.line} ${s.bullets.join('. ')}. More on [the services page](/services).`
    },
  },
  {
    // "build" lands "What does he build?" (a chip) here; the projects rule owns "built".
    match: /\b(services?|offers?|build(s|ing)?|automat\w*|kind.*work|what.*do.*you.*do)\b/i,
    reply: () => `${first} works across six areas:\n${SERVICES.map((s) => `- **${s.name}**: ${s.line}`).join('\n')}\n\nYou'll find more on [the services page](/services).`,
  },
  {
    match: /\b(location|where|based|timezone|remote|onsite|country|city)\b/i,
    reply: () => `${first} is ${based}, and he works remotely with teams all over, overlapping US, EU and CA hours.`,
  },
  {
    match: /\b(github|repos?|repositor(y|ies)|code|source|open\s*source)\b/i,
    reply: () => (github ? `You'll find his public work on [GitHub](${github.href}).` : `You can ask about the code on [the contact page](/contact).`),
  },
  {
    match: /\b(linkedin|social|follow)\b/i,
    reply: () => `You can find ${first} on ${profile.socials.map((s) => `[${s.label}](${s.href})`).join(' and ')}.`,
  },
  {
    match: /\b(who\s+are\s+you|what\s+are\s+you|are\s+you\s+(a\s+)?(ai|bot|chatbot|human|real|robot)|what\s+model|powered\s+by|who\s+built\s+you|are\s+you\s+claude|what's\s+lumen)\b/i,
    reply: () => `I'm **Lumen**, a small assistant ${first} built to answer questions about his work. I run on Claude when it's live, and on a set of hand-written answers otherwise.`,
  },
  {
    // Deliberately last of the topical rules: "what's/does ... he/Justine" matches almost every
    // third-person question, so above the others it would answer all of them with the bio.
    match: /\bwhat('?s|\s+(does|do|is|are|kind|sort|type))\b[\s\S]*\b(justine|he|him|his|developer|engineer|role|specialty)\b/i,
    reply: bio,
  },
  {
    match: /\b(help|what\s*can\s*you|how\s*do\s*i\s*use)\b/i,
    reply: () => `Happy to help! Ask me about ${first}'s [projects](/projects), [services](/services), [background](/about), or how to [get in touch](/contact). Specific questions work best.`,
  },
]

/** The reply when no rule matches. */
/** The chips a clarifying question offers: questions the rules answer well, one per kind of visitor. */
const CLARIFY_OPTIONS = ['Show me the projects', 'What does he build?', 'How does he work?']

/** The reply to a question too unclear to answer: a short question back, with answers to tap. */
export const CLARIFY = `Hmm, I'm not quite sure what you mean. Were you asking about ${first}'s projects, what he can build, or how he works? If it's something else, he can answer it himself on [the contact page](/contact).\n\n[[options:${CLARIFY_OPTIONS.join('|')}]]`

/** "Can he do that?": a short question that leans on a topic said before. ("And the other one?" names no topic, so it gets a question back.) */
const VAGUE = /\b(that|it|this|those|these|them)\b/i
/** A question about Justine himself, which the rules would answer if they could: a missing fact, not an unclear question. */
const ABOUT_HIM = /\b(he|his|him|justine|you|your)\b/i

/** "I run a dental clinic", "we own a small gym.": the business the visitor named, in their words. */
const BUSINESS_RE = /\b(?:i|we)\s+(?:run|own|have|manage|operate)\s+(?:a|an)\s+([a-z][a-z&' -]{2,40}?)(?=\s*[.,!?;]|\s+(?:and|but|with|that|who|which|in|for|where)\b|\s*$)/i
const businessIn = (earlier: string[]) => earlier.map((q) => BUSINESS_RE.exec(q)?.[1].trim().toLowerCase()).findLast(Boolean) ?? null

export const FALLBACK = `Hmm, I don't have that detail, sorry. ${first} can answer it himself on [the contact page](/contact). In the meantime, you might like [projects](/projects), [services](/services), or [about](/about).`

/** The latest earlier question with a topic to show an example of, if any. */
const topicExample = (earlier: string[]) => earlier.map(exampleReply).findLast(Boolean) ?? null

/**
 * Lumen's offline answer to a question: a follow-up first, then a named
 * sample, then the first rule that matches, and when nothing does, a question
 * back. `page` is the one the visitor has open, and `earlier` the visitor's
 * questions before this one, oldest first, so a follow-up finds its topic and
 * a business named earlier shapes the answer.
 */
export function localAnswer(question: string, page: Page | null = null, earlier: string[] = []): string {
  const trimmed = question.trim()
  if (!trimmed) return FALLBACK
  const short = trimmed.split(/\s+/).length <= 8
  // "What would that look like?" means the latest topic; with no topic to lean on, the rules answer it as asked.
  if (short && FOLLOW_UP.test(trimmed)) {
    const example = topicExample(earlier)
    if (example) return example
  }
  // "Tell me about <sample>" is what the sample chips send; the bio rule would otherwise take "tell me about".
  if (/^tell\s*me\s*about\b/i.test(trimmed)) {
    const named = findSample(trimmed)
    if (named) return sampleReply(named)
  }
  for (const rule of RULES) {
    if (!(typeof rule.match === 'function' ? rule.match(trimmed) : rule.match.test(trimmed))) continue
    const reply = rule.reply(trimmed, { page, business: businessIn(earlier) })
    return rule.leadForm ? `${reply}\n\n[[lead-form]]` : reply
  }
  // Nothing matched: a named sample still beats the generic answer.
  const named = findSample(trimmed)
  if (named) return sampleReply(named)
  // "Can he do that?" after a topic is about that topic; with none, it needs a question back.
  if (short && VAGUE.test(trimmed)) return topicExample(earlier) ?? CLARIFY
  // A clear question about him that no rule covers is a missing fact; anything else, ask what they meant.
  return ABOUT_HIM.test(trimmed) ? FALLBACK : CLARIFY
}
