import { validateRequest } from '@/auth'
import Typography from '@/components/typography'
import { Separator } from '@/components/ui/separator'
import { redirect } from 'next/navigation'

import { SettingsForm } from './settings-form'

export default async function Settings() {
  const { user } = await validateRequest()

  if (!user) return redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <Typography variant="h3">Insulin sensitivity settings</Typography>
        <p className="text-sm text-muted-foreground">
          Adjust your insulin sensitivity
        </p>
      </div>
      <Separator />
      <div>
        <SettingsForm defaultValues={user} />
      </div>
    </div>
  )
}
