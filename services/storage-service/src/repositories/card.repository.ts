import { sql } from 'drizzle-orm'
import { card } from '../db/schema.js'
import type { Database } from '../db/connection.js'
import type { CardEvent } from '@pipeline/shared'

export async function upsertCard(db: Database, data: CardEvent): Promise<void> {
  await db
    .insert(card)
    .values({
      cardId: data.card_id,
      cardNumber: data.card_number,
      accountId: data.account_id,
      statusId: data.status_id,
      creditLimit: String(data.limit),
      expirationDate: data.expiration_date,
      eventTime: new Date(data.event_time),
    })
    .onConflictDoUpdate({
      target: card.cardId,
      set: {
        cardNumber: sql`EXCLUDED.card_number`,
        accountId: sql`EXCLUDED.account_id`,
        statusId: sql`EXCLUDED.status_id`,
        creditLimit: sql`EXCLUDED.credit_limit`,
        expirationDate: sql`EXCLUDED.expiration_date`,
        eventTime: sql`EXCLUDED.event_time`,
        updatedAt: sql`NOW()`,
      },
      where: sql`${card.eventTime} < EXCLUDED.event_time`,
    })
}
