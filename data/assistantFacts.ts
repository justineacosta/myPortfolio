/**
 * What Lumen knows about working with Justine that no page says, ported from
 * the old portfolio (oldportfolio/src/data/assistant-facts.ts). The old FAQ
 * entries that data/faqs.ts now answers (cost, maintenance, ownership) are
 * left out, so the two never disagree.
 *
 * No rate figure lives here on purpose. When a visitor asks what it costs,
 * Lumen explains how billing is structured and points to /contact rather than
 * improvising a number. No email address either: the contact page is the way in.
 */
export const assistantFacts = {
  /** data/about.ts's description, in Lumen's third person. */
  summary: 'He builds software, AI agents and workflows that keep working after the demo.',
  availability: 'Taking on new work, remote and worldwide. Based in Manila (GMT+8), with overlap for US, EU and CA hours.',
  billing:
    'Hourly for ongoing or open-ended work, a fixed project price for a new system built end to end. He prefers project-based for new builds, since the scope is clearer up front.',
  ownership: 'Ownership and licensing get agreed in writing before work starts. The specifics depend on the engagement.',
  communication:
    'Email, or whatever chat you already use. Updates when work lands rather than on a fixed schedule, and an early heads-up if something changes the estimate.',
  hours: 'He can work international hours.',
  /** data/faqs.ts's "How fast can you start?" and "What happens after I write?", in Lumen's third person. */
  start: 'Same week for small fixes; larger builds get a kickoff call within 48 hours.',
  reply: 'He reads every message the same day and replies within one business day.',
  personal: {
    education: 'BS in Computer Engineering, Mariano Marcos State University',
    languages: ['English', 'Filipino'],
    origin: 'He got into development building projects at school.',
    interests:
      'Sports and eSports games, plus running, reading, photography, and tinkering on small side projects: lately local-first software, well-made CLIs, and how AI is reshaping product surfaces.',
  },
  faq: [
    {
      question: 'Can you work with our existing team?',
      answer: "Justine works solo, with no agency behind him, and he's comfortable slotting into a team you already have.",
    },
    { question: 'Do you do design too?', answer: "Yes: design and build, not just implementing someone else's mockups." },
  ],
}
