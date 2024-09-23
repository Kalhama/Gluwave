import { validateRequest } from '@/auth'
import { AutoReload } from '@/components/auto-reload'
import { GlucoseBar } from '@/components/glucose-bar'
import { Toolbar } from '@/components/toolbar'
import { redirect } from 'next/navigation'

export default async function AppMenuLayouit({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user } = await validateRequest()

  if (!user) redirect('/login')

  return (
    <div className="pb-32 min-h-screen">
      <AutoReload minutes={5} />
      <GlucoseBar />
      {children}
      <Toolbar authenticated={!!user} />
    </div>
  )
}
