import { validateRequest } from '@/auth'
import { GlucoseBar } from '@/components/glucose-bar'
import { Toolbar } from '@/components/toolbar'
import { trpc } from '@/lib/trcp/server'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export async function generateMetadata(): Promise<Metadata> {
  const d = await trpc.glucose.getLast()

  if (d.last?.value) {
    return {
      title: `${d.last.value.toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} mmol/l`,
    }
  }

  return {}
}

export default async function AppMenuLayouit({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user } = await validateRequest()

  if (!user) redirect('/login')

  return (
    <div className="pb-32 min-h-screen">
      <GlucoseBar />
      {children}
      <Toolbar authenticated={!!user} />
    </div>
  )
}
