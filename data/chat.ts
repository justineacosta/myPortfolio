/**
 * Lumen's copy: the launcher, the panel, the in-chat form and every sentence
 * the widget shows on its own. Lumen is the old portfolio's assistant
 * (the myPortfolioV3 repo, src/components/ai-chat-widget.tsx), restyled for Kraft. It
 * speaks about Justine in the third person, he/him, and never shows his email.
 */
export const chat = {
  launcher: 'Ask Lumen about Justine’s work',
  /** The bubble beside the launcher, once per visit. */
  nudge: { text: 'How can I help?', dismiss: 'Dismiss' },
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
    title: 'Send Justine a message',
    note: 'It goes straight to his inbox.',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    message: 'What are you building?',
    send: 'Send to Justine',
    sending: 'Sending…',
    sent: 'Sent. Justine has it and will reply by email.',
    /** The contact page's checks, in Lumen's voice rather than Justine's. */
    errors: {
      firstName: 'Add your first name.',
      lastName: 'Add your last name.',
      email: 'Add an email Justine can reply to.',
      emailFormat: 'That email doesn’t look right.',
      message: 'Tell him what you’re building.',
    },
  },
}
