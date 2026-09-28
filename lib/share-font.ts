import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Geist Bold (assets/fonts, OFL) for the share headline. next/og's built-in Geist is regular weight only. */
export function shareFonts() {
  return [
    { name: 'Geist Bold', data: readFileSync(join(process.cwd(), 'assets/fonts/Geist-Bold.ttf')), weight: 700 as const, style: 'normal' as const },
  ]
}
