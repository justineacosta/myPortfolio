/**
 * FAQs / Contact copy, verbatim from KraftScreens.dc.html:464-554, except
 * two new pieces:
 * - The validation messages.
 * - The Message-queued body, rewritten to be true for the mail-client flow
 *   (spec §9), plus its "nothing opened?" fallback (spec §12).
 */
export const contact = {
  title: ["Tell me what you're", 'building.'] as const,
  lede: "Describe the bottleneck. If it can be automated or built, you get a plan back. If it can't, I'll say so.",
  fields: {
    firstName: { label: 'FIRST NAME', placeholder: 'Justine' },
    lastName: { label: 'LAST NAME', placeholder: 'Acosta' },
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
  },
  submit: 'Send it',
  sending: 'Sending',
  note: 'One business day. No newsletter, no drip.',
  sent: {
    title: 'Message queued.',
    mailto: "Your email app should have opened with the message ready. Hit send there, and I'll reply within one business day.",
    webhook: "It's in my inbox. I'll reply within one business day.",
    fallback: 'Nothing opened? Write to',
    copy: 'Copy',
    copied: 'Copied',
    copyFailed: 'Select it to copy',
    again: 'Send another',
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
