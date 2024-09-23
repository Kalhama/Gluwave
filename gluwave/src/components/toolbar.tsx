import { Button } from '@/components/ui/button'
import { Droplet, Settings, Syringe, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { BloodGlucoseDialog } from './bloodglucose-dialog'
import { CarbDialog } from './carb-dialog'
import { InsulinDialog } from './insulin-dialog'

interface Props {
  authenticated: boolean
}

export const Toolbar = ({ authenticated }: Props) => {
  if (!authenticated) {
    return null
  }

  return (
    <div className="fixed bottom-0 bg-white w-full flex p-4 gap-2 border-t-2 justify-center rounded-t-xl shadow-[0_0_25px] shadow-slate-300">
      <BloodGlucoseDialog>
        <Button variant="ghost">
          <Droplet />
        </Button>
      </BloodGlucoseDialog>
      <InsulinDialog>
        <Button variant="ghost">
          <Syringe />
        </Button>
      </InsulinDialog>
      <CarbDialog>
        <Button variant="ghost">
          <UtensilsCrossed />
        </Button>
      </CarbDialog>
    </div>
  )
}
