import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const BLOCKS = {
  dark: /(?:^|\n):root\{color-scheme:dark;([^}]*)\}/,
  light: /\n\[data-theme=light\]\{([^}]*)\}/,
}
const CONTRAST = {
  dark: /\n:root\[data-a11y-contrast=true\]\{([^}]*)\}/,
  light: /\n:root\[data-a11y-contrast=true\]\[data-theme=light\]\{([^}]*)\}/,
}

const globals = () => readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8')

function block(css: string, re: RegExp, what: string): Record<string, string> {
  const m = css.replace(/\r\n/g, '\n').match(re)
  if (!m) throw new Error(`No ${what} block in app/globals.css`)
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

/**
 * Kraft's colour tokens for one theme, read from app/globals.css. Used where
 * CSS variables can't reach (the share image), so no colour is copied out of
 * the token file (spec §3). Build-time only.
 */
export function readTokens(theme: 'dark' | 'light', css = globals()): Record<string, string> {
  return block(css, BLOCKS[theme], `${theme} token`)
}

/** The High contrast overrides (data-a11y-contrast) for each theme, from the same file. Build-time only. */
export function readContrast(css = globals()): { dark: Record<string, string>; light: Record<string, string> } {
  return { dark: block(css, CONTRAST.dark, 'dark contrast'), light: block(css, CONTRAST.light, 'light contrast') }
}
