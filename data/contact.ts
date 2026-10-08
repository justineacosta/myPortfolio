/**
 * FAQs / Contact copy, verbatim from KraftScreens.dc.html:464-554, except
 * the new pieces:
 * - The validation and server messages.
 * - The Message-queued body, rewritten to be true for the Resend flow.
 * - The confirmation email the visitor gets.
 */
export const contact = {
  title: ["Tell me what you're", 'building.'] as const,
  lede: "Describe the bottleneck. If it can be automated or built, you get a plan back. If it can't, I'll say so.",
  fields: {
    firstName: { label: 'FIRST NAME', placeholder: 'Alex' },
    lastName: { label: 'LAST NAME', placeholder: 'Rivera' },
    email: { label: 'EMAIL', placeholder: 'you@yourbusiness.com' },
    message: { label: 'WHAT ARE YOU RUNNING INTO?', placeholder: 'Where does the work pile up? What are you running it on today?' },
  },
  errors: {
    firstName: 'Add your first name.',
    lastName: 'Add your last name.',
    email: 'Add an email I can reply to.',
    emailFormat: 'That email doesn’t look right.',
    message: 'Tell me what you’re running into.',
    failed: 'That did not go through. Email me directly instead.',
    direct: 'Or write to',
    rate: 'Too many messages from here. Try again in a few minutes.',
  },
  submit: 'Send it',
  sending: 'Sending',
  note: 'One business day. No newsletter, no drip.',
  sent: {
    title: 'Message queued.',
    body: "It's in my inbox. I'll reply within one business day.",
    again: 'Send another',
  },
  /** The confirmation the visitor gets by email. It never quotes their message. */
  reply: {
    /** The sender name the visitor sees: a person, not a brand. */
    sender: 'Justine at Kraft',
    subject: (firstName: string) => `Thanks, ${firstName}. I'll reply within one business day`,
    kicker: 'MESSAGE RECEIVED',
    title: 'Got your message.',
    body: "Thanks for writing. Your message reached me, and I'll reply within one business day.",
    next: 'WHAT HAPPENS NEXT',
    steps: [
      'I read it myself, within one business day.',
      "You get a short plan back, or an honest no if it isn't a fit.",
      'If it fits, we book a call to scope it.',
    ],
    cta: 'See recent work',
    footer: "You're getting this because you wrote through the contact form.",
  },
  /** The email I get for each message (lib/emails.ts). */
  notify: {
    /** The sender name in my inbox, so a lead stands out. */
    sender: 'Kraft Contact Form',
    kicker: 'NEW INQUIRY',
    wrote: 'wrote in.',
    name: 'NAME',
    email: 'EMAIL',
    received: 'RECEIVED',
    message: 'MESSAGE',
    reply: 'Reply to',
    footer: 'Sent by the contact form on your site. Replying goes straight to them.',
  },
  faqs: {
    id: 'faqs',
    label: 'Quick answers',
    kicker: 'FAQS',
    title: 'Quick answers.',
    aside: 'Still have one? Write it in the form.',
  },
  availability: { hours: 'HOURS COVERED', linkedin: 'Connect on LinkedIn' },
}
