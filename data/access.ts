import type { TextSize } from '@/lib/a11y'

/** The accessibility menu (kape AccessMenu.tsx, spec §6): the four switches the spec names. */
export const access = {
  button: 'Accessibility options',
  title: 'Accessibility',
  close: 'Close accessibility options',
  textSize: 'TEXT SIZE',
  sizes: [
    { value: 'md', label: 'A', hint: 'Default text size' },
    { value: 'lg', label: 'A+', hint: 'Larger text' },
    { value: 'xl', label: 'A++', hint: 'Largest text' },
  ] satisfies { value: TextSize; label: string; hint: string }[],
  switches: [
    { key: 'contrast', label: 'Stronger contrast', desc: 'Brighter text, clearer edges' },
    { key: 'motion', label: 'Motion off', desc: 'No intro, drifting or auto-play' },
    { key: 'links', label: 'Underlined links', desc: 'Every link gets a line' },
  ] satisfies { key: 'contrast' | 'motion' | 'links'; label: string; desc: string }[],
  reset: 'Reset to default',
}
