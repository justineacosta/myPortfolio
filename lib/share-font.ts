import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const face = (file: string) => readFileSync(join(process.cwd(), 'assets/fonts', file))

/**
 * Geist (assets/fonts, OFL) for the share image: bold for the headline,
 * regular for the rest. Passing any fonts replaces next/og's built-in
 * regular face, so both weights are registered here.
 */
export function shareFonts() {
  return [
    { name: 'Geist', data: face('Geist-Regular.ttf'), weight: 400 as const, style: 'normal' as const },
    { name: 'Geist', data: face('Geist-Bold.ttf'), weight: 700 as const, style: 'normal' as const },
  ]
}
