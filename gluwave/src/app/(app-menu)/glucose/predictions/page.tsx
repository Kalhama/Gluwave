import { GlucoseAdjustPrediction } from '@/components/glucose/glucose-adjust-prediction'
import { addHours, startOfHour, startOfMinute, subHours } from 'date-fns'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gluwave - Predictions',
}

export default async function Predictions() {
  const now = startOfMinute(new Date())
  const start = startOfHour(subHours(now, 24))
  const end = startOfHour(addHours(now, 24))

  return (
    <div className="mt-2 mx-auto max-w-2xl min-[420px]:px-2 md:px-4 space-y-6">
      <GlucoseAdjustPrediction start={start} end={end} />
    </div>
  )
}
