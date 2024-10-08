import { inter } from '@/components/inter'
import type { Metadata, Viewport } from 'next'

import { TRPCProvider } from '../lib/trcp/client'
import './globals.sass'

export const metadata: Metadata = {
  title: 'Gluwave',
  description:
    'Gluwave is a Web based open loop application for diabetes management. Predict blood glucose based on insulin, meal entries and blood glucose development.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`bg-slate-200 ${inter.className}`}>
        <main>
          <TRPCProvider>{children}</TRPCProvider>
        </main>
      </body>
    </html>
  )
}
