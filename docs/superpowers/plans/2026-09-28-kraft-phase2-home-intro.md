# Kraft Portfolio — Phase 2: Home and Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Home placeholder with Kraft's real Home page (hero, stats, tools row, six cards) and add the workflow intro that writes "Software that keeps / its promises." and flies it onto the Home `<h1>`.

**Architecture:** Home is Server Components that render copy from `data/*.ts`. A few small Client Components handle interaction: the phone profile header, the services wheel row, and the intro overlay. The intro is kape's engine (`IntroOverlay.tsx`) with Kraft's loader steps and tokens. The pre-paint boot script decides whether it plays and holds the page with `<html data-intro>`. A pure `lib/intro.ts` holds the geometry and the hold/release helpers. `components/shell/IntroOverlay.tsx` drives the DOM with the Web Animations API and one rAF loop. Brand logos are self-hosted SVGs generated from `simple-icons`.

**Tech Stack:** Next.js 16.3 App Router, React 19.3, TypeScript 5.9, Tailwind 4.3 (Kraft tokens only), Phosphor (`@phosphor-icons/react/ssr`), `simple-icons` 16.33 (dev, build-time only), Vitest 5 + Testing Library, Playwright 1.63.

**Spec:** `docs/superpowers/specs/2026-09-28-kraft-portfolio-design.md` (§7 phone Home header, §8 Home, intro and background, §10 content, §11 motion)

## Global Constraints

- **Colours:** use only Kraft tokens. Raw hex/rgb values are allowed only in `app/globals.css`, and `tests/no-raw-colors.test.ts` enforces this over `app components data hooks lib`. Brand colours live only inside the generated SVGs in `public/icons/brands/`.
- **Copy:** Kraft copy is verbatim (`KraftScreens.dc.html`, `Kraft Portfolio.dc.html`). Every gap is a string that starts with `PLACEHOLDER - ` (`lib/placeholder.ts`, `isPlaceholder`).
- **Components render data:** page copy lives in `data/*.ts`, never in components.
- **Icons:** import Phosphor from `@phosphor-icons/react/ssr` using the `…Icon` names (e.g. `LightningIcon`).
- **Server Components by default.** Use `'use client'` only for the interactive parts.
- **Motion:** every animation has a reduced-motion path, via the OS setting or `html[data-a11y-motion=true]`. The intro is skipped at boot in both cases.
- **The intro never plays on:** client-side navigation back to Home, any route other than `/`, reduced motion, or a11y "motion off" (spec §8).
- `reference/Kraft_Portfolio_Design_System/HANDOFF.md` is **not** followed.
- **Verify with:** `npm test`, `npm run typecheck`, `npm run lint`, `npm run e2e`.
- **Commits** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Navigating away mid-intro** (sidebar, ⌘K, a card, browser Back). The page must never stay hidden: the intro skips as soon as the pathname leaves `/`. Test: Task 6, `navigating away during the intro hands the page back`.
2. **JavaScript slow or broken after the boot script has hidden the page.** The boot failsafe hands the page back after 9s unless the overlay has claimed the run (`data-intro-live`). Tests: Task 6, boot tests `hands the page back after 9s…` and `leaves a claimed intro alone`.
3. **Phone reload with restored scroll, and the phone layout in general.** The headline must land exactly on the `<h1>`: the run resets scroll first, and the landing is measured at handoff. Test: Task 6, `phone: the intro lands exactly on the Home h1`.
4. **Wheel over the services row at its ends.** The row must not trap the page: at either end the wheel goes to the panel/Lenis. Tests: Task 4, the `wheelToX` null cases and the e2e `…then hands back to the page`.
5. **Keyboard during the intro.** Skip is reachable and Escape skips. When the overlay vanishes, focus moves to `#main-content` instead of `<body>`. Test: Task 6, `Skip ends it at once and moves focus to the page`.

---

## File Map

| File | Responsibility |
|---|---|
| `scripts/brand-icons.mjs` | Generates `public/icons/brands/<slug>.svg` from `simple-icons` with Kraft's brand colours |
| `public/icons/brands/*.svg` (37) | Self-hosted brand logos (generated and committed) |
| `public/assets/about-workstation.gif`, `public/assets/aws-mark.svg` | Kraft assets used on Home |
| `data/home.ts` | Home copy: headline, lede, actions, stats, tools row, card copy, intro steps and status text |
| `data/stack.ts` | `TOOLS`, `EXPERIMENTAL`, `stackRows()`, `brandIcon()` |
| `data/services.ts` | Kraft's six services (used by Home now, and by Services in Phase 3) |
| `data/testimonials.ts` | Three PLACEHOLDER clients |
| `data/credentials.ts` | Two certifications |
| `data/profile.ts` | + `phoneHandle` |
| `components/home/Hero.tsx` | Eyebrow, `<h1 data-intro-target>`, lede, actions, `<Stats/>` |
| `components/home/Stats.tsx` | Three proof facts |
| `components/home/HomeProfile.tsx` | Phone-only identity header (client) |
| `components/home/HomeCard.tsx` | Kraft card shell: icon tile, `<h2>`, meta, optional link |
| `components/home/ToolsRow.tsx` | "Daily drivers" tile and tools marquee |
| `components/home/ProjectsCard.tsx`, `AboutCard.tsx`, `StackCard.tsx` | Row 2 |
| `components/home/ServicesCard.tsx`, `TestimonialsCard.tsx`, `CredentialsCard.tsx` | Row 3 |
| `components/home/WheelRow.tsx` | Client wrapper that turns a vertical wheel into sideways scroll |
| `components/home/Bento.tsx` | The framed card grid |
| `lib/wheel.ts`, `hooks/useWheelToX.ts` | Wheel maths and native listener |
| `lib/intro.ts` | Intro timing, geometry, font wait, hold/release/assemble |
| `components/shell/IntroOverlay.tsx` | Intro orchestrator (client) |
| `lib/boot.ts` | + intro decision and failsafe |
| `app/globals.css` | + Home CSS (bento, marquee, arc, medals, logo tokens), + intro CSS |
| `app/(site)/page.tsx` | Home |
| `app/(site)/layout.tsx` | + `<IntroOverlay/>`, phone padding when the Home header is present |
| `components/shell/Sidebar.tsx`, `TopBar.tsx`, `TabBar.tsx` | + intro hold markers |
| `components/shell/PhoneControls.tsx` | Hidden on `/` (the Home header carries theme and ⌘K) |
| `e2e/helpers.ts` | `settleIntro`, `headlineLanding` |

---

### Task 1: Brand logos, Home assets and Home data

**Files:**
- Create: `scripts/brand-icons.mjs`, `public/icons/brands/*.svg` (generated), `public/assets/about-workstation.gif`, `public/assets/aws-mark.svg`
- Create: `data/home.ts`, `data/stack.ts`, `data/services.ts`, `data/testimonials.ts`, `data/credentials.ts`
- Modify: `data/profile.ts`, `package.json` (devDependency)
- Test: `tests/home-data.test.ts`

**Interfaces:**
- Consumes: `isPlaceholder(value: string): boolean` from `lib/placeholder.ts`
- Produces:
  - `home` (see code), with `home.headline: readonly ['Software that keeps', 'its promises.']`, `home.stats: Stat[]` and `home.intro.steps: IntroStep[]`
  - `type Stat = { value: string; short?: string; unit: string; label: string }`
  - `type IntroStep = { label: string; icon: Icon }`
  - `type Brand = { name: string; slug: string }`
  - `TOOLS: Brand[]`, `EXPERIMENTAL: string[]`, `stackRows(): [Brand[], Brand[]]`, `brandIcon(slug: string): string` (returns `/icons/brands/<slug>.svg`)
  - `type Service = { n; name; icon: Icon; line; badge; bullets: string[]; tags: string[]; logos: Brand[] }`, `SERVICES: Service[]`
  - `type Client = { n; name; role; tag; quote; tags: string[] }`, `CLIENTS: Client[]`
  - `type Cert = { name; label; pill; icon: string }`, `CERTS: Cert[]`
  - `profile.phoneHandle: '@KRAFT'`

- [ ] **Step 1: Write the failing test**

Create `tests/home-data.test.ts`:

```ts
import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CERTS } from '@/data/credentials'
import { home } from '@/data/home'
import { profile } from '@/data/profile'
import { SERVICES } from '@/data/services'
import { brandIcon, EXPERIMENTAL, stackRows, TOOLS } from '@/data/stack'
import { CLIENTS } from '@/data/testimonials'
import { isPlaceholder } from '@/lib/placeholder'

const inPublic = (url: string) => existsSync(`public${url}`)

describe('Home data', () => {
  it("keeps Kraft's headline and lede verbatim", () => {
    expect(home.headline).toEqual(['Software that keeps', 'its promises.'])
    expect(home.lede).toBe(
      'Full-stack development, AI automation and workflow systems — built to keep running long after launch day.',
    )
  })

  it('has a self-hosted file for every logo and image it names', () => {
    const urls = [
      ...TOOLS.map((t) => brandIcon(t.slug)),
      ...SERVICES.flatMap((s) => s.logos.map((l) => brandIcon(l.slug))),
      ...CERTS.map((c) => c.icon),
      home.cards.about.image.src,
    ]
    expect(urls.filter((u) => !inPublic(u))).toEqual([])
  })

  it('lists six services numbered 01-06', () => {
    expect(SERVICES.map((s) => s.n)).toEqual(['01', '02', '03', '04', '05', '06'])
    expect(SERVICES[0].name).toBe('Full-Stack Web & SaaS')
    expect(SERVICES.every((s) => s.logos.length === 3)).toBe(true)
  })

  it('only marks listed tools as experimental', () => {
    const names = TOOLS.map((t) => t.name)
    expect(new Set(names).size).toBe(names.length)
    expect(EXPERIMENTAL.filter((n) => !names.includes(n))).toEqual([])
  })

  it('splits the stack into two alternating rows that cover every tool', () => {
    const [a, b] = stackRows()
    expect(a[0].name).toBe('React')
    expect(b[0].name).toBe('TypeScript')
    expect(a.length + b.length).toBe(TOOLS.length)
  })

  it('gives every placeholder stat a short stand-in', () => {
    expect(home.stats).toHaveLength(3)
    expect(home.stats.filter((s) => isPlaceholder(s.value)).every((s) => !!s.short)).toBe(true)
    expect(home.stats[2].value).toBe('GMT+8')
  })

  it("uses Kraft's four loader steps for the intro", () => {
    expect(home.intro.steps.map((s) => s.label)).toEqual(['Brief comes in', 'Architect', 'Build & test', 'Shipped'])
  })

  it('keeps testimonial gaps as PLACEHOLDERs, never invented quotes', () => {
    expect(CLIENTS).toHaveLength(3)
    expect(CLIENTS.every((c) => isPlaceholder(c.name) && isPlaceholder(c.quote))).toBe(true)
  })

  it('has the phone handle Kraft shows in its phone header', () => {
    expect(profile.phoneHandle).toBe('@KRAFT')
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npx vitest run tests/home-data.test.ts`
Expected: FAIL. The imports can't be resolved yet (`Failed to resolve import "@/data/credentials"`).

- [ ] **Step 3: Add `simple-icons` and the generator**

Run: `npm install --save-dev --save-exact simple-icons@16.33.0`

Create `scripts/brand-icons.mjs`:

```js
// Writes public/icons/brands/<slug>.svg from the simple-icons package, filled
// with the brand colour Kraft used (KraftScreens.dc.html:559-596, where the
// logos came from cdn.simpleicons.org). Self-hosted, so the site makes no
// third-party requests. Re-run after adding a brand: node scripts/brand-icons.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const BRANDS = {
  react: '61DAFB', typescript: '3178C6', nodedotjs: '5FA04E', python: '3776AB', postgresql: '4169E1',
  supabase: '3FCF8E', docker: '2496ED', n8n: 'EA4B71', figma: 'F24E1E', claude: 'D97757',
  nextdotjs: 'A3AAB2', tailwindcss: '06B6D4', fastapi: '009688', redis: 'FF4438', mongodb: '47A248',
  prisma: '2D3748', vercel: 'A3AAB2', cloudflare: 'F38020', githubactions: '2088FF', git: 'F05032',
  langchain: '5FB39B', huggingface: 'FFD21E', googlegemini: '8E75B2', zapier: 'FF4F00', make: '6D00CC',
  stripe: '635BFF', expo: 'A3AAB2', graphql: 'E10098', anthropic: 'D97757', hubspot: 'FF7A59',
  airtable: '18BFFF', notion: 'A3AAB2', postman: 'FF6C37', googlechrome: '4285F4', express: 'A3AAB2',
  github: 'A3AAB2', hackerrank: '00EA64',
}

const src = path.join('node_modules', 'simple-icons', 'icons')
const out = path.join('public', 'icons', 'brands')
mkdirSync(out, { recursive: true })
for (const [slug, hex] of Object.entries(BRANDS)) {
  const svg = readFileSync(path.join(src, `${slug}.svg`), 'utf8')
  writeFileSync(path.join(out, `${slug}.svg`), svg.replace('<svg ', `<svg fill="#${hex}" `))
}
console.log(`wrote ${Object.keys(BRANDS).length} brand icons to ${out}`)
```

Run: `node scripts/brand-icons.mjs`
Expected: `wrote 37 brand icons to public/icons/brands` (on Windows the path prints as `public\icons\brands`).

Copy Kraft's assets:

```bash
cp reference/Kraft_Portfolio_Design_System/assets/about-workstation.gif public/assets/
cp reference/Kraft_Portfolio_Design_System/assets/aws-mark.svg public/assets/
```

- [ ] **Step 4: Write the data files**

Create `data/stack.ts`:

```ts
/**
 * The tools Kraft lists (KraftScreens.dc.html:561-573). Logos are self-hosted
 * from simple-icons by scripts/brand-icons.mjs.
 */
export type Brand = { name: string; slug: string }

export const brandIcon = (slug: string) => `/icons/brands/${slug}.svg`

export const TOOLS: Brand[] = [
  { name: 'React', slug: 'react' },
  { name: 'TypeScript', slug: 'typescript' },
  { name: 'Node.js', slug: 'nodedotjs' },
  { name: 'Python', slug: 'python' },
  { name: 'PostgreSQL', slug: 'postgresql' },
  { name: 'Supabase', slug: 'supabase' },
  { name: 'Docker', slug: 'docker' },
  { name: 'n8n', slug: 'n8n' },
  { name: 'Figma', slug: 'figma' },
  { name: 'Claude', slug: 'claude' },
  { name: 'Next.js', slug: 'nextdotjs' },
  { name: 'Tailwind', slug: 'tailwindcss' },
  { name: 'FastAPI', slug: 'fastapi' },
  { name: 'Redis', slug: 'redis' },
  { name: 'MongoDB', slug: 'mongodb' },
  { name: 'Prisma', slug: 'prisma' },
  { name: 'Vercel', slug: 'vercel' },
  { name: 'Cloudflare', slug: 'cloudflare' },
  { name: 'GitHub Actions', slug: 'githubactions' },
  { name: 'Git', slug: 'git' },
  { name: 'LangChain', slug: 'langchain' },
  { name: 'Hugging Face', slug: 'huggingface' },
  { name: 'Gemini', slug: 'googlegemini' },
  { name: 'Zapier', slug: 'zapier' },
  { name: 'Make', slug: 'make' },
  { name: 'Stripe', slug: 'stripe' },
  { name: 'Expo', slug: 'expo' },
  { name: 'GraphQL', slug: 'graphql' },
]

/** Tools Justine is still testing; the Stack card gives them a grey dot. */
export const EXPERIMENTAL = ['LangChain', 'Hugging Face', 'Gemini', 'Make', 'Expo', 'Prisma', 'GraphQL']

/** Kraft's two Stack marquee rows: alternate tools, so both rows mix (KraftScreens.dc.html:575-581). */
export function stackRows(): [Brand[], Brand[]] {
  return [TOOLS.filter((_, i) => i % 2 === 0), TOOLS.filter((_, i) => i % 2 === 1)]
}
```

