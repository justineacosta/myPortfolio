import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const BLOCKS = {
  dark: /(?:^|\n):root\{color-scheme:dark;([^}]*)\}/,
  light: /\n\[data-theme=light\]\{([^}]*)\}/,
}

/**
 * Kraft's colour tokens for one theme, read from app/globals.css. Used where
 * CSS variables can't reach (the share image), so no colour is copied out of
 * the token file (spec §3). Build-time only.
 */
export function readTokens(theme: 'dark' | 'light', css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8')): Record<string, string> {
  const m = css.match(BLOCKS[theme])
  if (!m) throw new Error(`No ${theme} token block in app/globals.css`)
  return Object.fromEntries(
    m[1]
      .split(';')
      .filter(Boolean)
      .map((decl) => {
        const i = decl.indexOf(':')
        return [decl.slice(0, i).trim().replace(/^--/, ''), decl.slice(i + 1).trim()]
      }),
  )
}
