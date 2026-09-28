import type { ReactNode } from 'react'
import BackgroundGate from '@/components/shell/BackgroundGate'
import { PaletteProvider } from '@/components/shell/CommandPalette'
import FloatingAccess from '@/components/shell/FloatingAccess'
import IntroOverlay from '@/components/shell/IntroOverlay'
import LegalLinks from '@/components/shell/LegalLinks'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import PanelContent from '@/components/shell/PanelContent'
import PhoneControls from '@/components/shell/PhoneControls'
import TabBar from '@/components/shell/TabBar'
import Sidebar from '@/components/shell/Sidebar'
import SmoothScroll from '@/components/shell/SmoothScroll'
import { shellCopy } from '@/data/nav'
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
      <SmoothScroll />
      <div className="relative z-1 shell:flex shell:h-dvh shell:overflow-hidden">
        <Sidebar />
        <main
          id={PANEL_ID}
          tabIndex={-1}
          data-scroll
          data-a11y-scale
          className="min-w-0 flex-1 px-4 pt-16 pb-[120px] outline-none max-shell:has-[[data-home-profile]]:pt-4 shell:overflow-x-hidden shell:overflow-y-auto shell:px-(--deskpad) shell:pt-(--deskpad) shell:pb-[72px]"
        >
          <div>
            <PanelContent>{children}</PanelContent>
            <LegalLinks className="mt-10 justify-center shell:hidden" />
          </div>
        </main>
      </div>
      <TabBar />
      <PhoneControls />
      <FloatingAccess />
      </PaletteProvider>
    </NavigationProvider>
  )
}
