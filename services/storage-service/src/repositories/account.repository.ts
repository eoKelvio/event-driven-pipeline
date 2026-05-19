import { sql, eq } from 'drizzle-orm'
import { account } from '../db/schema.js'
import type { Database } from '../db/connection.js'
import type { AccountEvent } from '@pipeline/shared'

export async function getPersonIdByAccountId(db: Database, accountId: number): Promise<number | null> {
  const result = await db
    .select({ personId: account.personId })
    .from(account)
    .where(eq(account.accountId, accountId))
    .limit(1)
  return result[0]?.personId ?? null
}

export async function upsertAccount(db: Database, data: AccountEvent): Promise<void> {
  await db
    .insert(account)
    .values({
      accountId: data.account_id,
      personId: data.person_id,
      statusId: data.status_id,
      dueDay: data.due_day,
      balance: String(data.balance),
      availableBalance: String(data.available_balance),
      eventTime: new Date(data.event_time),
    })
    .onConflictDoUpdate({
      target: account.accountId,
      set: {
        personId: sql`EXCLUDED.person_id`,
        statusId: sql`EXCLUDED.status_id`,
        dueDay: sql`EXCLUDED.due_day`,
        balance: sql`EXCLUDED.balance`,
        availableBalance: sql`EXCLUDED.available_balance`,
        eventTime: sql`EXCLUDED.event_time`,
        updatedAt: sql`NOW()`,
      },
      where: sql`${account.eventTime} < EXCLUDED.event_time`,
    })
}
