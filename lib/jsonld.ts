import { FAQS } from '@/data/faqs'
import { notePath, type Note } from '@/data/notes'
import { profile } from '@/data/profile'
import { SERVICES } from '@/data/services'
import { isPlaceholder } from '@/lib/placeholder'
import { SITE_URL } from '@/lib/site'

/** Home's Person JSON-LD (spec §13). Anything still a PLACEHOLDER is left out, so search engines never see one. */
export function personJsonLd(url = SITE_URL) {
  const real = (v: string) => !isPlaceholder(v)
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url,
    image: `${url}${profile.portrait.src}`,
    jobTitle: profile.jobTitle,
    worksFor: { '@type': 'Organization', name: profile.studio },
    address: { '@type': 'PostalAddress', addressLocality: profile.address.locality, addressCountry: profile.address.country },
    ...(real(profile.email) ? { email: `mailto:${profile.email}` } : {}),
    sameAs: profile.socials.map((s) => s.href).filter(real),
  }
}

/** The FAQs' FAQPage JSON-LD, for /contact: each question with its answer, as on the page. */
export function faqJsonLd(faqs: { q: string; a: string }[] = FAQS) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
}

/** The offers as a list of Services, for /services, each provided by the Person on Home. */
export function servicesJsonLd(url = SITE_URL) {
  const provider = { '@type': 'Person', name: profile.name, url }
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: SERVICES.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: { '@type': 'Service', name: s.name, serviceType: s.name, description: `${s.line} ${s.bullets.join('. ')}.`, provider },
    })),
  }
}

/** A guide's BlogPosting JSON-LD, for /notes/<slug>, written by the Person on Home. */
export function noteJsonLd(note: Note, url = SITE_URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: note.title,
    description: note.summary,
    datePublished: note.date,
    url: `${url}${notePath(note.slug)}`,
    author: { '@type': 'Person', name: profile.name, url },
    keywords: note.tags.join(', '),
  }
}

/** JSON for a <script> tag: a `<` inside a string can't close the tag. */
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