Create `data/services.ts`:

```ts
import type { Icon } from '@phosphor-icons/react'
import {
  BrowsersIcon,
  DeviceMobileIcon,
  KanbanIcon,
  LightningIcon,
  PlugsConnectedIcon,
  RobotIcon,
} from '@phosphor-icons/react/ssr'
import type { Brand } from './stack'

/** Kraft's six offers, verbatim (KraftScreens.dc.html:585-592). */
export type Service = {
  n: string
  name: string
  icon: Icon
  line: string
  badge: string
  bullets: string[]
  tags: string[]
  logos: Brand[]
}

export const SERVICES: Service[] = [
  {
    n: '01', name: 'Full-Stack Web & SaaS', icon: BrowsersIcon, line: 'Product surfaces people use every day.', badge: 'BUILT TO LAST',
    bullets: ['Design through deploy', 'Accessible, responsive, fast', 'You own the codebase'], tags: ['React', 'TypeScript', 'Postgres'],
    logos: [{ name: 'React', slug: 'react' }, { name: 'TypeScript', slug: 'typescript' }, { name: 'PostgreSQL', slug: 'postgresql' }],
  },
  {
    n: '02', name: 'AI Agents & RAG', icon: RobotIcon, line: 'Models wired to your real data.', badge: 'GROUNDED',
    bullets: ['Retrieval over your content', 'Guardrails and evaluations', 'Cost and latency budgets'], tags: ['LLM APIs', 'RAG', 'Vectors'],
    logos: [{ name: 'Hugging Face', slug: 'huggingface' }, { name: 'Anthropic', slug: 'anthropic' }, { name: 'Supabase', slug: 'supabase' }],
  },
  {
    n: '03', name: 'Automation & Workflows', icon: LightningIcon, line: 'The manual steps, removed.', badge: 'RUNS ITSELF',
    bullets: ['Process mapped before build', 'Retries and alerts included', 'Documented handover'], tags: ['n8n', 'Webhooks', 'Queues'],
    logos: [{ name: 'n8n', slug: 'n8n' }, { name: 'Zapier', slug: 'zapier' }, { name: 'Make', slug: 'make' }],
  },
  {
    n: '04', name: 'CRM, CMS & Internal Tools', icon: KanbanIcon, line: 'The admin your team stops dreading.', badge: 'TEAM READY',
    bullets: ['Roles and permissions', 'Bulk actions, audit trail', 'Fits your pipeline'], tags: ['Dashboards', 'Auth', 'Reporting'],
    logos: [{ name: 'HubSpot', slug: 'hubspot' }, { name: 'Airtable', slug: 'airtable' }, { name: 'Notion', slug: 'notion' }],
  },
  {
    n: '05', name: 'APIs & Integrations', icon: PlugsConnectedIcon, line: 'Systems that finally talk.', badge: 'TYPED',
    bullets: ['Versioned contracts', 'Idempotent by default', 'Monitoring from day one'], tags: ['REST', 'Webhooks', 'SDKs'],
    logos: [{ name: 'Postman', slug: 'postman' }, { name: 'GraphQL', slug: 'graphql' }, { name: 'Stripe', slug: 'stripe' }],
  },
  {
    n: '06', name: 'Mobile Apps & Extensions', icon: DeviceMobileIcon, line: 'Small tools that fix real friction.', badge: 'SHIPS FAST',
    bullets: ['One job, done properly', 'Store-ready builds', 'Weeks, not quarters'], tags: ['React Native', 'Chrome', 'TS'],
    logos: [{ name: 'React Native', slug: 'react' }, { name: 'Expo', slug: 'expo' }, { name: 'Chrome', slug: 'googlechrome' }],
  },
]
```

Create `data/testimonials.ts`:

```ts
/**
 * Kraft ships no real quotes (KraftScreens.dc.html:614-618, "Nothing on this
 * page is fabricated"). Every field stays a PLACEHOLDER until a real client
 * says it.
 */
export type Client = { n: string; name: string; role: string; tag: string; quote: string; tags: string[] }

export const CLIENTS: Client[] = ['01', '02', '03'].map((n) => ({
  n,
  name: 'PLACEHOLDER - client name',
  role: 'PLACEHOLDER - role · company',
  tag: 'PLACEHOLDER - scope',
  quote: 'PLACEHOLDER - a real client quote. Nothing on this page is fabricated.',
  tags: ['PLACEHOLDER - tag', 'PLACEHOLDER - tag', 'PLACEHOLDER - tag'],
}))
```

Create `data/credentials.ts`:

```ts
import { brandIcon } from './stack'

/** Kraft's certifications (KraftScreens.dc.html:639-642). */
export type Cert = { name: string; label: string; pill: string; icon: string }

export const CERTS: Cert[] = [
  {
    name: 'AWS Cloud Practitioner Essentials',
    label: 'AWS CLOUD PRACTITIONER ESSENTIALS',
    pill: 'Cloud Practitioner Essentials',
    icon: '/assets/aws-mark.svg',
  },
  {
    name: 'HackerRank Software Engineer',
    label: 'HACKERRANK · SOFTWARE ENGINEER',
    pill: 'Software Engineer',
    icon: brandIcon('hackerrank'),
  },
]
```

Create `data/home.ts`:

```ts
import type { Icon } from '@phosphor-icons/react'
import { CodeIcon, LightningIcon, RocketLaunchIcon, TreeStructureIcon } from '@phosphor-icons/react/ssr'

/**
 * Home copy, verbatim from KraftScreens.dc.html:47-200. The intro steps and
 * status lines are Kraft's loader (Kraft Portfolio.dc.html:389-394, 733).
 * The stats row is spec §8; its first two values are PLACEHOLDERs.
 */
export type Stat = { value: string; short?: string; unit: string; label: string }
export type IntroStep = { label: string; icon: Icon }

const stats: Stat[] = [
  { value: 'PLACEHOLDER - years building', short: '[X]', unit: 'yrs', label: 'building' },
  { value: 'PLACEHOLDER - builds shipped', short: '[N]', unit: 'builds', label: 'shipped' },
  { value: 'GMT+8', unit: '', label: 'US hours' },
]

const steps: IntroStep[] = [
  { label: 'Brief comes in', icon: LightningIcon },
  { label: 'Architect', icon: TreeStructureIcon },
  { label: 'Build & test', icon: CodeIcon },
  { label: 'Shipped', icon: RocketLaunchIcon },
]

export const home = {
  headline: ['Software that keeps', 'its promises.'] as const,
  lede: 'Full-stack development, AI automation and workflow systems — built to keep running long after launch day.',
  primary: { label: 'Start a project', href: '/contact' },
  secondary: { label: 'See the work', href: '/projects' },
  stats,
  tools: { kicker: 'DAILY DRIVERS', title: 'Tools I work with' },
  cards: {
    projects: {
      title: 'Projects',
      meta: '06 BUILDS',
      body: 'Apps, workflows and internal tools built to remove one specific problem. Open a card to walk through the work.',
      href: '/projects',
      arc: [1, 2, 3, 4, 5].map((n) => ({
        src: `PLACEHOLDER - project screenshot ${n} (16:10)`,
        label: `Project ${n} · 16:10`,
      })),
    },
    about: {
      title: 'About',
      body: 'How I work, and what I refuse to ship.',
      href: '/about',
      image: {
        src: '/assets/about-workstation.gif',
        alt: 'Animated pixel-art illustration of a developer workstation',
        width: 1920,
        height: 1080,
      },
    },
    stack: {
      title: 'Stack',
      body: "The tools I build on daily, and the ones I'm still testing.",
      inUse: 'IN USE',
      experimental: 'EXPERIMENTAL',
    },
    services: { title: 'Services', hint: 'SCROLL FOR ALL SIX', href: '/services' },
    testimonials: { title: 'Testimonials', meta: 'AWAITING REAL QUOTES', href: '/testimonials' },
    credentials: { title: 'Credentials', body: 'AWS Cloud Practitioner. HackerRank Software Engineer.' },
  },
  intro: {
    steps,
    running: 'EXECUTING WORKFLOW…',
    done: 'WORKFLOW EXECUTED SUCCESSFULLY',
    skip: 'Skip',
  },
}
```

Modify `data/profile.ts`. Add `phoneHandle` after `handleLines`:

```ts
  handleLines: ['@Kraft · FULL STACK DEV', 'AI AUTOMATION & WORKFLOWS'] as [string, string],
  phoneHandle: '@KRAFT',
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `npx vitest run tests/home-data.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 6: Run the full unit suite, typecheck and lint**

Run: `npm test && npm run typecheck && npm run lint`
Expected: every test passes (73 old + 9 new = 82); typecheck and lint are clean.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json scripts/brand-icons.mjs public/icons/brands public/assets/about-workstation.gif public/assets/aws-mark.svg data tests/home-data.test.ts
git commit -m "feat: Home data, self-hosted brand logos and Kraft assets" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Hero, stats and the phone Home header

**Files:**
- Create: `components/home/Hero.tsx`, `components/home/Stats.tsx`, `components/home/HomeProfile.tsx`
- Modify: `app/(site)/page.tsx`, `app/(site)/layout.tsx` (the `<main>` className), `components/shell/PhoneControls.tsx`, `e2e/phone.spec.ts`
- Test: `tests/Hero.test.tsx`, `tests/HomeProfile.test.tsx`, `tests/PhoneControls.test.tsx`, `e2e/home.spec.ts`

**Interfaces:**
- Consumes: `home`, `profile`, `isPlaceholder`, `navForPath('/')`, `ShellLink`, `usePalette`, `ThemeButton`, and `ManilaClock` (all from Phase 1 or Task 1)
- Produces:
  - `<Hero/>` renders `<h1 data-intro-target>`. It is the only `<h1>` on Home and has **no** held ancestor.
  - `data-intro-hold` markers go on the eyebrow, lede (delay 60), actions (delay 100) and stats (delay 140).
  - `<HomeProfile/>` renders a `div[data-home-profile][data-intro-hold]`.
  - `PhoneControls` renders nothing on `/`.

- [ ] **Step 1: Write the failing tests**

Create `tests/Hero.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Hero from '@/components/home/Hero'
import { NavigationProvider } from '@/components/shell/NavigationProvider'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

const renderHero = () =>
  render(
    <NavigationProvider>
      <Hero />
    </NavigationProvider>,
  )

describe('Hero', () => {
  it("renders Kraft's headline as the intro's landing target", () => {
    renderHero()
    const h1 = screen.getByRole('heading', { level: 1, name: 'Software that keeps its promises.' })
    expect(h1).toHaveAttribute('data-intro-target')
    expect(h1.closest('[data-intro-hold]')).toBeNull()
  })

  it('shows the eyebrow and lede, held back for the intro', () => {
    renderHero()
    expect(screen.getByText('HOME / OVERVIEW')).toHaveAttribute('data-intro-hold')
    expect(screen.getByText(/^Full-stack development, AI automation/)).toHaveAttribute('data-intro-hold')
  })

  it('links the two actions to Contact and Projects', () => {
    renderHero()
    expect(screen.getByRole('link', { name: 'Start a project' })).toHaveAttribute('href', '/contact')
    expect(screen.getByRole('link', { name: 'See the work' })).toHaveAttribute('href', '/projects')
  })

  it('shows short stand-ins for placeholder stats and the real timezone', () => {
    renderHero()
    const list = screen.getByRole('list')
    expect(list).toHaveTextContent('[X]yrs')
    expect(list).toHaveTextContent('[N]builds')
    expect(list).toHaveTextContent('GMT+8')
    expect(list).toHaveTextContent('US hours')
  })
})
```

Create `tests/HomeProfile.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomeProfile from '@/components/home/HomeProfile'
import { PaletteProvider } from '@/components/shell/CommandPalette'
import { NavigationProvider } from '@/components/shell/NavigationProvider'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

describe('HomeProfile', () => {
  it("shows Kraft's phone identity header with theme and search", async () => {
    const user = userEvent.setup()
    render(
      <NavigationProvider>
        <PaletteProvider>
          <HomeProfile />
        </PaletteProvider>
      </NavigationProvider>,
    )
    expect(screen.getByText('Justine Acosta')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Certified' })).toBeInTheDocument()
    expect(screen.getByText(/@KRAFT · GMT\+8 ·/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Toggle dark and light mode' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Open command palette' }))
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument()
  })
})
```

Create `tests/PhoneControls.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PaletteProvider } from '@/components/shell/CommandPalette'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import PhoneControls from '@/components/shell/PhoneControls'

const nav = vi.hoisted(() => ({ pathname: '/' }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => nav.pathname,
}))

const renderControls = () =>
  render(
    <NavigationProvider>
      <PaletteProvider>
        <PhoneControls />
      </PaletteProvider>
    </NavigationProvider>,
  )

describe('PhoneControls', () => {
  it('stays out of the way on Home, where the profile header carries them', () => {
    nav.pathname = '/'
    renderControls()
    expect(screen.queryByRole('button', { name: 'Open command palette' })).toBeNull()
  })

  it('floats theme and search on every other page', () => {
    nav.pathname = '/about'
    renderControls()
    expect(screen.getByRole('button', { name: 'Open command palette' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Toggle dark and light mode' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run tests/Hero.test.tsx tests/HomeProfile.test.tsx tests/PhoneControls.test.tsx`
Expected: FAIL. Hero and HomeProfile can't be resolved. The PhoneControls `'/'` case fails because the button is found.

- [ ] **Step 3: Implement**

Create `components/home/Stats.tsx`:

