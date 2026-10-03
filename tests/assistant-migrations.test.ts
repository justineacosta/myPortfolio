// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const dir = join(process.cwd(), 'supabase', 'migrations')
const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
const sql = (f: string) => readFileSync(join(dir, f), 'utf8').toLowerCase()

describe('supabase migrations', () => {
  // 0001 was first run without messages.engine, so a database set up then needs a later migration to add it; logTurn writes it on every row.
  it('adds messages.engine in a migration that is safe to run on a database that already has the table', () => {
    const adds = files.slice(1).filter((f) => /alter table (if exists )?messages\s+add column if not exists engine\b/.test(sql(f)))
    expect(adds.length).toBe(1)
    expect(sql(adds[0])).toMatch(/check \(engine in \('claude', ?'site'\)\)/)
  })

  it('runs in filename order with zero-padded numbers', () => {
    expect(files[0]).toBe('0001_assistant.sql')
    for (const f of files) expect(f).toMatch(/^\d{4}_[a-z0-9_]+\.sql$/)
  })
})
