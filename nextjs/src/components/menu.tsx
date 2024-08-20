import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { BloodGlucoseDialog } from './bloodglucose-dialog'
import { CarbDialog } from './carb-dialog'
import { InsulinDialog } from './insulin-dialog'

interface Props {
  authenticated: boolean
}

export const Menu = ({ authenticated }: Props) => {
  if (!authenticated) {
    return null
  }

  return (
    <div className="fixed bottom-0 bg-white w-full flex p-4 gap-4 border-t justify-center">
      <BloodGlucoseDialog />
      <InsulinDialog />
      <CarbDialog />
      <Button variant="link">
        <Link href="/settings">
          <Settings />
        </Link>
      </Button>
    </div>
  )
}