/**
 * Kraft ships no real quotes (KraftScreens.dc.html:614-618, "Nothing on this
 * page is fabricated"). Every field stays a PLACEHOLDER until a real client
 * says it. The same goes for the video, the poster and its length.
 */
export type Client = {
  n: string
  name: string
  role: string
  tag: string
  quote: string
  tags: string[]
  video: { src: string; poster: string; duration: string }
}

export const CLIENTS: Client[] = ['01', '02', '03'].map((n) => ({
  n,
  name: 'PLACEHOLDER - client name',
  role: 'PLACEHOLDER - role · company',
  tag: 'PLACEHOLDER - scope',
  quote: 'PLACEHOLDER - a real client quote. Nothing on this page is fabricated.',
  tags: ['PLACEHOLDER - tag', 'PLACEHOLDER - tag', 'PLACEHOLDER - tag'],
  video: {
    src: `PLACEHOLDER - testimonial video ${n} (a /public path or URL)`,
    poster: `PLACEHOLDER - testimonial video ${n} poster (4:5)`,
    duration: 'PLACEHOLDER - length, e.g. 1:24',
  },
}))

/** Testimonials page copy, verbatim (KraftScreens.dc.html:327-392). */
export const testimonialsPage = {
  title: ['The people who', 'kept me on.'] as const,
  lede: 'Hear it from them, then read what I actually hold in each account. Every quote below is a placeholder until you drop the real one in.',
  featured: 'FEATURED',
  play: 'Play testimonial',
  posterHint: 'Drop the testimonial video poster',
  caption: 'Client testimonial',
  noLength: '[0:00]',
  tapToPlay: 'TAP TO PLAY',
  tab: 'Testimonial',
}
