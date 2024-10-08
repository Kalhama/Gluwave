import { validateRequest } from '@/auth'
import Typography from '@/components/typography'
import { redirect } from 'next/navigation'

import { ApiKeyForm } from './api-key-form'

export default async function Settings() {
  const { user } = await validateRequest()

  if (!user) return redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <Typography variant="h3">API key management</Typography>
        <p className="text-sm text-muted-foreground">
          Delete or renew a API key
        </p>
      </div>

      <div>
        <ApiKeyForm defaultValue={user.apikey ?? undefined} />
      </div>
    </div>
  )
}
