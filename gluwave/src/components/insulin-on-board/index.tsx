import { validateRequest } from '@/auth'
import { calculateUserInsulinData } from '@/lib/sql_utils'
import { addHours, addMinutes, startOfMinute, subHours } from 'date-fns'
import { redirect } from 'next/navigation'

import { GraphContainer, GraphTitle } from '../graph-container'
import { InsulinOnBoardContent } from './insulin-on-board-content'

export default async function InsulinOnBoardProvider() {
  const { user } = await validateRequest()
  if (!user) {
    redirect('/login')
  }

  const now = startOfMinute(new Date())
  const data = await calculateUserInsulinData(
    subHours(now, 24),
    addHours(now, 12),
    user.id
  )

  const current = data.find(
    (insulin) =>
      insulin.timestamp > now && insulin.timestamp <= addMinutes(now, 1)
  )

  return (
    <GraphContainer>
      <GraphTitle href="/insulin/list">
        <div>
          <h2 className="font-semibold">Insulin on board</h2>

          <span className="text-xs text-slate-700">
            {(current?.insulinOnBoard ?? 0).toLocaleString(undefined, {
              maximumFractionDigits: 2,
              minimumFractionDigits: 1,
            })}{' '}
            U
          </span>
        </div>
      </GraphTitle>
      <InsulinOnBoardContent data={data} now={now} />
    </GraphContainer>
  )
}
