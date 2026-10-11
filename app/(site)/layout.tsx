import type { ReactNode } from 'react'
import ChatRoot from '@/components/chat/ChatRoot'
import BackgroundGate from '@/components/shell/BackgroundGate'
import { PaletteProvider } from '@/components/shell/CommandPalette'
import FloatingAccess from '@/components/shell/FloatingAccess'
import IntroOverlay from '@/components/shell/IntroOverlay'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import PageGlow from '@/components/shell/PageGlow'
import PanelContent from '@/components/shell/PanelContent'
import PhoneBar from '@/components/shell/PhoneBar'
import TabBar from '@/components/shell/TabBar'
import Sidebar from '@/components/shell/Sidebar'
import SmoothScroll from '@/components/shell/SmoothScroll'
import { shellCopy } from '@/data/nav'
import { KNOWN_PATHS } from '@/lib/chat/knowledge'
import { PANEL_ID } from '@/lib/scroller'

/**
 * The shell (spec §5, §7). This layout stays mounted across navigations, so the
 * sidebar, background and intro persist while only the panel content swaps.
 * ≥1100px: fixed viewport, the panel scrolls. Below: document scroll.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <NavigationProvider>
      <PaletteProvider>
      <a href={`#${PANEL_ID}`} className="skip-link">
        {shellCopy.skipLink}
      </a>
      <IntroOverlay />
      <BackgroundGate />
      {/* After the contour: its canvas is opaque, and the glow is see-through. */}
      <PageGlow />
      <SmoothScroll />
      <PhoneBar />
      <div className="relative z-1 shell:flex shell:h-dvh shell:overflow-hidden">
        <Sidebar />
        <main
          id={PANEL_ID}
          tabIndex={-1}
          data-scroll
          data-a11y-scale
          className="min-w-0 flex-1 px-4 pt-[calc(77px+env(safe-area-inset-top))] pb-[120px] outline-none shell:overflow-x-hidden shell:overflow-y-auto shell:px-(--deskpad) shell:pt-(--deskpad) shell:pb-[72px]"
        >
          <PanelContent>{children}</PanelContent>
        </main>
      </div>
      <TabBar />
      <ChatRoot ai={Boolean(process.env.ANTHROPIC_API_KEY)} paths={[...KNOWN_PATHS]} />
      <FloatingAccess />
      </PaletteProvider>
    </NavigationProvider>
  )
}
