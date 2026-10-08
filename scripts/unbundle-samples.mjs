// Takes the weight out of each bundled sample site in public/samples/.
//
// A bundled export is one HTML file that carries every image, font and script
// as base64 and unpacks them with script before anything shows: 4-14 MB that
// must all arrive before the first paint, and nothing a browser can cache.
// This moves the assets out, beside the page in public/samples/<site>/, named
// by content so a re-run is stable; JPEG and PNG photos become WebP where that
// is smaller. A nested page (an iframe the bundle mints at run time) becomes
// its own file. The page keeps its path, so every link to it still works.
//
// The page itself still mounts its template with script, as the bundle did,
// rather than being written out as plain HTML: the templates carry
// placeholders like `{{ sunX }}` in SVG attributes that the page's runtime
// fills in, and parsing them in place would log an error for each.
//
// Fonts load in CORS mode, and the site preview frames these pages sandboxed
// (an opaque origin), so /samples/ answers with Access-Control-Allow-Origin
// (next.config.ts).
//
// Run: npm run unbundle            (every bundled page in public/samples/)
//      npm run unbundle -- a.html  (just those)
// Pages that are already unbundled are skipped.
import { createHash } from 'node:crypto'
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import sharp from 'sharp'

const dir = join(process.cwd(), 'public', 'samples')
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
const EXT = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'image/avif': 'avif',
  'font/woff2': 'woff2', 'font/woff': 'woff', 'font/ttf': 'ttf', 'font/otf': 'otf',
  'text/javascript': 'js', 'application/javascript': 'js', 'text/css': 'css', 'application/json': 'json', 'text/html': 'html',
}
/** Photos wider than this are scaled down: the sample pages never show one larger. */
const MAX_WIDTH = 2400

const block = (html, type) => {
  const m = html.match(new RegExp(`<script type="__bundler/${type}">([\\s\\S]*?)</script>`))
  return m ? m[1].trim() : null
}
const isBundle = (html) => block(html, 'manifest') !== null && block(html, 'template') !== null
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex').slice(0, 12)

/** A photo as WebP when that is clearly smaller, scaled to MAX_WIDTH. Anything else as it came. */
async function shrink(bytes, mime) {
  if (mime !== 'image/jpeg' && mime !== 'image/png') return { bytes, mime }
  const img = sharp(bytes)
  const { width = 0 } = await img.metadata()
  const webp = await img.resize({ width: Math.min(width, MAX_WIDTH), withoutEnlargement: true }).webp({ quality: 80, effort: 5 }).toBuffer()
  return webp.length < bytes.length * 0.85 ? { bytes: webp, mime: 'image/webp' } : { bytes, mime }
}

/**
 * Writes `html` (a bundle) as `<outDir>/<name>.html`, its assets in
 * `<outDir>/<name>/`, and returns the bytes it wrote.
 */
async function unbundle(html, outDir, name) {
  const manifest = JSON.parse(block(html, 'manifest'))
  let template = JSON.parse(block(html, 'template'))
  const pages = new Set(JSON.parse(block(html, 'page_order') ?? '[]'))
  const ext = JSON.parse(block(html, 'ext_resources') ?? '[]')
  const assetDir = join(outDir, name)
  rmSync(assetDir, { recursive: true, force: true })
  mkdirSync(assetDir, { recursive: true })

  let written = 0
  const paths = {}
  for (const [uuid, entry] of Object.entries(manifest)) {
    let bytes = Buffer.from(entry.data, 'base64')
    if (entry.compressed) bytes = gunzipSync(bytes)
    if (pages.has(uuid)) {
      const file = `page-${hash(bytes)}`
      written += await unbundle(bytes.toString('utf8'), assetDir, file)
      paths[uuid] = `${name}/${file}.html`
      continue
    }
    const out = await shrink(bytes, entry.mime)
    const extension = EXT[out.mime]
    if (!extension) throw new Error(`${name}: no extension for ${out.mime}`)
    const file = `${hash(out.bytes)}.${extension}`
    writeFileSync(join(assetDir, file), out.bytes)
    written += out.bytes.length
    paths[uuid] = `${name}/${file}`
  }

  // A nested page's frame says `about:blank#<uuid>`; it now points at the page's file.
  template = template.replace(new RegExp(`about:blank#(${UUID.source})`, 'g'), (m, uuid) => paths[uuid] ?? m)
  for (const [uuid, path] of Object.entries(paths)) template = template.split(uuid).join(path)
  // The bundle drops these too: the files are local now, and their hashes were for the CDN copies.
  template = template.replace(/\s+integrity="[^"]*"/gi, '').replace(/\s+crossorigin="[^"]*"/gi, '')

  // The page's own lookups (window.__resources.<id>) keep working, now with paths.
  const resources = Object.fromEntries(ext.filter((e) => paths[e.uuid]).map((e) => [e.id, paths[e.uuid]]))
  const script = `<script>window.__resources = ${JSON.stringify(resources).replace(/<\//g, '<\\/')};</script>`
  const head = template.match(/<head[^>]*>/i)
  if (head) template = template.slice(0, head.index + head[0].length) + script + template.slice(head.index + head[0].length)

  const page = shell(html, template)
  writeFileSync(join(outDir, `${name}.html`), page)
  return written + Buffer.byteLength(page)
}

/**
 * The page: the bundle's title and background, its template as JSON, and the
 * bundle's own mount step (parse, swap the document in, re-create each script
 * in order, waiting on each external one) without the unpacking.
 */
function shell(bundle, template) {
  const title = bundle.match(/<title>[\s\S]*?<\/title>/i)?.[0] ?? ''
  const background = bundle.match(/body\s*\{[^}]*?background:\s*([^;}]+)/)?.[1]?.trim()
  const data = JSON.stringify(template).replace(/</g, '\\u003c')
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${title}
${background ? `<style>html,body{background:${background}}</style>` : ''}
</head>
<body>
<script type="application/json" id="__page">${data}</script>
<script>
document.addEventListener('DOMContentLoaded', async function () {
  var template = JSON.parse(document.getElementById('__page').textContent)
  var doc = new DOMParser().parseFromString(template, 'text/html')
  document.documentElement.replaceWith(doc.documentElement)
  for (var old of Array.from(document.scripts)) {
    var s = document.createElement('script')
    for (var a of Array.from(old.attributes)) s.setAttribute(a.name, a.value)
    s.textContent = old.textContent
    var loaded = s.src ? new Promise(function (r) { s.onload = s.onerror = r }) : null
    old.replaceWith(s)
    if (loaded) await loaded
  }
  if (window.Babel && typeof window.Babel.transformScriptTags === 'function') window.Babel.transformScriptTags()
})
</script>
</body>
</html>
`
}

const only = process.argv.slice(2)
const files = readdirSync(dir).filter((f) => f.endsWith('.html') && (only.length === 0 || only.includes(f)))
for (const f of files) {
  const html = readFileSync(join(dir, f), 'utf8')
  if (!isBundle(html)) {
    console.log(`${f}: already unbundled, skipped`)
    continue
  }
  const before = Buffer.byteLength(html)
  const after = await unbundle(html, dir, f.replace(/\.html$/, ''))
  console.log(`${f}: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB`)
}
