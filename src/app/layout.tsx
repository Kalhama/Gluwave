import { validateRequest } from '@/auth'
import { Menu } from '@/components/menu'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import './globals.sass'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
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
        <main className="p-2 pb-16">{children}</main>
        <Menu authenticated={!!user} />
      </body>
    </html>
  )
}
