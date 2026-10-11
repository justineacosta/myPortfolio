/**
 * Nothing on this page is fabricated (KraftScreens.dc.html:614-618). CLIENTS
 * are real: Dominic's details, scope and tags come from the old portfolio
 * (the myPortfolioV3 repo, src/data/testimonials.ts and its Barangay project). No client
 * has a video yet, so `src` and `duration` stay PLACEHOLDERs. Dominic's poster
 * is his official portrait from the San Fernando portal
 * (the SanFernandoWeb repo, src/images/officials), standing in until a video exists.
 *
 * SAMPLES are the fictional businesses behind public/samples. Their cards say
 * SAMPLE SYSTEM where a client's says my role, and name no person and quote
 * no one. Each logo is the sample site's own mark, or its wordmark's first
 * letter in the site's font and colours. The lines and tags come from each
 * sample's flows in data/cases.
 */

/** A card on the Testimonials page: logo (a /public path), organisation, my role there (or SAMPLE SYSTEM), one line on the work, and tags. */
export type Card = { logo: string; org: string; work: string; line: string; tags: string[] }

export type Client = {
  n: string
  name: string
  role: string
  tag: string
  card: Card
  video: { src: string; poster: string; duration: string }
}

const noVideo = (n: string, poster = `PLACEHOLDER - testimonial video ${n} poster (4:5)`): Client['video'] => ({
  src: `PLACEHOLDER - testimonial video ${n} (a /public path or URL)`,
  poster,
  duration: 'PLACEHOLDER - length, e.g. 1:24',
})

export const CLIENTS: Client[] = [
  {
    n: '01',
    name: 'Dominic Dela Cruz',
    role: 'Barangay Captain · Barangay San Fernando',
    tag: 'Citizen portal',
    card: {
      logo: '/assets/testimonial-san-fernando-seal.png',
      org: 'Barangay San Fernando',
      work: 'FULL STACK DEVELOPER',
      line: 'I built their citizen portal - document requests residents can track, plus officials and budgets published online.',
      tags: ['Next.js', 'Supabase', 'Document tracking'],
    },
    video: noVideo('01', '/assets/testimonial-dela-cruz.jpg'),
  },
]

export const SAMPLE_WORK = 'SAMPLE SYSTEM'

const sample = (slug: string, org: string, line: string, tags: string[]): Card => ({
  logo: `/assets/testimonial-${slug}.png`,
  org,
  work: SAMPLE_WORK,
  line,
  tags,
})

/** In the sample carousel's order (data/projects.ts). */
export const SAMPLES: Card[] = [
  sample('oriel-portugal-residences', 'Oriel', 'I built a sample site for a Lisbon residential developer, with the flows behind private viewings, the studio inbox and model revisions.', ['Real estate', 'HubSpot', 'Claude']),
  sample('tidewell-vacation-rentals', 'Tidewell', 'I built a sample site for a vacation-rental manager, with the flows that assess properties, approve repairs and send owner statements.', ['Vacation rentals', 'Airtable', 'Telegram']),
  sample('altitude-personal-training', 'Altitude', 'I built a sample site for an online coach, with the flows for coaching applications, plan sign-ups and Sunday check-ins.', ['Coaching', 'Airtable', 'Claude']),
  sample('range-physical-therapy', 'Range Physical Therapy', 'I built a sample site for a cash-pay physical therapist, with the flows for evaluation bookings, per-visit superbills and six-visit plans.', ['Physical therapy', 'Airtable', 'Stripe']),
  sample('riverdale-and-brooks', 'Riverdale & Brooks', 'I built a sample site for a Virginia law firm, with the flows for consultation requests, monthly invoices and milestone notices.', ['Law firm', 'n8n', 'Stripe']),
  sample('ostler-barbers', 'Ostler', 'I built a sample site for a Fitzrovia barbershop, with the flows for chair bookings, memberships and shelf orders.', ['Barbershop', 'Airtable', 'Stripe']),
  sample('westmere-los-angeles', 'Westmere', 'I built a sample site for a Los Angeles residence developer, with the flows behind its enquiry, viewing and portfolio buttons.', ['Real estate', 'HubSpot', 'Airtable']),
  sample('ironline-utility-infrastructure', 'Ironline Utility Infrastructure', 'I built a sample site for a utility contractor, with the flows for bid requests, near-miss reviews and job closeouts.', ['Utilities', 'Airtable', 'Zapier']),
  sample('meridian-energy-infrastructure', 'Meridian Energy Infrastructure', 'I built a sample site for a commercial solar builder, with the flows for site surveys, production faults and production reports.', ['Solar energy', 'Airtable', 'n8n']),
]

/** Every card on the page, numbered: real clients first, then the samples. */
export const CARDS: (Card & { n: string })[] = [...CLIENTS.map((c) => c.card), ...SAMPLES].map((c, i) => ({
  ...c,
  n: String(i + 1).padStart(2, '0'),
}))

/** Home's Testimonials card: Kraft drew three rows, so real clients first, then samples up to three. */
export const HOME_ROWS = [
  ...CLIENTS.map((c) => ({ n: c.n, name: c.name, role: c.role, tag: c.tag })),
  ...SAMPLES.map((s) => ({ n: '', name: s.org, role: s.work, tag: s.tags[0] })),
]
  .slice(0, 3)
  .map((r, i) => ({ ...r, n: String(i + 1).padStart(2, '0') }))

/** Testimonials page copy (KraftScreens.dc.html:327-392). */
export const testimonialsPage = {
  title: ['The people who', 'kept me on.'] as const,
  lede: "The people I've built for, and what I built them.",
  play: 'Play testimonial',
  posterHint: 'Drop the testimonial video poster',
  caption: 'Client testimonial',
  noLength: '[0:00]',
  tapToPlay: 'TAP TO PLAY',
  tab: 'Testimonial',
  /** Cards per page; the pager shows once there's more than one page. */
  perPage: 4,
  pager: 'Testimonial pages',
  prevPage: 'Previous page',
  nextPage: 'Next page',
  page: 'Page',
}
