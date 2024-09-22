import { MenuBar } from '@/components/menu-bar'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <MenuBar />
      {children}
    </>
  )
}
