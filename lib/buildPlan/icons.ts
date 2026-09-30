import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as Phosphor from '@phosphor-icons/react/ssr'
import type { IconName } from '../../data/buildPlan.ts'

const ICONS = Phosphor as unknown as Record<string, ComponentType<{ size?: number }>>

/** A Phosphor icon as inline SVG, rendered when the page is built, so the page itself needs no icon library. */
export function iconSvg(name: IconName): string {
  const Icon = ICONS[`${name}Icon`]
  if (!Icon) throw new Error(`No Phosphor icon named ${name}Icon`)
  return renderToStaticMarkup(createElement(Icon, { size: 22 }))
}