```tsx
import { home } from '@/data/home'
import { isPlaceholder } from '@/lib/placeholder'

/** Three proof facts under the actions (spec §8). A placeholder shows its short stand-in. */
export default function Stats() {
  return (
    <ul data-intro-hold data-intro-delay="140" className="mt-[22px] flex max-w-[560px] flex-wrap gap-2.5">
      {home.stats.map((s) => {
        const gap = isPlaceholder(s.value)
        return (
          <li
            key={s.label}
            title={gap ? s.value : undefined}
            className="flex min-w-[104px] flex-1 flex-col gap-1.5 rounded-[16px] border border-b1 bg-s1 px-4 py-3"
          >
            <span className="text-[22px] leading-none font-semibold tracking-[-.02em]">
              {gap ? s.short : s.value}
              {s.unit && <span className="ml-1 text-[13px] font-medium text-ink3">{s.unit}</span>}
            </span>
            <span className="font-mono text-[9.5px] tracking-[.14em] text-ink3 uppercase">{s.label}</span>
          </li>
        )
      })}
    </ul>
  )
}
```

Create `components/home/Hero.tsx`:

```tsx
import { Fragment } from 'react'
import { ArrowRightIcon } from '@phosphor-icons/react/ssr'
import { ShellLink } from '@/components/shell/NavigationProvider'
import { home } from '@/data/home'
import { navForPath } from '@/data/nav'
import Stats from './Stats'

/**
 * Kraft's Home header (KraftScreens.dc.html:49-58). The <h1> is the intro's
 * landing target: it shrink-wraps its longest line (w-fit) so the flying copy
 * can match its measure, and none of its ancestors are held back by the intro,
 * because a fading parent would show through at the swap.
 */
export default function Hero() {
  return (
    <header className="max-w-[940px] pt-[clamp(4px,1.2cqw,16px)]">
      <p data-intro-hold className="mb-3.5 font-mono text-[10.5px] tracking-[.18em] text-accent">
        {navForPath('/').eyebrow}
      </p>
      <h1
        data-intro-target
        className="w-fit max-w-full text-[clamp(30px,5.4cqw,62px)] leading-[1.02] font-bold tracking-[-.035em]"
      >
        {home.headline.map((line, i) => (
          <Fragment key={line}>
            {i > 0 && ' '}
            <span className="block">{line}</span>
          </Fragment>
        ))}
      </h1>
      <p
        data-intro-hold
        data-intro-delay="60"
        className="mt-4 max-w-[882px] text-[clamp(13.5px,1.5cqw,18px)] leading-[1.55] text-ink2"
      >
        {home.lede}
      </p>
      <div data-intro-hold data-intro-delay="100" className="mt-[22px] flex flex-wrap gap-2.5">
        <ShellLink
          href={home.primary.href}
          className="flex min-h-[46px] items-center gap-2 rounded-[13px] bg-accent px-5 py-3 text-sm font-semibold text-on-accent transition-[translate,scale,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-12px_var(--glow)] active:scale-[.988]"
        >
          {home.primary.label} <ArrowRightIcon size={16} aria-hidden />
        </ShellLink>
        <ShellLink
          href={home.secondary.href}
          className="flex min-h-[46px] items-center gap-2 rounded-[13px] border border-b2 px-5 py-3 text-sm font-medium text-ink transition-[translate,scale,background-color] duration-300 hover:-translate-y-0.5 hover:bg-hover active:scale-[.988]"
        >
          {home.secondary.label}
        </ShellLink>
      </div>
      <Stats />
    </header>
  )
}
```

Create `components/home/HomeProfile.tsx`:

```tsx
'use client'

import Image from 'next/image'
import { MagnifyingGlassIcon, SealCheckIcon } from '@phosphor-icons/react/ssr'
import { usePalette } from '@/components/shell/CommandPalette'
import ManilaClock from '@/components/shell/ManilaClock'
import ThemeButton from '@/components/shell/ThemeButton'
import { profile } from '@/data/profile'

/** Home on a phone opens with the sidebar's identity laid flat (Kraft Portfolio.dc.html:297-307, spec §7). */
export default function HomeProfile() {
  const { openPalette } = usePalette()
  return (
    <div data-home-profile data-intro-hold className="flex items-center gap-[11px] border-b border-b1 pb-3 shell:hidden">
      <Image
        src={profile.portrait.src}
        alt={profile.portrait.alt}
        width={40}
        height={40}
        className="size-10 rounded-full border border-b2 object-cover"
        style={{ objectPosition: profile.portrait.position }}
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[14.5px] font-semibold">{profile.name}</span>
          <SealCheckIcon weight="fill" size={15} role="img" aria-label={profile.verifiedLabel} className="text-accent" />
        </div>
        <span className="truncate font-mono text-[9px] tracking-[.05em] text-ink3">
          {profile.phoneHandle} · {profile.tzLabel} · <ManilaClock />
        </span>
      </div>
      <ThemeButton size={40} className="ml-auto" />
      <button
        type="button"
        onClick={openPalette}
        aria-label="Open command palette"
        className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-b1 bg-s2 text-ink2"
      >
        <MagnifyingGlassIcon size={15} aria-hidden />
      </button>
    </div>
  )
}
```

Replace `app/(site)/page.tsx`:

```tsx
import Hero from '@/components/home/Hero'
import HomeProfile from '@/components/home/HomeProfile'

export default function HomePage() {
  return (
    <div className="flex flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <HomeProfile />
      <Hero />
    </div>
  )
}
```

Modify `components/shell/PhoneControls.tsx`. Add the pathname guard:

```tsx
'use client'

import { usePathname } from 'next/navigation'
import { MagnifyingGlassIcon } from '@phosphor-icons/react/ssr'
import { usePalette } from './CommandPalette'
import ThemeButton from './ThemeButton'

/** Theme and ⌘K on phones, floating top-right, except on Home, whose profile header carries them (spec §7). */
export default function PhoneControls() {
  const { openPalette } = usePalette()
  const pathname = usePathname()
  if (pathname === '/') return null
  return (
    <div className="fixed top-[max(12px,env(safe-area-inset-top))] right-3.5 z-30 flex gap-2 shell:hidden">
      <ThemeButton size={40} />
      <button
        type="button"
        onClick={openPalette}
        aria-label="Open command palette"
        className="grid size-10 cursor-pointer place-items-center rounded-xl border border-b1 bg-s2 text-ink2"
      >
        <MagnifyingGlassIcon size={15} aria-hidden />
      </button>
    </div>
  )
}
```

Modify `app/(site)/layout.tsx`. The phone top padding exists only to clear the floating controls, so drop it when the Home header is present. Change the `<main>` className from:

```
className="min-w-0 flex-1 px-4 pt-16 pb-[120px] outline-none shell:overflow-x-hidden shell:overflow-y-auto shell:px-(--deskpad) shell:pt-0 shell:pb-[72px]"
```

to:

```
className="min-w-0 flex-1 px-4 pt-16 pb-[120px] outline-none max-shell:has-[[data-home-profile]]:pt-4 shell:overflow-x-hidden shell:overflow-y-auto shell:px-(--deskpad) shell:pt-0 shell:pb-[72px]"
```

- [ ] **Step 4: Run the unit tests to confirm they pass**

Run: `npx vitest run tests/Hero.test.tsx tests/HomeProfile.test.tsx tests/PhoneControls.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 5: Add e2e coverage and fix the now-ambiguous phone locator**

On phones, "Start a project" now matches both the hero link and the tab bar's centre link, so scope the old test to the tab bar. In `e2e/phone.spec.ts`, replace the `phone: Start goes to contact` test with:

```ts
test('phone: Start goes to contact', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Start a project' }).tap()
  await expect(page).toHaveURL(/\/contact$/)
})
```

Append to `e2e/phone.spec.ts`:

```ts
test('phone: Home opens with the profile header instead of floating controls', async ({ page }) => {
  await page.goto('/')
  const header = page.locator('[data-home-profile]')
  await expect(header).toBeVisible()
  await expect(header.getByText('Justine Acosta')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Toggle dark and light mode' })).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Open command palette' })).toHaveCount(1)
})
```

Create `e2e/home.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test("Home shows Kraft's headline, lede and actions", async ({ page }) => {
  await page.goto('/')
  const main = page.locator('#main-content')
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Software that keeps its promises.')
  await expect(main.getByText(/^Full-stack development, AI automation and workflow systems/)).toBeVisible()
  await main.getByRole('link', { name: 'See the work' }).click()
  await expect(page).toHaveURL(/\/projects$/)
})
```

- [ ] **Step 6: Run the whole suite**

Run: `npm test && npm run typecheck && npm run lint && npm run e2e`
Expected: all green. That's 89 unit tests. For e2e, it's the 32 Phase 1 tests minus the replaced one, plus 1 replacement, 1 phone and 1 home, so 34 in total.

- [ ] **Step 7: Commit**

```bash
git add components/home "app/(site)/page.tsx" "app/(site)/layout.tsx" components/shell/PhoneControls.tsx tests/Hero.test.tsx tests/HomeProfile.test.tsx tests/PhoneControls.test.tsx e2e/home.spec.ts e2e/phone.spec.ts
git commit -m "feat: Home hero, stats and phone profile header" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Bento frame, tools row, Projects, About and Stack cards

**Files:**
- Create: `components/home/HomeCard.tsx`, `components/home/ToolsRow.tsx`, `components/home/ProjectsCard.tsx`, `components/home/AboutCard.tsx`, `components/home/StackCard.tsx`, `components/home/Bento.tsx`
- Modify: `app/globals.css` (Home section and `--animate-marquee`), `app/(site)/page.tsx`
- Test: `tests/Bento.test.tsx`, `e2e/home.spec.ts`

**Interfaces:**
- Consumes: `home.cards.*`, `home.tools`, `TOOLS`, `EXPERIMENTAL`, `stackRows()`, `brandIcon()`, `isPlaceholder`, `ShellLink`
- Produces:
  - `HomeCard` props: `{ title: string; icon: Icon; meta?: string; href?: string; className?: string; headClassName?: string; children: ReactNode }`
  - `<Bento/>` is a `div.bento[data-intro-hold][data-intro-delay="220"]`
  - CSS classes: `.bento`, `.edge-fade` (via `--fade`), `.arc` and `.arc-card` (via `--x --y --r --z`), and `animate-marquee` (paused on `[data-marquee]:hover`)

- [ ] **Step 1: Write the failing test**

Create `tests/Bento.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Bento from '@/components/home/Bento'
import { NavigationProvider } from '@/components/shell/NavigationProvider'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

const renderBento = () =>
  render(
    <NavigationProvider>
      <Bento />
    </NavigationProvider>,
  )

describe('Bento', () => {
  it("renders Kraft's cards in order", () => {
    renderBento()
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Projects', 'About', 'Stack'])
  })

  it('makes Projects and About whole-card links, and leaves Stack static', () => {
    renderBento()
    const projects = screen.getByRole('link', { name: /^Projects/ })
    expect(projects).toHaveAttribute('href', '/projects')
    expect(projects).toHaveTextContent('06 BUILDS')
    expect(screen.getByRole('link', { name: /^About/ })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('heading', { name: 'Stack' }).closest('a')).toBeNull()
  })

  it('fans five project shots, labelled while they are placeholders', () => {
    renderBento()
    for (const n of [1, 2, 3, 4, 5]) expect(screen.getByText(`Project ${n} · 16:10`)).toBeInTheDocument()
  })

  it('loops the tools marquee with a hidden duplicate', () => {
    const { container } = renderBento()
    const track = container.querySelector('[data-marquee] ul')!
    const items = within(track as HTMLElement).getAllByRole('listitem', { hidden: true })
    expect(items).toHaveLength(56)
    expect(items[0]).not.toHaveAttribute('aria-hidden')
    expect(items[28]).toHaveAttribute('aria-hidden', 'true')
  })

  it('marks experimental tools on the Stack card', () => {
    renderBento()
    const stack = screen.getByRole('heading', { name: 'Stack' }).parentElement!.parentElement!
    const chip = within(stack).getAllByText('LangChain')[0].closest('li')!
    expect(chip).toHaveAttribute('data-experimental', 'true')
    expect(within(stack).getByText('IN USE')).toBeInTheDocument()
  })

  it('is held back for the intro', () => {
    const { container } = renderBento()
    expect(container.querySelector('.bento')).toHaveAttribute('data-intro-hold')
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run tests/Bento.test.tsx`
Expected: FAIL (`Failed to resolve import "@/components/home/Bento"`).

- [ ] **Step 3: Add the Home CSS**

In `app/globals.css`, in the `@theme { … }` block, add after `--animate-rise: kRise .22s ease both;`:

```css
  --animate-marquee: kMarquee var(--marq,132s) linear infinite;
```

Append to the end of `app/globals.css`:

```css
/* ---- Home (KraftScreens.dc.html:47-200) ---- */
:root{--arc-shadow:0 18px 42px -24px rgba(0,0,0,.8)}
.bento{background:radial-gradient(120% 110% at 74% -12%,rgba(var(--amb),.55),rgba(var(--amb),0) 56%),linear-gradient(180deg,var(--s1),var(--bg))}
.edge-fade{mask-image:linear-gradient(90deg,transparent,#000 var(--fade,7%),#000 calc(100% - var(--fade,7%)),transparent)}
@keyframes kMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
[data-marquee]:hover .animate-marquee{animation-play-state:paused}
/* Unlayered, so it beats the layered animate-marquee shorthand regardless of utility order. */
.marquee-reverse{animation-direction:reverse}

/* Kraft's project arc (KraftScreens.dc.html:84-90, 1061-1078): a compact fan
   at rest, wider when the card is hovered or focused, and the hovered shot
   lifts out. Per-card geometry arrives as --x --y --r --z. */
.arc-card{position:absolute;left:50%;bottom:26%;width:40%;margin-left:-20%;aspect-ratio:16/10;border-radius:13px;overflow:hidden;background:var(--s0);border:1px solid var(--b2);box-shadow:var(--arc-shadow);transform-origin:50% 50%;will-change:transform;z-index:var(--z);transform:translate(calc(var(--x) * 1%),calc(var(--y) * 1%)) rotate(calc(var(--r) * 1deg));transition:transform .55s cubic-bezier(.2,.7,.2,1),box-shadow .4s ease,border-color .4s ease}
.arc:hover .arc-card,a:focus-visible .arc-card{transform:translate(calc(var(--x) * 1.9%),calc(var(--y) * 1.5%)) rotate(calc(var(--r) * 1.85deg))}
.arc .arc-card:hover{z-index:40;border-color:var(--washB);box-shadow:0 30px 64px -24px var(--glow);transform:translate(calc(var(--x) * 1.9%),calc(var(--y) * 1.5%)) rotate(calc(var(--r) * .555deg)) translateY(-14px) scale(1.05)}
```

- [ ] **Step 4: Implement the components**

Create `components/home/HomeCard.tsx`:

