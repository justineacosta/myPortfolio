import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { TALL } from '@/data/showcase'

/** A JPEG's width and height, from its start-of-frame header. */
function size(path: string) {
  const b = readFileSync(path)
  let i = 2
  while (i < b.length) {
    if (b[i] !== 0xff) {
      i++
      continue
    }
    const m = b[i + 1]
    if (m >= 0xc0 && m <= 0xc2) return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) }
    i += 2 + b.readUInt16BE(i + 2)
  }
  throw new Error(`no frame header in ${path}`)
}

describe('the tall site shots', () => {
  it('are all the size the Showcase window gives next/image', () => {
    for (const f of readdirSync('public/samples/thumbs/tall')) expect(size(`public/samples/thumbs/tall/${f}`), f).toEqual(TALL)
  })
})
