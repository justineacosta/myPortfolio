import { Fragment } from 'react'
import { ArrowsSplitIcon, WebhooksLogoIcon } from '@phosphor-icons/react/ssr'
import { mainRoute, type Flow, type FlowNode } from '@/data/automations'
import type { ToolId } from '@/lib/brand/tools'
import BrandIcon from '@/components/ui/BrandIcon'

/** Each tool's logo in public/icons/brands/, for the chips. */
export const PEEK_SLUG: Partial<Record<ToolId, string>> = {
  n8n: 'n8n', claude: 'claude', telegram: 'telegram', gmail: 'gmail', hubspot: 'hubspot',
  'google-sheets': 'googlesheets', 'cal-com': 'caldotcom', airtable: 'airtable', make: 'make', zapier: 'zapier',
}

/** n8n's square nodes, Make's round modules, Zapier's numbered steps. */
const SHAPE = { n8n: 'rounded-[10px]', make: 'rounded-full', zapier: 'rounded-[10px]' } as const

function Chip({ node, flow, n }: { node: FlowNode; flow: Flow; n: number }) {
  const tool = node.tools[0]
  return (
    <span data-chip className={`relative grid size-[clamp(20px,12cqw,36px)] shrink-0 place-items-center bg-logo-chip shadow-(--logo-shadow) ${SHAPE[flow.platform]}`}>
      {tool ? (
        <BrandIcon slug={PEEK_SLUG[tool]!} size={18} className="block size-1/2" />
      ) : node.kind === 'branch' ? (
        <ArrowsSplitIcon className="size-1/2 text-logo-ink" />
      ) : (
        <WebhooksLogoIcon className="size-1/2 text-logo-ink" />
      )}
      {flow.platform === 'zapier' && (
        <span data-step className="absolute -top-1.5 -left-1.5 grid size-4 place-items-center rounded-full bg-accent font-mono text-[9px] text-on-accent">
          {n}
        </span>
      )}
    </span>
  )
}

/**
 * One flow's main route (the first way out of every step) as logo chips
 * joined by wires, each wire carrying a pulse that its parent switches on
 * (app/globals.css: .flow-peek on the Automations card, .flag-strip on the
 * Showcase). Chips size in cqw, so the parent is an @container. Decorative.
 */
export default function FlowStrip({ flow }: { flow: Flow }) {
  const route = mainRoute(flow).map((id) => flow.nodes.find((n) => n.id === id)!)
  return (
    <div data-flow-strip className="flex items-center">
      {route.map((n, k) => (
        <Fragment key={n.id}>
          {k > 0 && (
            <span className={`fp-wire relative min-w-0.5 flex-1 ${flow.platform === 'make' ? 'border-t-2 border-dotted border-b2' : 'h-px bg-b2'}`}>
              <span className="fp-pulse" style={{ animationDelay: `${k * 0.35}s` }} />
            </span>
          )}
          <Chip node={n} flow={flow} n={k + 1} />
        </Fragment>
      ))}
    </div>
  )
}