```tsx
import type { Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { ShellLink } from '@/components/shell/NavigationProvider'

type Props = {
  title: string
  icon: Icon
  meta?: string
  href?: string
  className?: string
  headClassName?: string
  children: ReactNode
}

const CARD = 'flex flex-col rounded-[20px] border border-b1 bg-linear-to-b from-s2 to-s1 text-left text-ink'
const LIFT =
  'transition-[translate,scale,border-color,box-shadow] duration-400 ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-[3px] hover:border-b2 hover:shadow-[0_24px_60px_-28px_var(--washB)] active:scale-[.988]'

/**
 * Kraft's Home card (KraftScreens.dc.html:78-83): icon tile, title, mono meta.
 * With `href` the whole card is one link, as Kraft's cards are buttons.
 */
export default function HomeCard({ title, icon: Icon, meta, href, className = '', headClassName = '', children }: Props) {
  const head = (
    <div className={`flex items-center gap-[11px] ${headClassName}`}>
      <span aria-hidden className="grid size-[34px] shrink-0 place-items-center rounded-[10px] border border-wash-b bg-wash">
        <Icon size={18} className="text-accent" />
      </span>
      <h2 className="text-[19px] font-semibold tracking-[-.02em]">{title}</h2>
      {meta && <span className="ml-auto font-mono text-[10px] text-ink3">{meta}</span>}
    </div>
  )
  if (!href) {
    return (
      <div className={`${CARD} ${className}`}>
        {head}
        {children}
      </div>
    )
  }
  return (
    <ShellLink href={href} className={`${CARD} ${LIFT} ${className}`}>
      {head}
      {children}
    </ShellLink>
  )
}
```

Create `components/home/ToolsRow.tsx`:

```tsx
import Image from 'next/image'
import { home } from '@/data/home'
import { brandIcon, TOOLS } from '@/data/stack'

/** "Daily drivers" and the tools marquee (KraftScreens.dc.html:62-74). The second copy only closes the loop. */
export default function ToolsRow() {
  return (
    <div className="flex flex-wrap gap-[clamp(11px,1.3cqw,18px)]">
      <div className="flex min-w-[170px] flex-[1_1_190px] flex-col justify-center gap-[5px] rounded-[18px] border border-b1 bg-s1 px-[18px] py-[15px]">
        <span className="font-mono text-[10px] tracking-[.16em] text-accent">{home.tools.kicker}</span>
        <span className="text-[15.5px] font-semibold tracking-[-.015em]">{home.tools.title}</span>
      </div>
      <div
        data-marquee
        className="edge-fade flex min-h-[62px] min-w-[200px] flex-[3_1_380px] items-center overflow-hidden rounded-[18px] border border-b1 bg-s1"
      >
        <ul className="flex w-max animate-marquee gap-[26px] px-[18px]">
          {[0, 1].map((copy) =>
            TOOLS.map((t) => (
              <li
                key={`${copy}-${t.slug}`}
                aria-hidden={copy === 1 || undefined}
                className="flex items-center gap-2 text-[13.5px] font-medium whitespace-nowrap text-ink2"
              >
                <Image src={brandIcon(t.slug)} alt="" width={18} height={18} className="block shrink-0" />
                {t.name}
              </li>
            )),
          )}
        </ul>
      </div>
    </div>
  )
}
```

Create `components/home/ProjectsCard.tsx`:

```tsx
import type { CSSProperties } from 'react'
import Image from 'next/image'
import { FolderOpenIcon } from '@phosphor-icons/react/ssr'
import { home } from '@/data/home'
import { isPlaceholder } from '@/lib/placeholder'
import HomeCard from './HomeCard'

/** Kraft's arc geometry (KraftScreens.dc.html:595-601), in % and degrees. */
const ARC = [
  { r: -15, x: -21, y: 5 },
  { r: -7.5, x: -10.5, y: 1.8 },
  { r: 0, x: 0, y: 0 },
  { r: 7.5, x: 10.5, y: 1.8 },
  { r: 15, x: 21, y: 5 },
]

export default function ProjectsCard() {
  const c = home.cards.projects
  return (
    <HomeCard title={c.title} icon={FolderOpenIcon} meta={c.meta} href={c.href} className="min-w-[250px] flex-[2_1_400px] gap-[13px] p-5">
      <p className="max-w-[420px] text-[13.5px] leading-normal text-ink3">{c.body}</p>
      <div className="arc relative h-[215px] w-full max-w-[369px] self-center">
        {c.arc.map((shot, i) => {
          const a = ARC[i]
          const pose = { '--x': a.x, '--y': a.y, '--r': a.r, '--z': 10 + (5 - Math.abs(i - 2)) } as CSSProperties
          return (
            <div key={shot.label} className="arc-card" style={pose}>
              {isPlaceholder(shot.src) ? (
                <span className="grid h-full place-items-center font-mono text-[9px] tracking-[.06em] text-ink4">{shot.label}</span>
              ) : (
                <Image src={shot.src} alt="" fill sizes="150px" className="object-cover" />
              )}
            </div>
          )
        })}
      </div>
    </HomeCard>
  )
}
```

Create `components/home/AboutCard.tsx`:

```tsx
import Image from 'next/image'
import { UserCircleIcon } from '@phosphor-icons/react/ssr'
import { home } from '@/data/home'
import HomeCard from './HomeCard'

export default function AboutCard() {
  const c = home.cards.about
  return (
    <HomeCard title={c.title} icon={UserCircleIcon} href={c.href} className="min-w-[220px] flex-[1_1_240px] gap-3 p-5">
      <p className="text-[13.5px] leading-normal text-ink3">{c.body}</p>
      <div className="mt-auto overflow-hidden rounded-[14px] border border-b1 bg-frame">
        <Image
          src={c.image.src}
          alt={c.image.alt}
          width={c.image.width}
          height={c.image.height}
          unoptimized
          className="block h-auto w-full"
        />
      </div>
    </HomeCard>
  )
}
```

Create `components/home/StackCard.tsx`:

```tsx
import Image from 'next/image'
import { StackSimpleIcon } from '@phosphor-icons/react/ssr'
import { home } from '@/data/home'
import { brandIcon, EXPERIMENTAL, stackRows } from '@/data/stack'
import HomeCard from './HomeCard'

/** Two opposing marquees of tool chips; the dot says in use (accent) or experimental (grey). KraftScreens.dc.html:99-126. */
export default function StackCard() {
  const c = home.cards.stack
  return (
    <HomeCard
      title={c.title}
      icon={StackSimpleIcon}
      className="min-w-[220px] flex-[1_1_240px] gap-[13px] overflow-hidden pt-5 pb-[22px]"
      headClassName="px-5"
    >
      <p className="px-5 text-[13.5px] leading-normal text-ink3">{c.body}</p>
      <div data-marquee className="edge-fade my-auto flex flex-col gap-[9px] [--fade:9%]">
        {stackRows().map((row, ri) => (
          <ul key={ri} className={`flex w-max animate-marquee gap-2 ${ri === 1 ? 'marquee-reverse' : ''}`}>
            {[0, 1].map((copy) =>
              row.map((t) => {
                const exp = EXPERIMENTAL.includes(t.name)
                return (
                  <li
                    key={`${copy}-${t.slug}`}
                    aria-hidden={copy === 1 || undefined}
                    data-experimental={exp || undefined}
                    className="flex items-center gap-2 rounded-full border border-b1 bg-chip px-3 py-[7px] whitespace-nowrap"
                  >
                    <Image src={brandIcon(t.slug)} alt="" width={14} height={14} className="block shrink-0" />
                    <span className="text-xs font-medium text-ink2">{t.name}</span>
                    <span
                      aria-hidden
                      className={`size-1.5 shrink-0 rounded-full ${exp ? 'bg-ink3 shadow-[0_0_8px_var(--ink3)]' : 'bg-accent shadow-[0_0_8px_var(--accent)]'}`}
                    />
                  </li>
                )
              }),
            )}
          </ul>
        ))}
      </div>
      <div className="flex items-center gap-3.5 px-5 font-mono text-[9.5px] tracking-[.12em] text-ink3">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" />
          {c.inUse}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-1.5 rounded-full bg-ink3" />
          {c.experimental}
        </span>
      </div>
    </HomeCard>
  )
}
```

Create `components/home/Bento.tsx`:

```tsx
import AboutCard from './AboutCard'
import ProjectsCard from './ProjectsCard'
import StackCard from './StackCard'
import ToolsRow from './ToolsRow'

const ROW = 'flex flex-wrap gap-[clamp(11px,1.3cqw,18px)]'

/** Kraft's framed card grid (KraftScreens.dc.html:60-199). */
export default function Bento() {
  return (
    <div
      data-intro-hold
      data-intro-delay="220"
      className="bento flex flex-col gap-[clamp(11px,1.3cqw,18px)] rounded-[26px] border border-b1 p-[clamp(11px,1.3cqw,18px)]"
    >
      <ToolsRow />
      <div className={ROW}>
        <ProjectsCard />
        <AboutCard />
        <StackCard />
      </div>
    </div>
  )
}
```

Modify `app/(site)/page.tsx`. Render `<Bento />` after `<Hero />`:

```tsx
import Bento from '@/components/home/Bento'
import Hero from '@/components/home/Hero'
import HomeProfile from '@/components/home/HomeProfile'

export default function HomePage() {
  return (
    <div className="flex flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <HomeProfile />
      <Hero />
      <Bento />
    </div>
  )
}
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `npx vitest run tests/Bento.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 6: Add e2e coverage**

Append to `e2e/home.spec.ts`:

```ts
test('Home cards open their pages', async ({ page }) => {
  await page.goto('/')
  await page.locator('#main-content').getByRole('link', { name: /^Projects/ }).click()
  await expect(page).toHaveURL(/\/projects$/)
})

test('every Home logo and image loads from this site', async ({ page }) => {
  const bad: string[] = []
  page.on('response', (r) => {
    // The favicon arrives with the SEO work in Phase 4.
    if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) bad.push(`${r.status()} ${r.url()}`)
  })
  const offsite: string[] = []
  page.on('request', (r) => {
    const url = r.url()
    if (/^https?:/.test(url) && !url.startsWith('http://localhost:3100')) offsite.push(url)
  })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  expect(bad).toEqual([])
  expect(offsite).toEqual([])
})
```

- [ ] **Step 7: Run the whole suite**

Run: `npm test && npm run typecheck && npm run lint && npm run e2e`
Expected: all green (95 unit tests, 36 e2e).

- [ ] **Step 8: Commit**

```bash
git add components/home app/globals.css "app/(site)/page.tsx" tests/Bento.test.tsx e2e/home.spec.ts
git commit -m "feat: Home bento with tools marquee, project arc, About and Stack cards" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Services, Testimonials and Credentials cards

**Files:**
- Create: `lib/wheel.ts`, `hooks/useWheelToX.ts`, `components/home/WheelRow.tsx`, `components/home/ServicesCard.tsx`, `components/home/TestimonialsCard.tsx`, `components/home/CredentialsCard.tsx`
- Modify: `components/home/Bento.tsx` (row 3), `app/globals.css` (logo tokens, medals), `tests/Bento.test.tsx`
- Test: `tests/wheel.test.ts`, `tests/Bento.test.tsx`, `e2e/home.spec.ts`

**Interfaces:**
- Consumes: `SERVICES`, `CLIENTS`, `CERTS`, `brandIcon`, `home.cards.*`, `HomeCard`
- Produces:
  - `wheelToX(g: { dx: number; dy: number; left: number; max: number }): number | null`. It returns the next `scrollLeft`, or `null` when the page should get the wheel.
  - `useWheelToX<T extends HTMLElement>(): RefObject<T | null>`
  - `<WheelRow className>` renders a `div[data-wheel-x]`
  - Tokens: `--logo-chip` (→ `bg-logo-chip`), `--logo-shadow`, `--medal-shadow`, `--pill-shadow`

- [ ] **Step 1: Write the failing tests**

Create `tests/wheel.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { wheelToX } from '@/lib/wheel'

describe('wheelToX (Kraft svcWheel, KraftScreens.dc.html:1080-1092)', () => {
  it('turns a vertical wheel into 1.1x sideways travel', () => {
    expect(wheelToX({ dx: 0, dy: 100, left: 0, max: 500 })).toBeCloseTo(110)
  })

  it('stops at the far end', () => {
    expect(wheelToX({ dx: 0, dy: 100, left: 480, max: 500 })).toBe(500)
  })

  it('hands the wheel back to the page at the far end', () => {
    expect(wheelToX({ dx: 0, dy: 100, left: 500, max: 500 })).toBeNull()
  })

  it('hands the wheel back to the page at the start when scrolling up', () => {
    expect(wheelToX({ dx: 0, dy: -100, left: 0, max: 500 })).toBeNull()
  })

  it('leaves sideways gestures to the browser', () => {
    expect(wheelToX({ dx: 120, dy: 20, left: 0, max: 500 })).toBeNull()
  })

  it('does nothing when the row does not overflow', () => {
    expect(wheelToX({ dx: 0, dy: 100, left: 0, max: 0 })).toBeNull()
  })
})
```

In `tests/Bento.test.tsx`, change the first test's expected list to all six cards:

```tsx
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Projects', 'About', 'Stack', 'Services', 'Testimonials', 'Credentials',
    ])
```

Then add these tests inside the `describe('Bento', …)` block. Also add `fireEvent` to the Testing Library import at the top: `import { fireEvent, render, screen, within } from '@testing-library/react'`.

```tsx
  it("lists Kraft's six services with their numbers and logos", () => {
    renderBento()
    const services = screen.getByRole('link', { name: /^Services/ })
    expect(services).toHaveAttribute('href', '/services')
    expect(within(services).getByText('01 / 06')).toBeInTheDocument()
    expect(within(services).getByText('Mobile Apps & Extensions')).toBeInTheDocument()
    expect(services.querySelector('img[src="/icons/brands/n8n.svg"]')).not.toBeNull()
  })

  it('turns a vertical wheel over the services row into sideways scroll', () => {
    const { container } = renderBento()
    const row = container.querySelector<HTMLElement>('[data-wheel-x]')!
    Object.defineProperty(row, 'scrollWidth', { configurable: true, value: 1100 })
    Object.defineProperty(row, 'clientWidth', { configurable: true, value: 300 })
    row.scrollTo = vi.fn() as unknown as typeof row.scrollTo
    const notCancelled = fireEvent.wheel(row, { deltaY: 100 })
    expect(notCancelled).toBe(false)
    expect(row.scrollTo).toHaveBeenCalledWith({ left: 110, behavior: 'smooth' })
  })

  it('lists three placeholder clients on the Testimonials card', () => {
    renderBento()
    const t = screen.getByRole('link', { name: /^Testimonials/ })
    expect(t).toHaveAttribute('href', '/testimonials')
    expect(within(t).getByText('AWAITING REAL QUOTES')).toBeInTheDocument()
    expect(within(t).getAllByText('PLACEHOLDER - client name')).toHaveLength(3)
  })

  it('shows both certifications as medals', () => {
    renderBento()
    expect(screen.getByRole('img', { name: 'AWS Cloud Practitioner Essentials' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'HackerRank Software Engineer' })).toBeInTheDocument()
    expect(screen.getByText('AWS Cloud Practitioner. HackerRank Software Engineer.')).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run tests/wheel.test.ts tests/Bento.test.tsx`
Expected: FAIL. `@/lib/wheel` can't be resolved, and the Bento heading list has only three items.

- [ ] **Step 3: Implement the wheel**

Create `lib/wheel.ts`:

```ts
/**
 * Kraft's svcWheel (KraftScreens.dc.html:1080-1092): a mostly-vertical wheel
 * over a sideways row moves the row by 1.1x the delta. Returns the next
 * scrollLeft, or null when the page should have the wheel instead: sideways
 * gestures, rows that don't overflow, and a row already at the end it is
 * being pushed towards (so the row never traps the page).
 */
export function wheelToX({ dx, dy, left, max }: { dx: number; dy: number; left: number; max: number }): number | null {
  if (Math.abs(dy) <= Math.abs(dx) || max <= 0) return null
  const next = Math.max(0, Math.min(max, left + dy * 1.1))
  return next === left ? null : next
}
```

Create `hooks/useWheelToX.ts`:

```ts
'use client'

import { useEffect, useRef } from 'react'
import { wheelToX } from '@/lib/wheel'

/**
 * Native, non-passive wheel listener (React's onWheel is passive, so it can't
 * preventDefault). stopPropagation keeps Lenis, which listens on the panel,
 * from also scrolling the page with the same wheel.
 */
export function useWheelToX<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const next = wheelToX({ dx: e.deltaX, dy: e.deltaY, left: el.scrollLeft, max: el.scrollWidth - el.clientWidth })
      if (next === null) return
      if (e.cancelable) e.preventDefault()
      e.stopPropagation()
      el.scrollTo({ left: next, behavior: 'smooth' })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])
  return ref
}
```

Create `components/home/WheelRow.tsx`:

```tsx
'use client'

