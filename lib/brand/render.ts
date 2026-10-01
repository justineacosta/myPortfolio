import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONTOUR_FRAG, CONTOUR_TIMING } from '../contour.ts'
import { TOOLS, type ToolId } from './tools.ts'

/**
 * Tool logos for the three standalone pages (spec 2026-10-01-lively-pages
 * §3–4). Each page draws every logo it uses once, as a <symbol> in one hidden
 * sheet, and every badge, chip, tile, panel and glossary logo points at it
 * with <use>. Tool names are plain text (tests/brand.test.ts), so nothing
 * here needs escaping.
 */

const file = (name: string) => readFileSync(join(process.cwd(), 'lib/brand/logos', `${name}.svg`), 'utf8').replace(/\r\n/g, '\n').trim()

/** One logo file as a <symbol>, with every id inside it prefixed so two logos (or a logo and the page) never share one. */
function symbol(name: string): string {
  const m = /^<svg[^>]*viewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>$/.exec(file(name))
  if (!m) throw new Error(`lib/brand/logos/${name}.svg is not one <svg> with a viewBox`)
  const p = `lg-${name}-`
  const body = m[2]
    .replace(/\bid="([^"]+)"/g, (_, id: string) => `id="${p}${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id: string) => `url(#${p}${id})`)
    .replace(/href="#([^"]+)"/g, (_, id: string) => `href="#${p}${id}"`)
  return `<symbol id="logo-${name}" viewBox="${m[1]}">${body}</symbol>`
}

/** The hidden sheet: each tool's logo once, plus its dark version if it has one. Never display:none, or the gradients stop painting. */
export function logoSheet(ids: ToolId[]): string {
  const symbols = ids.flatMap((id) => [symbol(id), ...(TOOLS[id].dark ? [symbol(`${id}-dark`)] : [])]).join('')
  return `<svg class="logo-sheet" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false">${symbols}</svg>`
}

const pointAt = (name: string, size: number, cls: string) =>
  `<svg class="${cls}" width="${size}" height="${size}" aria-hidden="true" focusable="false"><use href="#logo-${name}"/></svg>`

/** A tool's logo at `size` px. A tool with a dark version brings both and the theme shows one; a mono logo takes the text colour. */
export function logo(id: ToolId, size: number): string {
  const t = TOOLS[id]
  if (t.dark) return pointAt(id, size, 'logo logo-light') + pointAt(`${id}-dark`, size, 'logo logo-dark')
  return pointAt(id, size, t.mono ? 'logo mono' : 'logo')
}

/** The round badges on a step card's top-right corner, one per tool. */
export function logoBadges(ids: ToolId[] | undefined): string {
  if (!ids?.length) return ''
  return `<span class="logo-badges">${ids.map((id) => `<span class="logo-badge" style="--brand:${TOOLS[id].brand}">${logo(id, 12)}</span>`).join('')}</span>`
}

/** “Tools on this page”: one chip per tool, in the order given. */
export function toolStrip(ids: ToolId[]): string {
  return `<div class="tools-strip"><span class="tools-strip-label" id="tools-strip-label">Tools on this page</span><ul aria-labelledby="tools-strip-label">${ids.map((id) => `<li class="tool-chip">${logo(id, 16)}${TOOLS[id].name}</li>`).join('')}</ul></div>`
}

/** One <template> per tool. The page script copies it into the details panel. */
export const toolTemplates = (ids: ToolId[]) =>
  ids.map((id) => `<template id="tool-${id}"><span class="ptool">${logo(id, 14)}${TOOLS[id].name}</span></template>`).join('')

/** The tool whose name is exactly `name`, if any. */
export const toolByName = (name: string) => (Object.keys(TOOLS) as ToolId[]).find((id) => TOOLS[id].name === name)

/** A small logo before a glossary term that is a tool; nothing otherwise. */
export function glossaryLogo(term: string): string {
  const id = toolByName(term)
  return id ? `<span class="gl-logo" aria-hidden="true">${logo(id, 14)}</span>` : ''
}

/** Every tool in these lists, once each, in order of first appearance. */
export const toolsUsed = (lists: (ToolId[] | undefined)[]): ToolId[] => [...new Set(lists.flatMap((l) => l ?? []))]

/** The scroll-in reveal script, ready to inline. Git may check it out with CRLF on Windows. */
export const revealJs = () => readFileSync(join(process.cwd(), 'lib/brand/reveal.js'), 'utf8').replace(/\r\n/g, '\n')

/** The site's drifting glow, first in <body>, behind everything (spec 2026-10-01-light-backdrop §4.1). */
export const backdropHtml = () => '<div class="page-glow" aria-hidden="true"><div></div></div>'

/** The theme head script (spec 2026-10-01-light-backdrop §3.2), ready to inline first in <head>. */
export const themeHeadJs = () => readFileSync(join(process.cwd(), 'lib/brand/theme.js'), 'utf8').replace(/\r\n/g, '\n')

/** The pages' contour (spec 2026-10-01-light-backdrop §4.2): the site's shader and timing, then the script. No "<" survives in the JSON. */
export const contourJs = () =>
  `const CONTOUR = ${JSON.stringify({ frag: CONTOUR_FRAG, ...CONTOUR_TIMING }).replace(/</g, '\\u003c')}\n${readFileSync(join(process.cwd(), 'lib/brand/contour.js'), 'utf8').replace(/\r\n/g, '\n')}`
