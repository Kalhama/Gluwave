import { AddCarbDialog } from '@/app/carbs/list/[date]/AddCarbDialog'
import { AddBloodGlucoseMeasurementDialog } from '@/app/glucose/list/[date]/AddBloodGlucoseMeasurementDialog'
import { AddInsulinDialog } from '@/app/insulin/list/[date]/AddInsulinDialog'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

interface Props {
  authenticated: boolean
}

export const Menu = ({ authenticated }: Props) => {
  if (!authenticated) {
    return null
  }

  return (
    <div className="fixed bottom-0 bg-white w-full flex p-4 gap-4 border-t justify-center">
      <AddBloodGlucoseMeasurementDialog />
      <AddInsulinDialog />
      <AddCarbDialog />
      <Button variant="link">
        <Link href="/settings">
          <Settings />
        </Link>
      </Button>
    </div>
  )
}
