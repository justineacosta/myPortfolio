import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import { bootScript } from '@/lib/boot'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: { default: 'Justine Acosta · Kraft', template: '%s · Kraft' },
  description:
    'Full-stack development, AI automation and workflow systems — built to keep running long after launch day.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="bg-bg font-sans text-ink antialiased">{children}</body>
    </html>
  )
}
