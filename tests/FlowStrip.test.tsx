import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import FlowStrip from '@/components/projects/FlowStrip'
import { automations, mainRoute } from '@/data/automations'

const strip = (code: string) => render(<FlowStrip flow={automations.flows.find((f) => f.code === code)!} />).container

describe('FlowStrip', () => {
  it('draws one flow’s main route: a chip per step, a wire between each, a pulse on each wire', () => {
    const f = automations.flows[0]
    const el = strip(f.code)
    expect(el.querySelectorAll('[data-flow-strip] [data-chip]')).toHaveLength(mainRoute(f).length)
    expect(el.querySelectorAll('.fp-wire')).toHaveLength(mainRoute(f).length - 1)
    expect(el.querySelectorAll('.fp-wire .fp-pulse')).toHaveLength(mainRoute(f).length - 1)
  })

  it('numbers a Zap’s steps and draws Make’s wires dotted', () => {
    expect([...strip('MW-01').querySelectorAll('[data-step]')].map((s) => s.textContent)).toEqual(['1', '2', '3', '4', '5'])
    expect(strip('ME-01').querySelector('.fp-wire')!.className).toContain('border-dotted')
    expect(strip('HP-01').querySelectorAll('[data-step]')).toHaveLength(0)
  })
})
