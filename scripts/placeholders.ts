// Lists every content gap still marked PLACEHOLDER (spec §10): the data files
// and the sample pages. Run: npm run placeholders
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

export type Hit = { file: string; line: number; text: string }

const ROOTS = ['data', 'public/samples']
const FILES = /\.(ts|tsx|html)$/
const MARK = /PLACEHOLDER[^'"`<]*/

export function findPlaceholders(root = process.cwd()): Hit[] {
  const hits: Hit[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name)
      if (statSync(path).isDirectory()) walk(path)
      else if (FILES.test(name)) {
        readFileSync(path, 'utf8')
          .split(/\r?\n/)
          .forEach((line, i) => {
            const m = line.match(MARK)
            if (m) hits.push({ file: relative(root, path).split(sep).join('/'), line: i + 1, text: m[0].trim() })
          })
      }
    }
  }
  for (const r of ROOTS) {
    try {
      walk(join(root, r))
    } catch {
      // a root that doesn't exist yet has no gaps
    }
  }
  return hits
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const hits = findPlaceholders()
  for (const h of hits) console.log(`${h.file}:${h.line}  ${h.text}`)
  console.log(`\n${hits.length} placeholders left`)
}
