/**
 * The site chat's copy: the launcher, the panel and every sentence the route
 * can send back. The assistant speaks as the site's assistant about Justine,
 * not as Justine.
 */
export const chat = {
  launcher: 'Ask about Justine’s work',
  title: 'Ask about the work',
  greeting: "Hi, I'm the assistant on this site. Ask me about what Justine builds, how a project starts, or what it costs to get going.",
  suggestions: ['What do you build?', 'Have you built this for a business like mine?', 'How does a project start?'] as [string, string, string],
  placeholder: 'Ask a question',
  send: 'Send',
  close: 'Close chat',
  handoff: 'Send Justine a message',
  capped: 'Justine can take it from here.',
  privacy: "Messages go to Anthropic to write the answer. This site doesn't keep them.",
  /** Each refusal gives the visitor a way forward; the panel shows the hand-off button beside it. */
  errors: {
    rate: "You've asked a lot in a short time. Give it a few minutes, or write to Justine directly.",
    unavailable: "I can't answer right now. You can write to Justine and he'll reply himself.",
    failed: "That didn't come through. Ask again, or write to Justine.",
    invalid: "I couldn't read that one. Try a shorter question, or write to Justine.",
  },
}
