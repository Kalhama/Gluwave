import { Button } from '@/components/ui/button'
import { Droplet, Syringe, UtensilsCrossed } from 'lucide-react'
import * as React from 'react'

import { CarbohydrateDialog } from './carbohydrate-dialog'
import { GlucoseDialog } from './glucose-dialog'
import { InsulinDialog } from './insulin-dialog'

interface Props {
  authenticated: boolean
}

export const Toolbar = ({ authenticated }: Props) => {
  if (!authenticated) {
    return null
  }

  return (
    <div
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      className="fixed bottom-0 bg-white w-full flex p-4 gap-2 border-t-2 justify-center rounded-t-xl shadow-[0_0_25px] shadow-slate-300"
    >
      <CarbohydrateDialog>
        <Button variant="ghost">
          <UtensilsCrossed />
        </Button>
      </CarbohydrateDialog>
      <InsulinDialog>
        <Button variant="ghost">
          <Syringe />
        </Button>
      </InsulinDialog>
      <GlucoseDialog>
        <Button variant="ghost">
          <Droplet />
        </Button>
      </GlucoseDialog>
    </div>
  )
}
