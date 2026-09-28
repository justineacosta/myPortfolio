import { profile } from '@/data/profile'
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
    worksFor: { '@type': 'Organization', name: 'Kraft' },
    address: { '@type': 'PostalAddress', addressLocality: profile.address.locality, addressCountry: profile.address.country },
    ...(real(profile.email) ? { email: `mailto:${profile.email}` } : {}),
    sameAs: profile.socials.map((s) => s.href).filter(real),
  }
}

/** JSON for a <script> tag: a `<` inside a string can't close the tag. */
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
