// Writes a stand-in page for each sample site on the Projects drum into
// public/samples/. Each page is self-contained HTML (no requests), so the
// preview can load it. When you have a real site, replace its file (keep the
// name, or change it in SITES in data/projects.ts too), then `npm run thumbs`.
// Run: npm run sites   (writes the pages, then the thumbnails)
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Keep in step with SITES in data/projects.ts (tests/projects.test.tsx checks every file exists). */
const SITES = [
  ['Apex Build Co.', 'sample-auto-repair-performance-tuning.html', 'Auto repair and performance tuning'],
  ['Blade Studio', 'sample-brand-studio.html', 'Brand studio'],
  ['Below Ground', 'sample-utility-contractor.html', 'Utility contractor'],
  ['Baptiste', 'sample-law-firm.html', 'Law firm'],
  ['One Hour Therapy', 'sample-therapy-clinic.html', 'Therapy clinic'],
  ['Trusted Mover', 'sample-moving-company.html', 'Moving company'],
  ['Payline', 'sample-fintech-funnel.html', 'Fintech funnel'],
  ['Solar Field', 'sample-solar-installer.html', 'Solar installer'],
]

// The client's own colours, not Kraft's: these stand in for other businesses' sites.
const PALETTES = [
  { bg: '#111316', surface: '#1B1F24', ink: '#F4F5F7', muted: '#9AA3AE', accent: '#F2542D' },
  { bg: '#F6F1EA', surface: '#FFFFFF', ink: '#1D1A17', muted: '#7A6F66', accent: '#B4532A' },
  { bg: '#FFF8E7', surface: '#FFFFFF', ink: '#1F2A1F', muted: '#6B7565', accent: '#C98A00' },
  { bg: '#0F1A2B', surface: '#172538', ink: '#EEF2F7', muted: '#93A3B8', accent: '#C9A86A' },
  { bg: '#F1F5F3', surface: '#FFFFFF', ink: '#1B2B27', muted: '#6A7C77', accent: '#3C8D7A' },
  { bg: '#FFFFFF', surface: '#F2F5FA', ink: '#0E1B33', muted: '#667085', accent: '#1F6FEB' },
  { bg: '#0B0B12', surface: '#161625', ink: '#F5F5FF', muted: '#A3A3C2', accent: '#7C5CFF' },
  { bg: '#FFFBF2', surface: '#FFFFFF', ink: '#1A1A10', muted: '#77735E', accent: '#E08A00' },
]

const css = (p) => `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:${p.bg};color:${p.ink};line-height:1.5}
a{color:inherit;text-decoration:none}
.wrap{max-width:1120px;margin:0 auto;padding:0 32px}
nav{display:flex;align-items:center;justify-content:space-between;padding:22px 0}
.logo{font-weight:800;letter-spacing:-.02em;font-size:18px}
.logo b{color:${p.accent}}
.links{display:flex;gap:28px;font-size:14px;color:${p.muted}}
.btn{display:inline-block;background:${p.accent};color:${p.bg};font-weight:700;font-size:15px;padding:14px 26px;border-radius:999px}
.btn--ghost{background:transparent;color:${p.ink};border:1px solid ${p.muted}66}
.tag{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${p.accent};margin-bottom:18px}
h1{font-size:clamp(40px,6vw,72px);line-height:1.02;letter-spacing:-.035em;font-weight:800;max-width:14ch}
p.lede{font-size:18px;color:${p.muted};max-width:46ch;margin:22px 0 32px}
.hero{display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:center;padding:56px 0 80px}
.shot{aspect-ratio:4/5;border-radius:24px;background:repeating-linear-gradient(135deg,${p.surface} 0 14px,${p.bg} 14px 28px);border:1px solid ${p.muted}33;display:grid;place-items:center;text-align:center;padding:24px;color:${p.muted};font-size:14px}
.shot strong{display:block;color:${p.ink};font-size:16px;margin-bottom:6px}
.row{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding:24px 0 80px}
.card{background:${p.surface};border:1px solid ${p.muted}22;border-radius:20px;padding:28px}
.card .n{font-size:13px;font-weight:700;color:${p.accent};margin-bottom:26px}
.card h3{font-size:20px;margin-bottom:8px}
.card p{color:${p.muted};font-size:15px}
.band{background:${p.surface};border-radius:28px;padding:56px;display:grid;grid-template-columns:1fr auto;gap:32px;align-items:center;margin-bottom:80px}
.quote{font-size:24px;line-height:1.35;max-width:40ch}
.who{margin-top:16px;color:${p.muted};font-size:14px}
footer{border-top:1px solid ${p.muted}33;padding:28px 0 40px;color:${p.muted};font-size:13px;display:flex;justify-content:space-between}
@media (max-width:760px){.hero,.band{grid-template-columns:1fr}.row{grid-template-columns:1fr}.links{display:none}}
`

const page = (name, file, kind, p) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${name}</title><style>${css(p)}</style></head>
<body><div class="wrap">
<nav><span class="logo">${name}<b>.</b></span>
<span class="links"><a href="#">Services</a><a href="#">About</a><a href="#">Contact</a></span>
<a class="btn" href="#">PLACEHOLDER CTA</a></nav>
<section class="hero"><div>
<span class="tag">PLACEHOLDER - ${kind}</span>
<h1>${name}</h1>
<p class="lede">PLACEHOLDER - swap this page for the real ${name} site. One line on who it was for and what it had to do.</p>
<a class="btn" href="#">PLACEHOLDER CTA</a> <a class="btn btn--ghost" href="#">Secondary</a>
</div><div class="shot"><div><strong>PLACEHOLDER IMAGE</strong>The site's hero photo or product shot</div></div></section>
<div class="row">${[1, 2, 3]
  .map((i) => `<div class="card"><div class="n">0${i}</div><h3>PLACEHOLDER</h3><p>A benefit, a step, or a feature from the real site.</p></div>`)
  .join('')}</div>
<div class="band"><div><p class="quote">"PLACEHOLDER - a short testimonial from the client this site was built for."</p>
<p class="who">PLACEHOLDER NAME, ${name}</p></div><a class="btn" href="#">PLACEHOLDER</a></div>
<footer><span>&copy; ${name}</span><span>Replace this file: public/samples/${file}</span></footer>
</div></body></html>
`

const dir = join(process.cwd(), 'public', 'samples')
mkdirSync(join(dir, 'thumbs'), { recursive: true })
SITES.forEach(([name, file, kind], i) => writeFileSync(join(dir, file), page(name, file, kind, PALETTES[i % PALETTES.length])))
console.log(`wrote ${SITES.length} sample pages to public/samples/`)
