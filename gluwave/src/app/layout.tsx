import { inter } from '@/components/inter'
import type { Metadata, Viewport } from 'next'

import { TRPCProvider } from '../lib/trcp/client'
import './globals.sass'

export const metadata = {
  title: 'Gluwave',
  description:
    'Gluwave is a Web based open loop application for diabetes management. Predict blood glucose based on insulin, meal entries and blood glucose development.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      {/* bg needs to be same also in manifest.ts */}
      <body className={`bg-slate-200 ${inter.className}`}>
        <main>
          <TRPCProvider>{children}</TRPCProvider>
        </main>
      </body>
    </html>
  )
}
