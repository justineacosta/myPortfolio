// Prints what Lumen really answers, so the answers can be read before
// shipping: 16 single questions, then one two-turn conversation. It talks to a
// running dev server and exits 1 on any non-200, printing the status and body.
// With the real ANTHROPIC_API_KEY, Claude answers; without one, the offline
// rules do (each answer is labelled live or local). Each request sends its own
// x-forwarded-for, so the 30-per-hour limit stays out of the way.
// Run: npm run dev, then npm run chat-check (CHAT_URL overrides the address).
const URL = process.env.CHAT_URL ?? 'http://localhost:3000/api/chat'
/** The lines a reply can end with to draw a card or the contact form. */
const DIRECTIVE = /^\[\[[^\]\n]*\]\]$/gm

const QUESTIONS = [
  'What do you build?',
  'I run a dental clinic. Have you built anything like that?',
  'How much does a website cost?',
  'How does a project start?',
  "What's your tech stack?",
  'What courses have you done?',
  'Do you do n8n automations?',
  'Can you build a RAG chatbot for my docs?',
  'Who are your past clients?',
  'Write me a poem about the sea.',
  "What's the weather in Manila?",
  "Did you build Airbnb's booking system?",
  'Can you guarantee my sales double?',
  'Give me a fixed price for an online store.',
  'We own a gym. Any examples?',
  'Is he taking on new clients?',
]

let count = 0
let mode = '?'

/** Sends one conversation to the route; returns the reply text, or exits 1 on a non-200. */
async function ask(messages) {
  count += 1
  let res
  let body
  try {
    res = await fetch(URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${count}` },
      body: JSON.stringify({ messages }),
    })
    body = await res.text()
    mode = res.headers.get('x-assistant-mode') ?? '?'
  } catch (err) {
    console.error(`Could not reach ${URL}: ${err.message}. Is npm run dev running?`)
    process.exit(1)
  }
  if (res.status !== 200) {
    console.error(`Request ${count} failed: HTTP ${res.status}\n${body}`)
    process.exit(1)
  }
  return body
}

/** Prints a reply with who answered, and each card or form it asks for as an arrow. */
function show(question, reply) {
  const extras = reply.match(DIRECTIVE) ?? []
  const text = reply.replace(DIRECTIVE, '').trim()
  console.log(`Q: ${question}\nA (${mode}): ${text}${extras.map((d) => `\n→ ${d}`).join('')}\n`)
}

for (const q of QUESTIONS) {
  show(q, await ask([{ role: 'user', content: q }]))
}

// Two turns: the first reply goes back as the widget sends it, directives and all.
const first = 'I need my lead intake automated.'
const second = 'What would that look like?'
const reply = await ask([{ role: 'user', content: first }])
show(first, reply)
show(second, await ask([
  { role: 'user', content: first },
  { role: 'assistant', content: reply },
  { role: 'user', content: second },
]))
