import { pgTable, bigint, varchar, text, char, date, decimal, integer, timestamp } from 'drizzle-orm/pg-core'

export const person = pgTable('person', {
  personId: bigint('person_id', { mode: 'number' }).primaryKey(),
  cpf: varchar('cpf', { length: 11 }).unique().notNull(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  gender: char('gender', { length: 1 }).notNull(),
  birthDate: date('birth_date').notNull(),
  address: text('address').notNull(),
  salary: decimal('salary', { precision: 12, scale: 2 }).notNull(),
  eventTime: timestamp('event_time', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const account = pgTable('account', {
  accountId: bigint('account_id', { mode: 'number' }).primaryKey(),
  personId: bigint('person_id', { mode: 'number' }).notNull(),
  statusId: integer('status_id').notNull(),
  dueDay: integer('due_day').notNull(),
  balance: decimal('balance', { precision: 12, scale: 2 }).notNull(),
  availableBalance: decimal('available_balance', { precision: 12, scale: 2 }).notNull(),
  eventTime: timestamp('event_time', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const card = pgTable('card', {
  cardId: bigint('card_id', { mode: 'number' }).primaryKey(),
  cardNumber: varchar('card_number', { length: 20 }).notNull(),
  accountId: bigint('account_id', { mode: 'number' }).notNull(),
  statusId: integer('status_id').notNull(),
  creditLimit: decimal('credit_limit', { precision: 12, scale: 2 }).notNull(),
  expirationDate: varchar('expiration_date', { length: 10 }).notNull(),
  eventTime: timestamp('event_time', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})