import type { ReactNode } from 'react'
import { useWheelToX } from '@/hooks/useWheelToX'

/** A sideways row that a vertical wheel scrolls, until it reaches its end. */
export default function WheelRow({ className, children }: { className: string; children: ReactNode }) {
  const ref = useWheelToX<HTMLDivElement>()
  return (
    <div ref={ref} data-wheel-x className={className}>
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Add the CSS**

In `app/globals.css`, in the `@theme inline { … }` block, add after `--color-scrim: var(--scrim);`:

```css
  --color-logo-chip: var(--logo-chip);
```

Append to the end of `app/globals.css`:

```css
/* Logo chips and shadows Kraft uses on both themes (KraftScreens.dc.html:141, 190-191) */
:root{--logo-chip:#f7f4ee;--logo-shadow:0 2px 8px -2px rgba(0,0,0,.45);--medal-shadow:0 8px 22px -10px rgba(0,0,0,.7);--pill-shadow:0 14px 34px -14px rgba(0,0,0,.7)}

/* Kraft's certification medals (KraftScreens.dc.html:183-195, 1130-1149): two
   tilted rosettes that straighten, lift and show a pill on hover. */
.medal{position:relative;display:grid;place-items:center;width:72px;height:72px;cursor:default;transform-origin:50% 85%;transform:rotate(var(--tilt));transition:transform .45s cubic-bezier(.2,.8,.2,1),margin-left .45s cubic-bezier(.2,.8,.2,1)}
.medal:first-child{--tilt:-11deg;--pill-tilt:11deg;z-index:5}
.medal:nth-child(2){--tilt:11deg;--pill-tilt:-11deg;z-index:4}
.medal + .medal{margin-left:-26px}
.medal + .medal:hover{margin-left:-14px}
.medal:hover{transform:rotate(0deg) translateY(-10px) scale(1.1);z-index:12}
.medal-tail{position:absolute;bottom:-20px;left:50%;width:15px;height:34px;background:linear-gradient(180deg,var(--accent),rgba(var(--amb),1));clip-path:polygon(0 0,100% 0,100% 100%,50% 72%,0 100%);transform-origin:50% 0;z-index:0}
.medal-tail--l{transform:translateX(-118%) rotate(-15deg)}
.medal-tail--r{transform:translateX(18%) rotate(15deg)}
.medal-rosette{position:absolute;inset:-5px;border-radius:50%;border:6px dashed var(--accent);opacity:.9;z-index:1;transition:transform .45s cubic-bezier(.2,.8,.2,1)}
.medal:hover .medal-rosette{transform:rotate(22deg)}
.medal-disc{position:absolute;inset:0;border-radius:50%;background:var(--logo-chip);border:2px solid var(--accent);box-shadow:var(--medal-shadow),0 0 0 0 var(--wash);z-index:2;transition:box-shadow .4s ease}
.medal:hover .medal-disc{box-shadow:var(--medal-shadow),0 0 0 6px var(--wash)}
.medal-pill{position:absolute;top:calc(100% + 12px);left:50%;display:flex;align-items:center;gap:6px;width:max-content;white-space:nowrap;padding:6px 11px;border-radius:999px;background:var(--s1);border:1px solid var(--washB);font-size:11px;font-weight:600;line-height:1.35;color:var(--ink);opacity:0;pointer-events:none;z-index:30;box-shadow:var(--pill-shadow);transform:translateX(-50%) translateY(-6px) rotate(var(--pill-tilt));transition:opacity .25s,transform .3s cubic-bezier(.2,.8,.2,1)}
.medal:hover .medal-pill{opacity:1;transform:translateX(-50%) translateY(0) rotate(0deg)}
```

- [ ] **Step 5: Implement the cards**

Create `components/home/ServicesCard.tsx`:

```tsx
import Image from 'next/image'
import { ArrowRightIcon, StackIcon } from '@phosphor-icons/react/ssr'
import { home } from '@/data/home'
import { SERVICES } from '@/data/services'
import { brandIcon } from '@/data/stack'
import HomeCard from './HomeCard'
import WheelRow from './WheelRow'

/** Kraft's logo stack (KraftScreens.dc.html:1082-1093): overlapped at rest, fanned when its service is hovered. */
const LOGO_POSE = [
  'z-9 group-hover/svc:[transform:translateY(-5px)_rotate(-8deg)_scale(1.1)]',
  'z-8 -ml-[11px] delay-45 group-hover/svc:ml-[3px] group-hover/svc:[transform:translateY(-5px)_rotate(0deg)_scale(1.1)]',
  'z-7 -ml-[11px] delay-90 group-hover/svc:ml-[3px] group-hover/svc:[transform:translateY(-5px)_rotate(8deg)_scale(1.1)]',
]

export default function ServicesCard() {
  const c = home.cards.services
  const total = String(SERVICES.length).padStart(2, '0')
  return (
    <HomeCard title={c.title} icon={StackIcon} meta={total} href={c.href} className="min-w-[240px] flex-[1_1_290px] gap-3 p-5">
      <div className="flex items-center gap-2 font-mono text-[9.5px] tracking-[.14em] text-ink3">
        {c.hint} <ArrowRightIcon size={12} aria-hidden className="text-accent" />
      </div>
      <WheelRow className="-mx-1 flex snap-x snap-proximity gap-2.5 overflow-x-auto overscroll-x-contain scroll-smooth px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SERVICES.map((s) => (
          <div
            key={s.n}
            className="group/svc flex flex-[0_0_176px] snap-start flex-col gap-[9px] rounded-[15px] border border-b1 bg-s0 p-[13px] transition-colors duration-300 hover:border-b2 hover:bg-hover"
          >
            <div className="flex items-center gap-2">
              <div aria-hidden className="flex shrink-0 items-center py-[3px]">
                {s.logos.map((l, li) => (
                  <span
                    key={`${l.slug}-${li}`}
                    className={`relative grid size-[27px] shrink-0 place-items-center rounded-[9px] bg-logo-chip shadow-(--logo-shadow) transition-[transform,margin-left] duration-380 ease-[cubic-bezier(.2,.8,.2,1)] ${LOGO_POSE[li]}`}
                  >
                    <Image src={brandIcon(l.slug)} alt="" width={15} height={15} className="block" />
                  </span>
                ))}
              </div>
              <span className="ml-auto font-mono text-[9.5px] text-ink3">
                {s.n} / {total}
              </span>
            </div>
            <span className="text-[12.5px] leading-[1.3] font-semibold tracking-[-.01em] text-ink-soft">{s.name}</span>
            <span className="text-[11px] leading-[1.45] text-ink3">{s.line}</span>
            <span className="mt-auto self-start rounded-[7px] border border-wash-b bg-wash px-2 py-1 font-mono text-[8.5px] tracking-[.1em] text-accent">
              {s.badge}
            </span>
          </div>
        ))}
      </WheelRow>
    </HomeCard>
  )
}
```

Create `components/home/TestimonialsCard.tsx`:

```tsx
import { QuotesIcon } from '@phosphor-icons/react/ssr'
import { home } from '@/data/home'
import { CLIENTS } from '@/data/testimonials'
import HomeCard from './HomeCard'

export default function TestimonialsCard() {
  const c = home.cards.testimonials
  return (
    <HomeCard title={c.title} icon={QuotesIcon} meta={c.meta} href={c.href} className="min-w-[250px] flex-[2_1_380px] gap-[13px] p-5">
      <ul className="flex flex-col gap-[9px]">
        {CLIENTS.map((cl) => (
          <li key={cl.n} className="flex items-center gap-3 rounded-[13px] border border-b1 bg-s0 px-3.5 py-3">
            <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-[9px] border border-b1 bg-s3 font-mono text-[9.5px] text-ink3">
              {cl.n}
            </span>
            <div className="flex min-w-0 flex-col gap-[3px]">
              <span className="truncate text-[13px] font-semibold text-ink-soft">{cl.name}</span>
              <span className="truncate font-mono text-[9.5px] tracking-[.05em] text-ink3">{cl.role}</span>
            </div>
            <span className="ml-auto max-w-[40%] truncate text-[11.5px] text-accent opacity-85">{cl.tag}</span>
          </li>
        ))}
      </ul>
    </HomeCard>
  )
}
```

Create `components/home/CredentialsCard.tsx`:

```tsx
import Image from 'next/image'
import { CheckCircleIcon, SealCheckIcon } from '@phosphor-icons/react/ssr'
import { CERTS } from '@/data/credentials'
import { home } from '@/data/home'
import HomeCard from './HomeCard'

export default function CredentialsCard() {
  const c = home.cards.credentials
  return (
    <HomeCard title={c.title} icon={SealCheckIcon} className="min-w-[220px] flex-[1_1_230px] gap-[13px] p-5">
      <p className="-mt-0.5 mb-0.5 text-[13px] leading-normal text-ink3">{c.body}</p>
      <div className="relative flex items-end justify-center rounded-[13px] border border-b1 bg-s0 px-3.5 pt-[26px] pb-[60px]">
        {CERTS.map((cert) => (
          <span key={cert.name} role="img" aria-label={cert.name} className="medal">
            <span aria-hidden className="medal-tail medal-tail--l" />
            <span aria-hidden className="medal-tail medal-tail--r" />
            <span aria-hidden className="medal-rosette" />
            <span aria-hidden className="medal-disc" />
            <Image src={cert.icon} alt="" width={32} height={32} className="relative z-3 block size-8 object-contain" />
            <span aria-hidden className="medal-pill">
              <CheckCircleIcon size={13} className="shrink-0 text-accent" />
              {cert.pill}
            </span>
          </span>
        ))}
      </div>
    </HomeCard>
  )
}
```

Modify `components/home/Bento.tsx`. Add row 3:

```tsx
import AboutCard from './AboutCard'
import CredentialsCard from './CredentialsCard'
import ProjectsCard from './ProjectsCard'
import ServicesCard from './ServicesCard'
import StackCard from './StackCard'
import TestimonialsCard from './TestimonialsCard'
import ToolsRow from './ToolsRow'

const ROW = 'flex flex-wrap gap-[clamp(11px,1.3cqw,18px)]'

/** Kraft's framed card grid (KraftScreens.dc.html:60-199). */
export default function Bento() {
  return (
    <div
      data-intro-hold
      data-intro-delay="220"
      className="bento flex flex-col gap-[clamp(11px,1.3cqw,18px)] rounded-[26px] border border-b1 p-[clamp(11px,1.3cqw,18px)]"
    >
      <ToolsRow />
      <div className={ROW}>
        <ProjectsCard />
        <AboutCard />
        <StackCard />
      </div>
      <div className={ROW}>
        <ServicesCard />
        <TestimonialsCard />
        <CredentialsCard />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run the tests to confirm they pass**

Run: `npx vitest run tests/wheel.test.ts tests/Bento.test.tsx`
Expected: PASS (6 + 10 tests).

- [ ] **Step 7: Add e2e coverage**

Append to `e2e/home.spec.ts`:

```ts
test('the wheel over the services row scrolls it sideways, then hands back to the page', async ({ page }) => {
  await page.goto('/')
  const panel = page.locator('#main-content')
  const row = page.locator('[data-wheel-x]')
  await row.scrollIntoViewIfNeeded()
  const box = (await row.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)

  const before = await panel.evaluate((el) => el.scrollTop)
  expect(before).toBeGreaterThan(0) // the row sits below the fold, so the page has room to scroll back up
  await page.mouse.wheel(0, 200)
  await expect.poll(() => row.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0)
  expect(await panel.evaluate((el) => el.scrollTop)).toBe(before)

  // At its start, an upward wheel belongs to the page again.
  await row.evaluate((el) => {
    el.style.scrollBehavior = 'auto'
    el.scrollLeft = 0
  })
  await expect
    .poll(async () => {
      await page.mouse.wheel(0, -200)
      return panel.evaluate((el) => el.scrollTop)
    })
    .toBeLessThan(before)
})
```

- [ ] **Step 8: Run the whole suite**

Run: `npm test && npm run typecheck && npm run lint && npm run e2e`
Expected: all green (105 unit, 37 e2e).

- [ ] **Step 9: Commit**

```bash
git add lib/wheel.ts hooks/useWheelToX.ts components/home app/globals.css tests/wheel.test.ts tests/Bento.test.tsx e2e/home.spec.ts
git commit -m "feat: Home Services, Testimonials and Credentials cards; wheel-to-sideways services row" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Intro engine: timing, geometry, hold and release

Nothing sets `data-intro` yet (Task 6 does), so the site behaves exactly as before this task.

**Files:**
- Create: `lib/intro.ts`
- Modify: `app/globals.css` (intro CSS), `components/shell/Sidebar.tsx`, `components/shell/TopBar.tsx`, `components/shell/TabBar.tsx`, `tests/Sidebar.test.tsx`, `tests/TabBar.test.tsx`
- Test: `tests/intro.test.ts`

**Interfaces:**
- Consumes: the `data-intro-hold` and `data-intro-delay` markers from Tasks 2–4
- Produces:
  - `INTRO = { igniteMs: 300, runMs: 1600, lockMs: 350, flyMs: 900, fontWaitMs: 1200, node: 40, canvasH: 96, nodeY: 34, canvasGap: 44, fallGap: 72 }`
  - `EASE = { out, spring, camera }` (cubic-bezier strings)
  - `easeInOutCubic(t: number): number`
  - `speedFor(desktop: boolean): number` (1 or 0.62)
  - `restPose({ vw, vh, width, height }): { scale: number; x: number; y: number }`
  - `nodeCentres(width: number, count: number, node: number): number[]`
  - `cablePath(x1: number, x2: number, y: number): string`
  - `whenFontsReady(timeoutMs: number): Promise<void>`
  - `introRequested(): boolean`
  - `holdIntro(): void`, `claimIntro(): void`, `releaseHead(): void`, `releasePage(animate = true): void`, `assemble(): void`
  - CSS: `.intro` (shown only while `html[data-intro-head]`), `.intro-skip` (visible only while `html[data-intro-live]`), and the `.intro-*` parts
  - Markers: `aside[data-intro-rail]` (Sidebar), `TopBar[data-intro-hold]`, `TabBar nav[data-intro-hold="bar"]`

- [ ] **Step 1: Write the failing tests**

Create `tests/intro.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cablePath,
  claimIntro,
  easeInOutCubic,
  holdIntro,
  introRequested,
  nodeCentres,
  releaseHead,
  releasePage,
  restPose,
  speedFor,
  whenFontsReady,
} from '@/lib/intro'

const html = () => document.documentElement

describe('intro geometry', () => {
  it('centres the scaled headline a little above the middle', () => {
    const p = restPose({ vw: 1440, vh: 900, width: 590, height: 127 })
    expect(p.scale).toBeCloseTo(2.099, 3)
    expect(p.x).toBeCloseTo(100.8, 1)
    expect(p.y).toBeCloseTo((900 - 127 * p.scale) / 2 - 81, 5)
  })

  it('never scales the headline past 2.6', () => {
    expect(restPose({ vw: 1440, vh: 900, width: 200, height: 60 }).scale).toBe(2.6)
  })

  it('spreads node centres edge to edge', () => {
    expect(nodeCentres(400, 4, 40)).toEqual([20, 140, 260, 380])
  })

  it('draws cables as flat beziers', () => {
    expect(cablePath(40, 120, 34)).toBe('M 40 34 C 80 34, 80 34, 120 34')
  })

  it('runs at two-thirds speed without the desktop shell', () => {
    expect(speedFor(true)).toBe(1)
    expect(speedFor(false)).toBe(0.62)
  })

  it('eases in and out symmetrically', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(0.5)).toBe(0.5)
    expect(easeInOutCubic(1)).toBe(1)
  })
})

describe('whenFontsReady', () => {
  afterEach(() => {
    vi.useRealTimers()
    delete (document as { fonts?: unknown }).fonts
  })

  it('resolves at once without a font API', async () => {
    await expect(whenFontsReady(1200)).resolves.toBeUndefined()
  })

  it('stops waiting for a stuck webfont after the timeout', async () => {
    vi.useFakeTimers()
    Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: new Promise(() => {}) } })
    let done = false
    void whenFontsReady(1200).then(() => {
      done = true
    })
    await vi.advanceTimersByTimeAsync(1199)
    expect(done).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(done).toBe(true)
  })
})

describe('intro hold and release', () => {
  let animate: ReturnType<typeof vi.fn>
  beforeEach(() => {
    animate = vi.fn()
    HTMLElement.prototype.animate = animate as unknown as HTMLElement['animate']
  })
  afterEach(() => {
    delete (HTMLElement.prototype as { animate?: unknown }).animate
    document.body.innerHTML = ''
  })

  it('reads the boot flag', () => {
    expect(introRequested()).toBe(false)
    holdIntro()
    expect(introRequested()).toBe(true)
  })

  it('deals the rail in row by row, then raises each held piece after its delay', () => {
    document.body.innerHTML =
      '<aside data-intro-rail><div></div><div></div></aside><p data-intro-hold data-intro-delay="60"></p><nav data-intro-hold="bar"></nav>'
    holdIntro()
    releasePage()
    expect(html().hasAttribute('data-intro')).toBe(false)
    const calls = animate.mock.calls as [Keyframe[], KeyframeAnimationOptions][]
    expect(calls.map(([, o]) => o.delay)).toEqual([40, 90, 60, 0])
    expect(calls[0][0][0].transform).toBe('translateX(-16px)')
    expect(calls[2][0][0].transform).toBe('translateY(14px)')
    expect(calls[3][0][0].transform).toBe('translateY(24px)')
    expect(calls.every(([, o]) => o.fill === 'backwards')).toBe(true)
  })

  it('can release without animating', () => {
    document.body.innerHTML = '<p data-intro-hold></p>'
    holdIntro()
    releasePage(false)
    expect(html().hasAttribute('data-intro')).toBe(false)
    expect(animate).not.toHaveBeenCalled()
  })

  it('does nothing when the page is not held', () => {
    document.body.innerHTML = '<p data-intro-hold></p>'
    releasePage()
    expect(animate).not.toHaveBeenCalled()
  })

  it('drops the headline hold and the claim together', () => {
    holdIntro()
    claimIntro()
    releaseHead()
    expect(html().hasAttribute('data-intro-head')).toBe(false)
    expect(html().hasAttribute('data-intro-live')).toBe(false)
    expect(html().hasAttribute('data-intro')).toBe(true)
  })
})
```

In `tests/Sidebar.test.tsx`, add inside the `describe` block:

```tsx
  it('is dealt back in row by row after the intro', () => {
    renderSidebar()
    expect(screen.getByRole('complementary', { name: 'Profile and site navigation' })).toHaveAttribute('data-intro-rail')
  })
```

In `tests/TabBar.test.tsx`, add inside the `describe` block:

```tsx
  it('rises back in after the intro', () => {
    render(
      <NavigationProvider>
        <TabBar />
      </NavigationProvider>,
    )
    expect(screen.getByRole('navigation', { name: 'Sections' })).toHaveAttribute('data-intro-hold', 'bar')
  })
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run tests/intro.test.ts tests/Sidebar.test.tsx tests/TabBar.test.tsx`
Expected: FAIL. `@/lib/intro` can't be resolved, and the Sidebar and TabBar markers are missing.

- [ ] **Step 3: Implement `lib/intro.ts`**

```ts
/**
 * The workflow intro (spec §8): kape's engine (IntroOverlay.tsx) with Kraft's
 * loader steps and tokens. The pure parts live here so they can be tested
 * without a layout engine; components/shell/IntroOverlay.tsx drives the DOM.
 *
 * Lifecycle attributes on <html>. lib/boot.ts sets the first two before first
 * paint on a full load of "/":
 *   data-intro       holds the page: [data-intro-hold] and [data-intro-rail] > *
 *   data-intro-head  holds the Home <h1> ([data-intro-target]) until the flying
 *                    copy has landed on it; the overlay is shown while it is set
 *   data-intro-live  the overlay has claimed the run, so the boot failsafe
 *                    leaves it alone
 *
 *   Ignition  nodes and cables draw in                        igniteMs
 *   Run       one progress value streams the cables, checks   runMs
 *             each node and mask-reveals the headline words
 *   Lock      the last node succeeds, status flips to done    lockMs
 *   Handoff   the canvas falls away, the headline flies onto  flyMs
 *             the real <h1> rect at scale 1
 */
export const INTRO = {
  igniteMs: 300,
  runMs: 1600,
  lockMs: 350,
  flyMs: 900,
  fontWaitMs: 1200,
  node: 40,
  canvasH: 96,
  nodeY: 34,
  canvasGap: 44,
  fallGap: 72,
} as const

export const EASE = {
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  camera: 'cubic-bezier(0.76, 0, 0.24, 1)',
} as const

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Phones get the same sequence at two-thirds speed: a thumb is waiting. */
export const speedFor = (desktop: boolean) => (desktop ? 1 : 0.62)

/** Where the headline waits: scaled up to 86% of the viewport (max 2.6x), centred, lifted a little. */
export function restPose({ vw, vh, width, height }: { vw: number; vh: number; width: number; height: number }) {
  const scale = Math.min((vw * 0.86) / width, 2.6)
  return {
    scale,
    x: (vw - width * scale) / 2,
    y: (vh - height * scale) / 2 - Math.min(96, vh * 0.09),
  }
}

/** Node centres across the canvas, first and last flush with its edges. */
export function nodeCentres(width: number, count: number, node: number): number[] {
  if (count < 2) return [width / 2]
  return Array.from({ length: count }, (_, i) => node / 2 + (i * (width - node)) / (count - 1))
}

/** The gentle n8n-style bezier between two ports on the same row. */
export function cablePath(x1: number, x2: number, y: number): string {
  const c = (x2 - x1) * 0.5
  return `M ${x1} ${y} C ${x1 + c} ${y}, ${x2 - c} ${y}, ${x2} ${y}`
}

/** Nothing moves until the webfont is in (a reflow mid-flight breaks the landing), but never wait longer than Kraft did. */
export function whenFontsReady(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const ready = document.fonts?.ready
    if (!ready) return resolve()
    const t = window.setTimeout(resolve, timeoutMs)
    const done = () => {
      window.clearTimeout(t)
      resolve()
    }
    ready.then(done, done)
  })
}

const root = () => document.documentElement

export const introRequested = () => root().hasAttribute('data-intro')

export function holdIntro() {
  root().setAttribute('data-intro', '')
  root().setAttribute('data-intro-head', '')
}

export function claimIntro() {
  root().setAttribute('data-intro-live', '')
}

export function releaseHead() {
  root().removeAttribute('data-intro-head')
  root().removeAttribute('data-intro-live')
}

/** Hand the page back. `animate` deals it in; false just shows it (teardown). */
export function releasePage(animate = true) {
  if (!introRequested()) return
  if (animate) assemble()
  root().removeAttribute('data-intro')
}

/**
 * kape's assembly (boot.css:230-290) as one-shot Web Animations, so no
 * permanent transitions are left on shell elements: the rail deals in row by
 * row from the left, everything else rises (the tab bar from further down).
 * fill:'backwards' keeps each piece hidden through its own delay.
 */
export function assemble() {
  document.querySelectorAll<HTMLElement>('[data-intro-rail] > *').forEach((el, i) => {
    el.animate?.([{ opacity: 0, transform: 'translateX(-16px)' }, { opacity: 1, transform: 'none' }], {
      duration: 700,
      delay: 40 + i * 50,
      easing: EASE.out,
      fill: 'backwards',
    })
  })
  document.querySelectorAll<HTMLElement>('[data-intro-hold]').forEach((el) => {
    const rise = el.dataset.introHold === 'bar' ? 24 : 14
    el.animate?.([{ opacity: 0, transform: `translateY(${rise}px)` }, { opacity: 1, transform: 'none' }], {
      duration: 760,
      delay: Number(el.dataset.introDelay ?? 0) || 0,
      easing: EASE.out,
      fill: 'backwards',
    })
  })
}
```

- [ ] **Step 4: Add the intro CSS and the shell markers**

Append to the end of `app/globals.css`:

```css
/* ---- Intro (kape IntroOverlay + boot.css, Kraft tokens; lib/intro.ts) ----
   lib/boot.ts sets data-intro and data-intro-head before first paint on a
   full load of "/". Held pieces are hidden with no transition; lib/intro.ts
   deals them back in with one-shot animations. The overlay paints no
   backdrop, so the contour shader drifts behind the whole sequence. */
html[data-intro] [data-intro-hold],
html[data-intro] [data-intro-rail] > *{opacity:0}
html[data-intro-head] [data-intro-target]{opacity:0}
.intro{display:none;position:fixed;inset:0;z-index:90;pointer-events:none}
html[data-intro-head] .intro{display:block}
.intro-skip{visibility:hidden}
html[data-intro-live] .intro-skip{visibility:visible}

/* The flying copy must be typographically identical to the Home <h1>
   (letter-spacing, line-height, weight); the font size is copied at run time. */
.intro-title,.intro-canvas{position:fixed;top:0;left:0;transform-origin:0 0;opacity:0;will-change:transform}
.intro-title{font-weight:700;letter-spacing:-.035em;line-height:1.02;color:var(--ink)}
.intro-line{display:flex;flex-wrap:wrap}
.intro-line--accent{color:var(--accent)}
/* Flex, not inline-block: a masked inline-block moves its baseline to its
   bottom margin edge and drops the line. 132% clears the padded mask box. */
.intro-word{display:block;overflow:hidden;padding:.2em 0 .08em;margin:-.2em 0 -.08em;white-space:pre}
.intro-word-in{display:block;transform:translateY(132%);will-change:transform}

.intro-cables{position:absolute;top:0;left:0;overflow:visible}
.intro-cable{fill:none;stroke:var(--b2);stroke-width:2;stroke-linecap:round;opacity:0}
.intro-cable--live{stroke:var(--accent);opacity:1;filter:drop-shadow(0 0 4px var(--glow))}
.intro-node{position:absolute;width:40px;opacity:0}
.intro-node-card{position:relative;display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:var(--s1);border:1.5px solid var(--b1);color:var(--ink3);transition:border-color .26s,background-color .26s,color .26s}
.intro-node--trigger .intro-node-card{border-radius:20px 12px 12px 20px}
.intro-node.is-done .intro-node-card{border-color:var(--accent);background:var(--wash);color:var(--accent)}
.intro-port{position:absolute;top:50%;width:7px;height:7px;border-radius:50%;background:var(--s1);border:1.5px solid var(--b2);transform:translateY(-50%)}
.intro-port--in{left:-5px}
.intro-port--out{right:-5px}
.intro-node--trigger .intro-port--in,.intro-node--last .intro-port--out{display:none}
.intro-node.is-done .intro-port{border-color:var(--accent)}
.intro-check{position:absolute;top:-6px;right:-6px;display:grid;place-items:center;width:15px;height:15px;border-radius:50%;background:var(--accent);color:var(--onAccent);box-shadow:0 0 0 2px var(--bg);opacity:0;transform:scale(.3)}
.intro-label{position:absolute;top:46px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:8.5px;font-weight:600;letter-spacing:-.01em;color:var(--ink3);transition:color .4s}
.intro-node.is-done .intro-label{color:var(--ink)}
.intro-dot{position:absolute;top:0;left:0;width:8px;height:8px;margin:-4px 0 0 -4px;will-change:transform}
.intro-dot-core{display:block;width:100%;height:100%;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px var(--wash),0 0 12px 2px var(--glow);opacity:0}
.intro-status{position:absolute;left:0;top:82px;display:inline-flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:7.5px;letter-spacing:.1em;color:var(--accent);opacity:0}
.intro-status-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px var(--glow);animation:kPulse 1.6s ease-in-out infinite}
.intro-status.is-done .intro-status-dot{animation:none}
```

In `components/shell/Sidebar.tsx`, add `data-intro-rail` to the `<aside>`:

```tsx
    <aside
      aria-label="Profile and site navigation"
      data-intro-rail
      className="hidden w-(--rail) shrink-0 flex-col gap-[18px] overflow-y-auto border-r border-b1 bg-linear-to-b from-s1 to-bg px-4 pt-5 pb-4 shell:flex"
    >
```

In `components/shell/TopBar.tsx`, add `data-intro-hold` to the root `<div>`:

```tsx
    <div
      data-intro-hold
      className="sticky top-0 z-5 hidden items-center gap-3.5 bg-linear-to-b from-fade-a via-fade-b via-65% to-transparent py-4 backdrop-blur-[8px] shell:flex"
    >
```

In `components/shell/TabBar.tsx`, add `data-intro-hold="bar"` to the `<nav>`:

```tsx
    <nav
      aria-label="Sections"
      data-intro-hold="bar"
      className="fixed inset-x-0 bottom-0 z-30 flex items-end justify-between gap-0.5 border-t border-b1 bg-nav px-3 pt-2.5 pb-[max(18px,env(safe-area-inset-bottom))] shell:hidden"
    >
```

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `npx vitest run tests/intro.test.ts tests/Sidebar.test.tsx tests/TabBar.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run the whole suite**

Run: `npm test && npm run typecheck && npm run lint && npm run e2e`
Expected: all green, and e2e unchanged (37). Nothing sets `data-intro` yet.

- [ ] **Step 7: Commit**

```bash
git add lib/intro.ts app/globals.css components/shell/Sidebar.tsx components/shell/TopBar.tsx components/shell/TabBar.tsx tests/intro.test.ts tests/Sidebar.test.tsx tests/TabBar.test.tsx
git commit -m "feat: intro engine (timing, geometry, hold and release) and shell hold markers" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: The intro overlay, the boot decision and the headline flight

**Files:**
- Create: `components/shell/IntroOverlay.tsx`, `e2e/helpers.ts`, `e2e/intro.spec.ts`
- Modify: `lib/boot.ts`, `app/(site)/layout.tsx`, `tests/boot.test.ts`, `e2e/phone.spec.ts`, `e2e/scroll.spec.ts`, `e2e/home.spec.ts`
- Test: `tests/boot.test.ts`, `e2e/intro.spec.ts`, `e2e/phone.spec.ts`

**Interfaces:**
- Consumes: everything in `lib/intro.ts` (Task 5), `home.headline` and `home.intro` (Task 1), `[data-intro-target]` (Task 2), `scrollToTop` / `PANEL_ID` from `lib/scroller.ts`, and `SHELL_MIN_QUERY` from `lib/breakpoints.ts`
- Produces:
  - `bootScript` sets `data-intro` and `data-intro-head` on a full load of `/` when motion is allowed. It also arms a 9s failsafe (`INTRO_FAILSAFE_MS`) that stands down when `data-intro-live` is set.
  - `<IntroOverlay/>` renders `div.intro[data-intro-overlay]` containing `.intro-title`, `.intro-canvas` and `button.intro-skip` (name "Skip intro").
  - `e2e/helpers.ts`: `settleIntro(page)` and `headlineLanding(page)`, which returns `{ dx, dy, scale, sameSize }`.

- [ ] **Step 1: Write the failing boot tests**

In `tests/boot.test.ts`, change the first import line to `import { afterEach, describe, expect, it, vi } from 'vitest'`. Then append this new `describe` block at the end of the file:

```ts
describe('bootScript intro decision (spec §8)', () => {
  afterEach(() => {
    vi.useRealTimers()
    window.history.replaceState(null, '', '/')
  })

  it('holds the page for the intro on a full load of Home', () => {
    run()
    expect(html().hasAttribute('data-intro')).toBe(true)
    expect(html().hasAttribute('data-intro-head')).toBe(true)
  })

  it('does not hold any other route', () => {
    window.history.replaceState(null, '', '/about')
    run()
    expect(html().hasAttribute('data-intro')).toBe(false)
  })

  it('skips the intro with reduced motion', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    run()
    expect(html().hasAttribute('data-intro')).toBe(false)
  })

  it("skips the intro when the access menu's motion switch is off", () => {
    localStorage.setItem(A11Y_KEY, JSON.stringify({ text: 'md', contrast: false, motion: true, links: false }))
    run()
    expect(html().hasAttribute('data-intro')).toBe(false)
  })

  it('hands the page back after 9s if the intro never starts', () => {
    vi.useFakeTimers()
    run()
    vi.advanceTimersByTime(8999)
    expect(html().hasAttribute('data-intro')).toBe(true)
    vi.advanceTimersByTime(1)
    expect(html().hasAttribute('data-intro')).toBe(false)
    expect(html().hasAttribute('data-intro-head')).toBe(false)
  })

  it('leaves a claimed intro alone', () => {
    vi.useFakeTimers()
    run()
    html().setAttribute('data-intro-live', '')
    vi.advanceTimersByTime(9000)
    expect(html().hasAttribute('data-intro')).toBe(true)
  })
})
```

- [ ] **Step 2: Run them to confirm they fail**

Run: `npx vitest run tests/boot.test.ts`
Expected: FAIL. `holds the page…`, `hands the page back…` and `leaves a claimed intro alone` fail because `data-intro` is never set. The three "does not hold / skips" tests pass already.

- [ ] **Step 3: Add the intro decision to the boot script**

Replace `lib/boot.ts`:

```ts
import { A11Y_KEY, PERF_KEY, THEME_KEY } from './storage-keys'

/** The page is handed back after this long if the intro never claims the run (JS slow or broken). */
export const INTRO_FAILSAFE_MS = 9000

/**
 * Runs inline in <head> before first paint, so the page is never drawn in the
 * wrong theme, a downgraded visitor never sees the expensive layers flash, and
 * a11y switches apply from the first frame. Plain ES5, no imports.
 *
 * Theme rule (spec §7): a stored explicit choice wins, otherwise follow the
 * device. Kraft's :root is the dark palette, so dark is the fallback.
 *
 * Intro rule (spec §8): a full load of "/" with motion allowed holds the page
 * (data-intro, data-intro-head) for components/shell/IntroOverlay.tsx. Client
 * navigation never runs this script, so returning to Home never replays it.
 */
export const bootScript = `(function(){var d=document.documentElement;d.setAttribute('data-js','');var t=null;try{t=localStorage.getItem(${JSON.stringify(THEME_KEY)})}catch(e){}var light=false;try{light=!!(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches)}catch(e){}d.setAttribute('data-theme',t==='light'||t==='dark'?t:(light?'light':'dark'));try{var p=sessionStorage.getItem(${JSON.stringify(PERF_KEY)});if(p==='mid'||p==='low')d.setAttribute('data-perf',p)}catch(e){}try{var a=JSON.parse(localStorage.getItem(${JSON.stringify(A11Y_KEY)})||'null');if(a){if(a.text==='lg'||a.text==='xl')d.setAttribute('data-a11y-text',a.text);if(a.contrast)d.setAttribute('data-a11y-contrast','true');if(a.motion)d.setAttribute('data-a11y-motion','true');if(a.links)d.setAttribute('data-a11y-links','true')}}catch(e){}try{var rm=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);if(location.pathname==='/'&&!rm&&d.getAttribute('data-a11y-motion')!=='true'){d.setAttribute('data-intro','');d.setAttribute('data-intro-head','');setTimeout(function(){if(d.hasAttribute('data-intro-live'))return;d.removeAttribute('data-intro');d.removeAttribute('data-intro-head')},${INTRO_FAILSAFE_MS})}}catch(e){}})();`
```

Run: `npx vitest run tests/boot.test.ts`
Expected: PASS (all boot tests).

- [ ] **Step 4: Build the overlay**

Create `components/shell/IntroOverlay.tsx`:

```tsx
'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { ArrowRightIcon, CheckIcon } from '@phosphor-icons/react/ssr'
import { home } from '@/data/home'
import { SHELL_MIN_QUERY } from '@/lib/breakpoints'
import {
  cablePath,
  claimIntro,
  EASE,
  easeInOutCubic,
  holdIntro,
  INTRO,
  introRequested,
  nodeCentres,
  releaseHead,
  releasePage,
  restPose,
  speedFor,
  whenFontsReady,
} from '@/lib/intro'
import { PANEL_ID, scrollToTop } from '@/lib/scroller'

const WORDS = home.headline.map((line) => line.split(' '))
const STEPS = home.intro.steps
const SVG_NS = 'http://www.w3.org/2000/svg'

// Decided once per page load from what the boot script set before first
// paint. StrictMode's dev remount re-reads this, not the (released) DOM.
let pending: boolean | null = null

/**
 * "The workflow writes the line" (spec §8): kape's IntroOverlay engine, Kraft's
 * loader steps and tokens. Web Animations for the keyframed parts and one rAF
 * loop for the progress-driven run; transform, opacity and stroke only.
 * The overlay is always in the DOM and shown by CSS only while
 * html[data-intro-head] is set (lib/intro.ts has the lifecycle).
 */
export default function IntroOverlay() {
  const pathname = usePathname()
  const overlayRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const dotRef = useRef<HTMLElement>(null)
  const dotCoreRef = useRef<HTMLElement>(null)
  const statusRef = useRef<HTMLSpanElement>(null)
  const statusTextRef = useRef<HTMLSpanElement>(null)
  const skipRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (pending === null) pending = introRequested()
    if (!pending) return
    holdIntro() // re-assert after a StrictMode remount released it
    claimIntro()

    const overlay = overlayRef.current
    const title = titleRef.current
    const canvas = canvasRef.current
    const svg = svgRef.current
    const dot = dotRef.current
    const dotCore = dotCoreRef.current
    const status = statusRef.current
    const statusText = statusTextRef.current
    if (!overlay || !title || !canvas || !svg || !dot || !dotCore || !status || !statusText) {
      pending = false
      releasePage(false)
      releaseHead()
      return
    }

    let cancelled = false
    let raf = 0
    const timers: number[] = []
    const anims: Animation[] = []
    const wait = (ms: number) => new Promise<void>((res) => void timers.push(window.setTimeout(res, ms)))
    const play = (el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
      const a = el.animate(frames, { fill: 'both', ...opts })
      anims.push(a)
      return a
    }
    const stop = () => {
      cancelled = true
      cancelAnimationFrame(raf)
      timers.forEach((t) => window.clearTimeout(t))
    }

    const startWidth = window.innerWidth
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip()
    }
    const onResize = () => {
      if (window.innerWidth !== startWidth) skip()
    }
    const done = () => {
      const hadFocus = overlay.contains(document.activeElement)
      pending = false
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
      releasePage()
      releaseHead()
      // The Skip button just vanished; don't strand keyboard focus on <body>.
      if (hadFocus) document.getElementById(PANEL_ID)?.focus({ preventScroll: true })
    }
    const skip = () => {
      if (!pending) return
      stop()
      anims.forEach((a) => a.cancel())
      done()
    }
    skipRef.current = skip
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)

    const run = async () => {
      await whenFontsReady(INTRO.fontWaitMs)
      if (cancelled) return
      const target = document.querySelector<HTMLElement>('[data-intro-target]')
      if (!target) return skip()
      scrollToTop({ smooth: false }) // a phone reload may restore a scrolled position

      const k = speedFor(window.matchMedia(SHELL_MIN_QUERY).matches)
      const IGNITE = INTRO.igniteMs * k
      const RUN = INTRO.runMs * k
      const LOCK = INTRO.lockMs * k
      const FLY = INTRO.flyMs * k

      // Same face, size and measure as the real headline, so scale 1 IS the landing.
      // offsetWidth ignores the page's rise-in transform; +1 absorbs sub-pixel rounding.
      title.style.fontSize = getComputedStyle(target).fontSize
      const width = target.offsetWidth + 1
      const height = target.offsetHeight
      title.style.width = `${width}px`
      canvas.style.width = `${width}px`
      canvas.style.height = `${INTRO.canvasH}px`

      const pose = restPose({ vw: window.innerWidth, vh: window.innerHeight, width, height })
      const rest = `translate(${pose.x}px, ${pose.y}px) scale(${pose.scale})`
      const below = (gap: number) => `translate(${pose.x}px, ${pose.y + (height + gap) * pose.scale}px) scale(${pose.scale})`
      title.style.transform = rest
      canvas.style.transform = below(INTRO.canvasGap)
      title.style.opacity = '1'
      canvas.style.opacity = '1'

      // Nodes on the design canvas; the run travels from the first centre to the last.
      const nodes = Array.from(canvas.querySelectorAll<HTMLElement>('.intro-node'))
      nodes.forEach((el) => el.classList.remove('is-done'))
      status.classList.remove('is-done')
      statusText.textContent = home.intro.running
      const xs = nodeCentres(width, nodes.length, INTRO.node)
      nodes.forEach((el, i) => {
        el.style.left = `${xs[i] - INTRO.node / 2}px`
        el.style.top = `${INTRO.nodeY - INTRO.node / 2}px`
      })

      // Cables: a grey base per gap, and an accent path on top whose dashoffset the run pays out.
      svg.setAttribute('viewBox', `0 0 ${width} ${INTRO.canvasH}`)
      svg.setAttribute('width', String(width))
      svg.setAttribute('height', String(INTRO.canvasH))
      svg.replaceChildren()
      const cables: { live: SVGPathElement; len: number; from: number; to: number }[] = []
      for (let i = 0; i < nodes.length - 1; i++) {
        const from = xs[i] + INTRO.node / 2
        const to = xs[i + 1] - INTRO.node / 2
        const d = cablePath(from, to, INTRO.nodeY)
        const base = document.createElementNS(SVG_NS, 'path')
        base.setAttribute('d', d)
        base.setAttribute('class', 'intro-cable')
        const live = document.createElementNS(SVG_NS, 'path')
        live.setAttribute('d', d)
        live.setAttribute('class', 'intro-cable intro-cable--live')
        svg.append(base, live)
        const len = live.getTotalLength()
        live.style.strokeDasharray = `${len}`
        live.style.strokeDashoffset = `${len}`
        cables.push({ live, len, from, to })
        play(base, [{ opacity: 0 }, { opacity: 1 }], { duration: 420, delay: 90 + i * 70, easing: EASE.out })
      }

      // Words: flex swallows literal spaces, so each line's gap is one measured space.
      const firstLine = title.querySelector<HTMLElement>('.intro-line')
      const probe = document.createElement('span')
      probe.className = 'intro-word'
      probe.textContent = ' '
      firstLine?.append(probe)
      const space = probe.getBoundingClientRect().width / pose.scale
      probe.remove()
      title.querySelectorAll<HTMLElement>('.intro-line').forEach((l) => {
        l.style.columnGap = `${space}px`
      })
      const inners = Array.from(title.querySelectorAll<HTMLElement>('.intro-word-in'))
      const gates = inners.map((el, i) => ({ el, at: i / inners.length, done: false }))

      // ---- Ignition ----
      nodes.forEach((el, i) =>
        play(el, [{ opacity: 0, transform: 'translateY(8px) scale(.86)' }, { opacity: 1, transform: 'none' }], {
          duration: 520,
          delay: i * 70,
          easing: EASE.spring,
        }),
      )
      play(dotCore, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1)' }], {
        duration: 320,
        delay: 200,
        easing: EASE.spring,
      })
      play(status, [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], {
        duration: 420,
        delay: 160,
        easing: EASE.out,
      })
      await wait(IGNITE)
      if (cancelled) return

      // ---- Run: one progress value drives cables, dot, nodes and words ----
      const x0 = xs[0]
      const x1 = xs[xs.length - 1]
      const nodeAt = xs.map((x) => (x - x0) / (x1 - x0))
      const succeeded = nodes.map(() => false)
      const succeed = (i: number) => {
        succeeded[i] = true
        const el = nodes[i]
        el.classList.add('is-done')
        const check = el.querySelector('.intro-check')
        if (check) play(check, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 460, easing: EASE.spring })
        const card = el.querySelector('.intro-node-card')
        if (card) play(card, [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 420, easing: EASE.out })
      }
      succeed(0)
      await new Promise<void>((resolve) => {
        const start = performance.now()
        const step = (now: number) => {
          if (cancelled) return resolve()
          const raw = Math.min(1, (now - start) / RUN)
          const p = easeInOutCubic(raw)
          const x = x0 + p * (x1 - x0)
          dot.style.transform = `translate3d(${x}px, ${INTRO.nodeY}px, 0)`
          for (const c of cables) {
            const f = Math.min(1, Math.max(0, (x - c.from) / (c.to - c.from)))
            c.live.style.strokeDashoffset = `${c.len * (1 - f)}`
          }
          for (let i = 1; i < nodes.length - 1; i++) if (!succeeded[i] && p >= nodeAt[i]) succeed(i)
          for (const g of gates) {
            if (!g.done && p >= g.at) {
              g.done = true
              play(g.el, [{ transform: 'translateY(132%)' }, { transform: 'translateY(0)' }], { duration: 760, easing: EASE.out })
            }
          }
          if (raw < 1) raf = requestAnimationFrame(step)
          else resolve()
        }
        raf = requestAnimationFrame(step)
      })
      if (cancelled) return

      // ---- Lock ----
      play(dotCore, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'linear' })
      succeed(nodes.length - 1)
      status.classList.add('is-done')
      statusText.textContent = home.intro.done
      await wait(LOCK)
      if (cancelled) return

      // ---- Handoff: the canvas falls away, the headline flies home ----
      // Measured now, not at the start: the page's rise-in has long finished.
      const t = target.getBoundingClientRect()
      const landing = `translate(${t.left}px, ${t.top}px) scale(1)`
      play(canvas, [{ transform: below(INTRO.canvasGap), opacity: 1 }, { transform: below(INTRO.fallGap), opacity: 0 }], {
        duration: 420,
        easing: EASE.out,
      })
      const fly = play(title, [{ transform: rest }, { transform: landing }], { duration: FLY, easing: EASE.camera })
      const accent = title.querySelector('.intro-line--accent')
      if (accent) {
        // Kraft's loader: the accent line settles to ink as it lands.
        const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()
        play(accent, [{ color: getComputedStyle(accent).color }, { color: ink }], { duration: FLY * 0.7, easing: 'linear' })
      }
      await wait(FLY - 150)
      if (cancelled) return
      releasePage()
      await wait(150)
      if (cancelled) return
      // Commit the landing, so the resting pose stays readable once the overlay hides.
      title.style.transform = landing
      fly.cancel()
      done()
    }

    void run().catch(skip)

    return () => {
      stop()
      anims.forEach((a) => a.cancel())
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
      skipRef.current = () => {}
      // Never leave the page hidden. `pending` stays as it was, so a StrictMode remount replays.
      releasePage(false)
      releaseHead()
    }
  }, [])

  // Leaving Home mid-intro (sidebar, ⌘K, a card, Back) ends it at once.
  useEffect(() => {
    if (pathname !== '/') skipRef.current()
  }, [pathname])

  return (
    <div ref={overlayRef} className="intro" data-intro-overlay>
      <div ref={titleRef} className="intro-title" aria-hidden>
        {WORDS.map((words, li) => (
          <span key={li} className={`intro-line${li === WORDS.length - 1 ? ' intro-line--accent' : ''}`}>
            {words.map((w, wi) => (
              <span key={wi} className="intro-word">
                <span className="intro-word-in">{w}</span>
              </span>
            ))}
          </span>
        ))}
      </div>

      <div ref={canvasRef} className="intro-canvas" aria-hidden>
        <svg ref={svgRef} className="intro-cables" />
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const cls = `intro-node${i === 0 ? ' intro-node--trigger' : ''}${i === STEPS.length - 1 ? ' intro-node--last' : ''}`
          return (
            <span key={s.label} className={cls}>
              <span className="intro-node-card">
                <Icon size={18} />
                <span className="intro-check">
                  <CheckIcon size={9} weight="bold" />
                </span>
                <i className="intro-port intro-port--in" />
                <i className="intro-port intro-port--out" />
              </span>
              <span className="intro-label">{s.label}</span>
            </span>
          )
        })}
        <i ref={dotRef} className="intro-dot">
          <i ref={dotCoreRef} className="intro-dot-core" />
        </i>
        <span ref={statusRef} className="intro-status">
          <i className="intro-status-dot" />
          <span ref={statusTextRef}>{home.intro.running}</span>
        </span>
      </div>

      <button
        type="button"
        aria-label="Skip intro"
        onClick={() => skipRef.current()}
        className="intro-skip pointer-events-auto fixed right-[clamp(18px,4vw,44px)] bottom-[clamp(18px,4vw,40px)] flex min-h-10 cursor-pointer items-center gap-2 rounded-[11px] border border-b1 bg-s2 px-4 py-2.5 text-[12.5px] text-ink3 hover:border-b2 hover:text-ink2"
      >
        {home.intro.skip} <ArrowRightIcon size={14} aria-hidden />
      </button>
    </div>
  )
}
```

In `app/(site)/layout.tsx`, add `import IntroOverlay from '@/components/shell/IntroOverlay'` and render `<IntroOverlay />` straight after the skip link:

```tsx
      <a href={`#${PANEL_ID}`} className="skip-link">
        Skip to main content
      </a>
      <IntroOverlay />
      <BackgroundGate />
```

- [ ] **Step 5: Write the intro e2e tests**

Create `e2e/helpers.ts`:

```ts
import type { Page } from '@playwright/test'

/** Resolves once the intro has handed the page back (at once when there was no intro). */
export async function settleIntro(page: Page) {
  await page.waitForFunction(() => !document.documentElement.hasAttribute('data-intro-head'), null, { timeout: 12_000 })
}

/** How far the flying headline's resting pose is from the real <h1>. */
export function headlineLanding(page: Page) {
  return page.evaluate(() => {
    const title = document.querySelector<HTMLElement>('.intro-title')!
    const h1 = document.querySelector<HTMLElement>('[data-intro-target]')!
    const m = new DOMMatrix(getComputedStyle(title).transform)
    const b = h1.getBoundingClientRect()
    return {
      dx: Math.abs(m.e - b.left),
      dy: Math.abs(m.f - b.top),
      scale: m.a,
      sameSize: getComputedStyle(title).fontSize === getComputedStyle(h1).fontSize,
    }
  })
}
```

Create `e2e/intro.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { headlineLanding, settleIntro } from './helpers'

const sidebarNav = (page: import('@playwright/test').Page) =>
  page.getByRole('complementary', { name: 'Profile and site navigation' }).getByRole('navigation', { name: 'Sections' })

test('plays on a full load of Home, then hands the page back', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Skip intro' })).toBeVisible()
  await expect(page.locator('.intro-title')).toHaveCSS('opacity', '1')
  await settleIntro(page)
  await expect(page.locator('[data-intro-overlay]')).toBeHidden()
  await expect(page.locator('[data-intro-target]')).toHaveCSS('opacity', '1')
  await expect(page.locator('[data-intro-rail] > *').first()).toHaveCSS('opacity', '1')
  await expect(page.locator('.bento')).toHaveCSS('opacity', '1')
})

