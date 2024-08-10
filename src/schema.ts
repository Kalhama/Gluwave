import {
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

export const insulin = pgTable('insulin', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').notNull(),
  amount: integer('amount').notNull(),
})
