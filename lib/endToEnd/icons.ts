import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as Phosphor from '@phosphor-icons/react/ssr'

const ICONS = Phosphor as unknown as Record<string, ComponentType<{ size?: number }>>

/** A Phosphor icon (by name, without "Icon") as inline SVG, rendered when the page is built. */
export function iconSvg(name: string, size = 22): string {
  const Icon = ICONS[`${name}Icon`]
  if (!Icon) throw new Error(`No Phosphor icon named ${name}Icon`)
  return renderToStaticMarkup(createElement(Icon, { size }))
}
