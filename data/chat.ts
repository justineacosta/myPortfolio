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
  greeting: "Hi there! I'm **Lumen**, Justine's assistant. Ask me anything about his work, his stack, or how to get started.",
  placeholder: 'Ask anything…',
  message: 'Message',
  send: 'Send',
  stop: 'Stop',
  close: 'Close chat',
  reset: 'Reset conversation',
  /** The header's speaker button. */
  sound: { mute: 'Mute sounds', unmute: 'Turn sounds on' },
  /** The header's size button, desktop only. */
  size: { expand: 'Expand chat', shrink: 'Shrink chat' },
  /** The buttons under a finished reply. */
  actions: { copy: 'Copy reply', copied: 'Copied', retry: 'Try again' },
  /** The pill that shows when the visitor has scrolled up and more has arrived. */
  latest: 'Jump to latest',
  thinking: 'Lumen is thinking',
  /** The header badge. It always says Claude, key or no key; the privacy line below the box is the one that follows who answered. */
  badge: { label: 'Claude', title: 'Powered by Claude' },
  hint: { send: 'send', newline: 'newline', open: 'press / anywhere' },
  /** The footer: `ai` when Claude answers, `site` when the offline rules do. */
  privacy: {
    ai: "Messages go to Anthropic to write the answer. Only your browser keeps this chat, for 3 days.",
    site: 'Only your browser keeps this chat, for 3 days.',
  },
  /** Written into the reply bubble itself when something goes wrong. */
  replies: {
    empty: 'Hmm, nothing came back that time. Try asking again, or reach Justine directly on [the contact page](/contact).',
    failed: 'Sorry, something went wrong on my end. Try again in a moment, or reach Justine on [the contact page](/contact).',
    stopped: '_Stopped._',
    interrupted: '_Interrupted. Ask again to continue._',
  },
  /** Refusals the route sends as { error }, shown in the reply bubble. */
  errors: {
    rate: "You've sent quite a few messages, so let's take a short breather. Try again in a bit, or write to Justine on [the contact page](/contact).",
    invalid: "Sorry, I couldn't read that one. Could you try a shorter question?",
  },
  /** The project card a reply can carry. */
  card: { badge: 'SAMPLE SYSTEM', open: 'Open the case study' },
  /** The form a reply can carry on clear hiring intent. Fields and checks are the contact page's (lib/contact.ts). */
  lead: {
    title: 'Send Justine a message',
    note: 'It goes straight to his inbox.',
    /** The note when the message starts with the visitor's questions to Lumen. */
    noteDraft: 'Your questions to me are filled in; edit them before you send.',
    /** The line above those questions in the message. */
    draftIntro: 'What I asked Lumen:',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    message: 'What are you building?',
    send: 'Send to Justine',
    sending: 'Sending…',
    sent: 'Sent! Justine has your message and will reply by email.',
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
