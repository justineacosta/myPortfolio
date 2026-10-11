import { SERVICES, servicesPage, PROCESS } from '@/data/services'
import { FAQS } from '@/data/faqs'
import { home } from '@/data/home'
import { projects, BUILDS } from '@/data/projects'
import { about, ROLES } from '@/data/about'
import { TOOLS, EXPERIMENTAL } from '@/data/stack'
import { CERTS } from '@/data/credentials'
import { profile } from '@/data/profile'
import { CASES } from '@/data/cases'
import { casePath } from '@/data/cases/pages'

/** Keys whose values are markup, assets, addresses or identifiers rather than words a visitor reads. */
const SKIP = ['icon', 'logos', 'slug', 'shot', 'src', 'thumb', 'tall', 'frameTitle', 'view', 'id', 'key', 'href', 'page', 'email', 'platform', 'cue', 'cta']

function walk(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    const s = value.trim()
    if (s) out.push(s)
  } else if (typeof value === 'number') {
    out.push(String(value))
  } else if (Array.isArray(value)) {
    for (const item of value) walk(item, out)
  } else if (value && typeof value === 'object') {
    if ('$$typeof' in value) return
    for (const [k, v] of Object.entries(value)) if (!SKIP.includes(k)) walk(v, out)
  }
}

/** The leaf strings of any data value, in source order: no icons, logos, links or ids, and no string repeated back to back. */
export function textOf(value: unknown): string[] {
  const out: string[] = []
  walk(value, out)
  return out.filter((s, i) => s !== out[i - 1])
}

const section = (title: string, path: string, lines: string[]) => ({ path, text: `## ${title} (${path})\n${lines.join('\n')}` })

/** A section per page, then a digest of each case. */
function sections() {
  return [
    section('About Justine', '/about', textOf([profile, about, ROLES])),
    section('Services', '/services', textOf([servicesPage, SERVICES])),
    section('How a project runs', '/services', textOf(PROCESS)),
    section('Projects', '/projects', textOf([projects, BUILDS])),
    section('Stack and courses', '/about', [...TOOLS.map((t) => t.name), ...textOf(EXPERIMENTAL), ...textOf(CERTS)]),
    section('FAQs', '/contact', FAQS.flatMap((f) => [`Q: ${f.q}`, `A: ${f.a}`])),
    ...Object.entries(CASES).map(([key, set]) => {
      const first = set.agents?.builds[0]
      const lines = [
        ...(set.agents?.builds.map((b) => `${b.name}: ${b.line}`) ?? []),
        ...(set.automation?.flows.map((f) => `${f.title}: ${f.outcome}`) ?? []),
      ]
      return section(`Case: ${first?.business.name ?? key}, ${first?.business.trade ?? key}`, casePath(key, 'ai-agents.html'), lines)
    }),
  ]
}

/** The site's own copy, as one block of text. */
export function buildKnowledge(): string {
  return sections().map((s) => s.text).join('\n\n')
}

/** The block the chat's system prompt carries, built once. */
export const KNOWLEDGE = buildKnowledge()

/** Every path a section is headed with: the only links a reply may carry. */
export const KNOWN_PATHS: ReadonlySet<string> = new Set(sections().map((s) => s.path))
