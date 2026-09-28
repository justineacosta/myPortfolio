/**
 * The desktop-shell breakpoint, in rem so it scales with the browser's default
 * font size exactly like Tailwind's `shell:` variant (--breakpoint-shell in
 * app/globals.css). Any JS that decides "is the panel the scroller?" must use
 * this, never a px query, or large-font visitors get a phone layout with a
 * desktop scroller (tests/breakpoints.test.ts keeps the two in sync).
 */
export const SHELL_MIN_QUERY = '(min-width: 68.75rem)'
