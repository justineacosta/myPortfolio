import { describe, expect, it } from 'vitest'
import { contact } from '@/data/contact'
import { confirmEmail, EMAIL_PALETTE, notifyEmail } from '@/lib/emails'
import { readTokens } from '@/lib/tokens'

const lead = { firstName: 'Ana', lastName: 'Reyes', email: 'ana@example.com', message: 'Our intake is manual.\nTwo people re-type every form.', website: '' }
const AT = new Date('2026-09-30T02:05:00Z')

describe('EMAIL_PALETTE', () => {
  it("is Kraft's light theme, straight from the token file", () => {
    const t = readTokens('light')
    expect(EMAIL_PALETTE).toEqual({ bg: t.bg, card: t.frame, panel: t.s0, line: t.chip, ink: t.ink, ink2: t.ink2, ink3: t.ink3, accent: t.accent, onAccent: t.onAccent })
  })
})

describe('notifyEmail (the one I get)', () => {
  const mail = notifyEmail(lead, AT)

  it('names the sender in the subject and keeps a plain-text copy', () => {
    expect(mail.subject).toBe('Project inquiry from Ana Reyes')
    expect(mail.text).toContain('Two people re-type every form.')
  })

  it('shows who wrote, from where and when (Manila time), then the message with its line breaks', () => {
    expect(mail.html).toContain('Ana Reyes')
    expect(mail.html).toContain('ana@example.com')
    expect(mail.html).toContain('Sep 30, 2026, 10:05 AM GMT+8')
    expect(mail.html).toContain('Our intake is manual.<br>Two people re-type every form.')
  })

  it('has a Reply button addressed to the visitor, with the subject filled in', () => {
    expect(mail.html).toContain('href="mailto:ana%40example.com?subject=Re%3A%20Project%20inquiry%20from%20Ana%20Reyes"')
    expect(mail.html).toContain('Reply to Ana')
  })

  it('escapes everything the visitor typed, so it can never become markup', () => {
    const evil = notifyEmail({ ...lead, firstName: '<img src=x onerror=alert(1)>', message: '<script>x</script> & "q"' }, AT)
    expect(evil.html).not.toContain('<img src=x')
    expect(evil.html).not.toContain('<script>')
    expect(evil.html).toContain('&lt;script&gt;x&lt;/script&gt; &amp; &quot;q&quot;')
  })
})

describe('confirmEmail (the one the visitor gets)', () => {
  const mail = confirmEmail(lead, 'https://kraft.dev')

  it('greets them, lists what happens next, and links to recent work', () => {
    expect(mail.subject).toBe(contact.reply.subject)
    expect(mail.html).toContain('Hi Ana,')
    for (const step of contact.reply.steps) expect(mail.html).toContain(step)
    expect(mail.html).toContain('href="https://kraft.dev/projects"')
    expect(mail.html).toContain(contact.reply.cta)
    expect(mail.text).toContain('https://kraft.dev/projects')
  })

  it('never repeats what they typed, so the form cannot mail someone else\'s words', () => {
    expect(mail.html).not.toContain('Our intake is manual.')
    expect(mail.text).not.toContain('Our intake is manual.')
  })

  it('escapes the name it greets them with', () => {
    expect(confirmEmail({ ...lead, firstName: '<b>Ana</b>' }, 'https://kraft.dev').html).toContain('Hi &lt;b&gt;Ana&lt;/b&gt;,')
  })
})

describe('notifyEmail for a chat call request', () => {
  const mail = notifyEmail(lead, AT, { call: true, transcript: 'Visitor: hi\nAssistant: <b>hello</b>' })

  it('tags the subject as a call request and appends the transcript to the text', () => {
    expect(mail.subject).toBe('Call request from Ana Reyes')
    expect(mail.text).toContain('Transcript:')
    expect(mail.text).toContain('Visitor: hi')
  })

  it('shows the transcript in the HTML, escaped', () => {
    expect(mail.html).toContain('Visitor: hi')
    expect(mail.html).toContain('&lt;b&gt;hello&lt;/b&gt;')
    expect(mail.html).not.toContain('<b>hello</b>')
  })

  it('is unchanged without extra', () => {
    expect(notifyEmail(lead, AT)).toEqual(notifyEmail(lead, AT, {}))
    expect(notifyEmail(lead, AT).text).not.toContain('Transcript:')
  })
})
