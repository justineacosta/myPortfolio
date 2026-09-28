import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'
import { SHELL_MIN_QUERY } from '@/lib/breakpoints'
import { PANEL_ID } from '@/lib/scroller'
import { installMatchMedia } from '@/test/matchMedia'

const lenis = vi.hoisted(() => ({ ctor: vi.fn() }))
vi.mock('lenis', () => ({
  default: class {
    constructor(opts: unknown) {
      lenis.ctor(opts)
    }
    destroy() {}
    scrollTo() {}
  },
}))

function Harness({ overflow }: { overflow: string }) {
  useSmoothScroll()
  return (
    <main id={PANEL_ID} style={{ overflowY: overflow as 'auto' }}>
      <div>content</div>
    </main>
  )
}

describe('useSmoothScroll', () => {
  beforeEach(() => lenis.ctor.mockReset())

  it('mounts Lenis on the panel when the shell breakpoint matches and the panel scrolls', async () => {
    installMatchMedia({ [SHELL_MIN_QUERY]: true })
    render(<Harness overflow="auto" />)
    await waitFor(() => expect(lenis.ctor).toHaveBeenCalledOnce())
  })

  it('never mounts Lenis when the panel is not the scroller (phone layout)', async () => {
    installMatchMedia({ [SHELL_MIN_QUERY]: true })
    render(<Harness overflow="visible" />)
    await new Promise((r) => setTimeout(r, 20))
    expect(lenis.ctor).not.toHaveBeenCalled()
  })
})
