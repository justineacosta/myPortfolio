// Prints what a sample site actually says, so its case pages start from the
// site's own words: its forms and fields, its buttons and links, its full text
// and every FAQ answer, including the ones a collapsed accordion keeps out of
// the page text. Run: npm run site-facts -- <file in public/samples>
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const file = process.argv[2]
const path = file && join(process.cwd(), 'public', 'samples', file)
if (!path || !existsSync(path)) {
  console.error('Usage: npm run site-facts -- <file in public/samples>, e.g. riverdale-and-brooks.html')
  process.exit(1)
}

const browser = await chromium.launch()
// Closed even when the page never unpacks or the read throws.
let facts
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto(pathToFileURL(path).href, { waitUntil: 'load' })
  // A bundled export unpacks itself with script before its page exists.
  await page.waitForFunction(() => !document.getElementById('__bundler_thumbnail') && !document.getElementById('__bundler_loading'), null, { timeout: 60_000 })
  await page.waitForTimeout(800)

  facts = await page.evaluate(async () => {
    const clean = (s) => s.replace(/\s+/g, ' ').trim()
    // Open every accordion, one at a time, so an answer is in the page while it is read.
    const faq = []
    for (const d of document.querySelectorAll('details')) {
      d.open = true
      const q = d.querySelector('summary')
      if (q) faq.push({ q: clean(q.textContent), a: clean(d.textContent.replace(q.textContent, '')) })
    }
    // Menu and nav toggles are not accordions; their links are read below anyway.
    for (const b of document.querySelectorAll('button[aria-expanded="false"]')) {
      if (b.closest('nav, header, [role="menu"], [role="dialog"]')) continue
      const before = new Set(document.body.innerText.split('\n'))
      b.click()
      await new Promise((r) => setTimeout(r, 60))
      const panel = document.getElementById(b.getAttribute('aria-controls') ?? '')
      // Without a linked panel, the answer is whatever lines the click made appear.
      const a = panel ? panel.innerText : document.body.innerText.split('\n').filter((l) => !before.has(l)).join(' ')
      if (clean(a)) faq.push({ q: clean(b.textContent), a: clean(a) })
    }
    // Answers a page keeps only in its script data: { q: '…', a: '…' } and ['Q', 'A'] pairs.
    const scripts = [...document.scripts].map((s) => s.textContent).join('\n')
    // A quoted string: an escape, or any other character that is not its closing quote. The two never overlap, so a
    // long escaped string that fails to match fails fast, and the length cap keeps a stray match short.
    const str = String.raw`(['"\x60])((?:\\.|(?!\1)[^\\]){8,1200}?)\1`
    const second = str.replaceAll('\\1', '\\3')
    for (const re of [new RegExp(String.raw`\bq\s*:\s*${str}\s*,\s*a\s*:\s*${second}`, 'g'), new RegExp(String.raw`\[\s*${str}\s*,\s*${second}\s*\]`, 'g')])
      for (const m of scripts.matchAll(re)) if (m[2].trim().endsWith('?')) faq.push({ q: clean(m[2]), a: clean(m[4]) })

    const seen = new Set()
    return {
      title: document.title,
      forms: [...document.querySelectorAll('form')].map((f) => ({
        name: f.getAttribute('aria-label') || f.id || f.closest('section')?.id || '',
        fields: [...f.querySelectorAll('input, select, textarea')].map((i) => {
          const label = i.labels?.[0]?.textContent ?? i.getAttribute('aria-label') ?? i.name ?? i.id
          const options = i.tagName === 'SELECT' ? ` [${[...i.options].map((o) => clean(o.text)).join(' | ')}]` : ''
          return `${clean(label ?? '')}: ${i.type || i.tagName.toLowerCase()}${options}`
        }),
        buttons: [...f.querySelectorAll('button')].map((b) => clean(b.textContent)),
      })),
      actions: [...new Set([...document.querySelectorAll('a, button')].map((a) => clean(a.textContent)).filter((t) => t && t.length <= 40))],
      faq: faq.filter((f) => f.a && !seen.has(f.q) && seen.add(f.q)),
      text: document.body.innerText.replace(/\n{2,}/g, '\n'),
    }
  })
} finally {
  await browser.close()
}

const out = [`# ${facts.title}`, '', '## Forms']
for (const f of facts.forms) out.push(`- ${f.name || '(unnamed)'}: ${f.fields.join('; ')} · buttons: ${f.buttons.join(', ')}`)
if (!facts.forms.length) out.push('- none')
out.push('', '## Buttons and links', facts.actions.join(' · '), '', `## FAQ (${facts.faq.length})`)
for (const f of facts.faq) out.push(`- **${f.q}** ${f.a}`)
out.push('', '## Full text', facts.text)
console.log(out.join('\n'))
