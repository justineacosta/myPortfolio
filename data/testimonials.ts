/**
 * Real client quotes only (KraftScreens.dc.html:614-618, "Nothing on this
 * page is fabricated"). Dominic's quote, scope and tags come from the old
 * portfolio (oldportfolio/src/data/testimonials.ts and its Barangay project).
 * No client has a video yet, so those fields stay PLACEHOLDERs and the
 * player shows Kraft's empty poster slot until one does.
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

const noVideo = (n: string): Client['video'] => ({
  src: `PLACEHOLDER - testimonial video ${n} (a /public path or URL)`,
  poster: `PLACEHOLDER - testimonial video ${n} poster (4:5)`,
  duration: 'PLACEHOLDER - length, e.g. 1:24',
})

export const CLIENTS: Client[] = [
  {
    n: '01',
    name: 'Dominic Dela Cruz',
    role: 'Barangay Captain · Barangay San Fernando',
    tag: 'Citizen portal',
    quote:
      "Justine took the time to understand how our barangay actually operates before starting the project, and it shows in the site he delivered. Before, every request meant a trip to our office during working hours, and residents had no way to know where things stood. Now they can request documents, track them, and see our officials and budgets online, all without leaving home. He was responsive throughout and clearly cared about getting it right, not just shipping something that looked good. It's made our barangay more transparent and accessible to the people we serve.",
    tags: ['Next.js', 'Supabase', 'Document tracking'],
    video: noVideo('01'),
  },
]

/** Testimonials page copy (KraftScreens.dc.html:327-392). */
export const testimonialsPage = {
  title: ['The people who', 'kept me on.'] as const,
  lede: "Hear it from the people I've built for, in their own words.",
  featured: 'FEATURED',
  play: 'Play testimonial',
  posterHint: 'Drop the testimonial video poster',
  caption: 'Client testimonial',
  noLength: '[0:00]',
  tapToPlay: 'TAP TO PLAY',
  tab: 'Testimonial',
}