test('the flying headline lands exactly on the Home h1', async ({ page }) => {
  await page.goto('/')
  await settleIntro(page)
  const r = await headlineLanding(page)
  expect(r.dx).toBeLessThan(1)
  expect(r.dy).toBeLessThan(1)
  expect(r.scale).toBeCloseTo(1, 5)
  expect(r.sameSize).toBe(true)
})

test('Skip ends it at once and moves focus to the page', async ({ page }) => {
  await page.goto('/')
  const skip = page.getByRole('button', { name: 'Skip intro' })
  await expect(skip).toBeVisible()
  await skip.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).not.toHaveAttribute('data-intro-head')
  await expect(page.locator('[data-intro-overlay]')).toBeHidden()
  await expect(page.locator('#main-content')).toBeFocused()
})

test('Escape skips it', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Skip intro' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('html')).not.toHaveAttribute('data-intro-head')
})

test('does not play on other routes', async ({ page }) => {
  await page.goto('/about')
  await expect(page.locator('html')).not.toHaveAttribute('data-intro')
  await expect(page.locator('[data-intro-overlay]')).toBeHidden()
})

test('does not play when navigating back to Home inside the site', async ({ page }) => {
  await page.goto('/about')
  await sidebarNav(page).getByRole('link', { name: /^Home/ }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('html')).not.toHaveAttribute('data-intro')
  await expect(page.locator('[data-intro-overlay]')).toBeHidden()
})

