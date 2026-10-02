/**
 * The standalone pages (spec §9). The legal text is a PLACEHOLDER: it has to
 * describe this site and what it collects, so the owner (or a lawyer) writes
 * it before launch. The pages flag that in plain sight.
 */
export type LegalDocData = { kicker: string; title: string; description: string; updated: string; sections: { heading: string; body: string }[] }

export const legalLinks = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
]

const updated = 'Last updated: PLACEHOLDER date'

export const legal = {
  review: 'PLACEHOLDER - legal text for the owner (or a lawyer) to write and review before launch.',
  contactHeading: 'Contact',
  contact: 'Questions about this page:',
  privacy: {
    kicker: 'LEGAL / PRIVACY',
    title: 'Privacy Policy',
    description: 'How this site handles what you send through it.',
    updated,
    sections: [
      { heading: 'Who this covers', body: 'PLACEHOLDER - who runs this site and which sites this policy applies to.' },
      { heading: 'What is collected', body: 'PLACEHOLDER - what the contact form collects, and whether any analytics run.' },
      { heading: 'The site assistant', body: 'The chat assistant on this site is an AI (Claude, by Anthropic). Your messages are sent to Anthropic to write each reply. Every conversation is stored for 90 days so answers can be improved, then deleted. No IP address is stored. Your name and email are kept only if you choose to leave them in the chat.' },
      { heading: 'How it is used', body: 'PLACEHOLDER - what you do with that data, and who else sees it.' },
      { heading: 'How long it is kept', body: 'PLACEHOLDER - retention periods, and how to ask for deletion.' },
    ],
  } satisfies LegalDocData,
  terms: {
    kicker: 'LEGAL / TERMS',
    title: 'Terms of Use',
    description: 'The terms for using this site.',
    updated,
    sections: [
      { heading: 'Using this site', body: 'PLACEHOLDER - what visitors may and may not do with this site and its content.' },
      { heading: 'Work and proposals', body: 'PLACEHOLDER - that project work runs under its own written agreement, not these terms.' },
      { heading: 'Intellectual property', body: 'PLACEHOLDER - who owns the site, the case studies and the sample work shown.' },
      { heading: 'Liability', body: 'PLACEHOLDER - the limits of liability for using this site.' },
    ],
  } satisfies LegalDocData,
  thankYou: {
    kicker: 'MESSAGE RECEIVED',
    title: 'Got it. Talk soon.',
    body: "Thanks for reaching out. I'll reply within one business day with next steps. Check your inbox, and your spam folder just in case.",
    home: 'Back to home',
    work: 'See the work',
  },
  notFound: {
    kicker: '404',
    title: 'Page not found.',
    body: "That address doesn't exist. If you followed a link that should work, let me know and I'll look into it.",
    home: 'Back to home',
    contact: 'Get in touch',
  },
}
