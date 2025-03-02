import { validateRequest } from '@/auth'
import Typography from '@/components/typography'
import { redirect } from 'next/navigation'

import ApiKeyList from './api-key-list'

export default async function Settings() {
  const { user } = await validateRequest()

  if (!user) return redirect('/login')

  return (
    <div className="space-y-6 flex-grow">
      <div>
        <Typography variant="h3">API key management</Typography>
        <p className="text-sm text-muted-foreground">
          Delete or renew a API key
        </p>
        <ApiKeyList />
      </div>
    </div>
  )
}
