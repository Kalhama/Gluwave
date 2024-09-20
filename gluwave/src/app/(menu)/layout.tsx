import { BurgerMenu } from '@/components/burger-menu'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <BurgerMenu />
      {children}
    </>
  )
}