test('navigating away during the intro hands the page back', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Skip intro' })).toBeVisible()
  await sidebarNav(page).getByRole('link', { name: /^About/ }).click()
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.locator('html')).not.toHaveAttribute('data-intro')
  await expect(page.locator('html')).not.toHaveAttribute('data-intro-head')
  await expect(page.locator('[data-panel-content]')).toHaveCSS('opacity', '1')
  await expect(page.locator('[data-intro-rail] > *').first()).toHaveCSS('opacity', '1')
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('never holds the page', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).not.toHaveAttribute('data-intro')
    await expect(page.locator('[data-intro-target]')).toHaveCSS('opacity', '1')
  })
})
```

Append to `e2e/phone.spec.ts`. Also add `import { headlineLanding, settleIntro } from './helpers'` at the top.

```ts
test('phone: the intro lands exactly on the Home h1', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Skip intro' })).toBeVisible()
  await settleIntro(page)
  const r = await headlineLanding(page)
  expect(r.dx).toBeLessThan(1)
  expect(r.dy).toBeLessThan(1)
  expect(r.sameSize).toBe(true)
  await expect(page.getByRole('navigation', { name: 'Sections' })).toHaveCSS('opacity', '1')
})
```

Tests that scroll the page on `/` would race the run's scroll reset, so they must wait for the intro first:
- In `e2e/phone.spec.ts`, `phone: the document scrolls (no inner panel)`: add `await settleIntro(page)` straight after its `await page.goto('/')`.
- In `e2e/scroll.spec.ts`: add `import { settleIntro } from './helpers'`, then add `await settleIntro(page)` straight after `await page.goto('/')` in `Lenis drives the panel on desktop and the wheel scrolls it`.
- In `e2e/home.spec.ts`: add `import { settleIntro } from './helpers'`, then add `await settleIntro(page)` straight after `await page.goto('/')` in `the wheel over the services row scrolls it sideways, then hands back to the page`.

- [ ] **Step 6: Run everything**

Run: `npm test && npm run typecheck && npm run lint && npm run e2e`
Expected: all green, with 126 unit tests and 46 e2e tests.

If a pre-existing spec fails **only** because the intro was still running when it acted, add `await settleIntro(page)` right after that test's `goto('/')`, and record it in the ledger (`Task 6: Ruling: settled intro in <spec>:<test> — …`). Any other failure is a bug, so use superpowers:systematic-debugging.

- [ ] **Step 7: Commit**

```bash
git add components/shell/IntroOverlay.tsx lib/boot.ts "app/(site)/layout.tsx" tests/boot.test.ts e2e/helpers.ts e2e/intro.spec.ts e2e/phone.spec.ts e2e/scroll.spec.ts e2e/home.spec.ts
git commit -m "feat: workflow intro with Kraft's loader steps and exact headline flight onto Home" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Screenshot review, keyboard and reduced-motion passes

