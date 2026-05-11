import { sql } from 'drizzle-orm'
import { person } from '../db/schema.js'
import type { Database } from '../db/connection.js'
import type { PersonEvent } from '@pipeline/shared'

export async function upsertPerson(db: Database, data: PersonEvent): Promise<void> {
  await db
    .insert(person)
    .values({
      personId: data.person_id,
      cpf: data.cpf,
      name: data.name,
      email: data.email,
      gender: data.gender,
      birthDate: data.birth_date,
      address: data.address,
      salary: String(data.salary),
      eventTime: new Date(data.event_time),
    })
    .onConflictDoUpdate({
      target: person.personId,
      set: {
        cpf: sql`EXCLUDED.cpf`,
        name: sql`EXCLUDED.name`,
        email: sql`EXCLUDED.email`,
        gender: sql`EXCLUDED.gender`,
        birthDate: sql`EXCLUDED.birth_date`,
        address: sql`EXCLUDED.address`,
        salary: sql`EXCLUDED.salary`,
        eventTime: sql`EXCLUDED.event_time`,
        updatedAt: sql`NOW()`,
      },
      where: sql`${person.eventTime} < EXCLUDED.event_time`,
    })
}
