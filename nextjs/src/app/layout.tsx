import { validateRequest } from '@/auth'
import { Menu } from '@/components/menu'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import './globals.sass'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IOB-calc',
  description:
    'Web based open loop application for diabetes management. Predict blood glucose based on insulin, meal entries and blood glucose development',
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
  const { user } = await validateRequest()
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="pb-20">{children}</main>
        <Menu authenticated={!!user} />
      </body>
    </html>
  )
}
