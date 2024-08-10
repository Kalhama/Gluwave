import {
  doublePrecision,
  integer,
  numeric,
  pgTable,
  pgView,
  serial,
  timestamp,
} from 'drizzle-orm/pg-core'

export const insulin = pgTable('insulin', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').notNull(),
  amount: doublePrecision('amount').notNull(),
})

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  carbsPerUnits: doublePrecision('carbsPerUnits').notNull(),
  adjustmentRate: doublePrecision('adjustmentRate').notNull(),
  target: doublePrecision('target').notNull(),
  insulinOnBoardOffset: doublePrecision('insulinOnBoardOffset').notNull(),
})

export const insulin_on_board = pgView('insulin_on_board', {
  timestamp: timestamp('timestamp').notNull(),
  insulinOnBoard: doublePrecision('insulin_on_board').notNull(),
}).existing()

// export const insulin_effect = pgView('insulin_effect', {
//   timestamp: timestamp('timestamp').notNull(),
//   insulinEffect: integer('insulin_effect').notNull(),
// })
