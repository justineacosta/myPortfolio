/**
 * Lumen's copy: the launcher, the panel, the in-chat form and every sentence
 * the widget shows on its own. Lumen is the old portfolio's assistant
 * (oldportfolio/src/components/ai-chat-widget.tsx), restyled for Kraft. It
 * speaks about Justine in the third person, he/him, and never shows his email.
 */
export const chat = {
  launcher: 'Ask Lumen about Justine’s work',
  name: 'Lumen',
  subtitle: 'Justine’s portfolio assistant',
  greeting: "Hi, I'm **Lumen**, Justine's assistant. Ask me about his work, his stack, or how to start a conversation.",
  placeholder: 'Ask anything…',
  message: 'Message',
  send: 'Send',
  stop: 'Stop',
  close: 'Close chat',
  reset: 'Reset conversation',
  thinking: 'Lumen is thinking',
  /** The header badge: who wrote the last answer. */
  mode: {
    live: { label: 'Claude', title: 'Powered by Claude' },
    local: { label: 'Offline', title: 'Hand-tuned offline replies (no API key set)' },
  },
  hint: { send: 'send', newline: 'newline', open: 'press / anywhere' },
  /** The footer: `ai` when Claude answers, `site` when the offline rules do. */
  privacy: {
    ai: "Messages go to Anthropic to write the answer. This site doesn't keep them.",
    site: "This site doesn't keep your messages.",
  },
  /** Written into the reply bubble itself when something goes wrong. */
  replies: {
    empty: 'Hmm, nothing came back. Try [the contact page](/contact) and Justine will reply directly.',
    failed: 'Something went wrong on my end. You can reach Justine on [the contact page](/contact).',
    stopped: '_Stopped._',
    interrupted: '_Interrupted. Ask again to continue._',
  },
  /** Refusals the route sends as { error }, shown in the reply bubble. */
  errors: {
    rate: 'Too many messages. Try again in a bit, or write to Justine on [the contact page](/contact).',
    invalid: "I couldn't read that one. Try a shorter question.",
  },
  /** The project card a reply can carry. */
  card: { badge: 'SAMPLE SYSTEM', open: 'Open the case study' },
  /** The form a reply can carry on clear hiring intent. Fields and checks are the contact page's (lib/contact.ts). */
  lead: {
    intro: 'Leave your details and Justine will get back to you directly.',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    message: 'What are you building?',
    messagePlaceholder: 'A rough idea of the project, timeline, and what you need.',
    send: 'Send to Justine',
    sending: 'Sending…',
    sent: 'Sent. Justine has it and will reply by email.',
  },
}