**Files:**
- Modify: `e2e/screenshots.spec.ts`, plus any Home component where the screenshot review finds a difference from Kraft

**Interfaces:**
- Consumes: everything above
- Produces: Phase 2, verified against Kraft in both themes at both sizes

- [ ] **Step 1: Let the screenshots wait for the intro**

In `e2e/screenshots.spec.ts`, add `import { settleIntro } from './helpers'`. In the app capture loop, replace `await page.waitForTimeout(2500)` with:

```ts
          await settleIntro(page)
          await page.waitForTimeout(1500) // the assembly and the contour fade-in
```

- [ ] **Step 2: Capture**

Run: `npm run shots`
Expected: 2 passed. The captures land in `test-results/shots/` (`app-home-{dark,light}-{desktop,phone}.png` and `kraft-{dark,light}-{desktop,phone}.png`).

- [ ] **Step 3: Compare Home with Kraft, side by side**

Open each pair with the Read tool: `app-home-dark-desktop.png` against `kraft-dark-desktop.png`, and so on for all four. Check:
- hero type size, weight and wrap
- lede width
- button heights and radii
- bento frame gradient
- card order, flex proportions, radii, borders and paddings
- icon tiles
- mono meta
- tools marquee mask
- arc fan
- GIF crop
- stack chips and dots
- service mini-cards and logo chips
- testimonial rows
- medals and ribbons

In light theme, confirm nothing uses a dark-only colour. Fix every difference in the component or CSS it belongs to. Re-run `npm run shots` until the pairs match. Record each fix in the ledger as a ruling if it deviates from the code in this plan.

The stats row (spec §8, not in Kraft) has no Kraft reference. Judge it against the tools tile beside it: same surface, border and mono label treatment.

- [ ] **Step 4: Keyboard pass**

Load `/` in the Playwright browser (MCP tools or a scratch script).
- Press Tab from the top: first "Skip to main content", then **Skip intro** while the intro runs.
- Press Enter on Skip intro: focus lands on `#main-content`.
- Keep tabbing: hero actions → Projects card → About card → Services card → Testimonials card. Each shows a visible focus ring. Focusing the Projects card also fans the arc (`a:focus-visible .arc-card`).
- Stack and Credentials are not focusable, because they are not links.

- [ ] **Step 5: Reduced-motion pass**

Emulate `reducedMotion: 'reduce'` and load `/`:
- No intro, and the page is visible on the first frame.
- Both marquees are still.
- The contour is off (already covered by Phase 1).

Then set `localStorage['kraft-a11y'] = '{"motion":true}'` without OS reduced motion, reload `/`, and confirm there's no intro.

- [ ] **Step 6: Full suite and commit**

Run: `npm test && npm run typecheck && npm run lint && npm run e2e`
Expected: all green.

```bash
git add -A e2e components app
git commit -m "test: Phase 2 screenshot pass and visual tuning" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
