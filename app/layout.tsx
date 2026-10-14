import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import SiteAnalytics from '@/components/shell/SiteAnalytics'
import { home } from '@/data/home'
import { profile } from '@/data/profile'
import { bootScript } from '@/lib/boot'
import { HOME_TITLE, OG_BASE, TITLE_TEMPLATE } from '@/lib/seo'
import { SITE_URL } from '@/lib/site'
import 'lenis/dist/lenis.css'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: HOME_TITLE, template: TITLE_TEMPLATE },
  description: home.lede,
  applicationName: profile.studio,
  authors: [{ name: profile.name }],
  openGraph: { ...OG_BASE, title: HOME_TITLE, description: home.lede },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="bg-bg font-sans text-ink antialiased">
        {children}
        {/* Only Vercel serves the script; a local `next start` would 404 on it. `next dev` logs the events to the console instead. */}
        {(process.env.VERCEL || process.env.NODE_ENV === 'development') && <SiteAnalytics />}
      </body>
    </html>
  )
}
