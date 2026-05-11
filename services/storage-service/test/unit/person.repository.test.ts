import { describe, it, expect, vi } from 'vitest'
import { upsertPerson } from '../../src/repositories/person.repository.js'
import type { PersonEvent } from '@pipeline/shared'

const validPerson: PersonEvent = {
  person_id: 1,
  name: 'João Silva',
  email: 'joao@example.com',
  gender: 'M',
  birth_date: '1990/05/20',
  address: 'Rua das Flores, 100',
  salary: 5000.0,
  cpf: '12345678901',
  event_time: new Date().toISOString(),
}

function makeDb(overrides = {}) {
  const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined)
  const values = vi.fn().mockReturnValue({ onConflictDoUpdate })
  const insert = vi.fn().mockReturnValue({ values })
  return { insert, values, onConflictDoUpdate, ...overrides }
}

describe('upsertPerson', () => {
  it('chama insert com os dados corretos', async () => {
    const db = makeDb()
    await upsertPerson(db as any, validPerson)

    expect(db.insert).toHaveBeenCalledOnce()
    expect(db.values).toHaveBeenCalledWith(
      expect.objectContaining({ personId: validPerson.person_id, cpf: validPerson.cpf }),
    )
  })

  it('configura onConflictDoUpdate com o guard de event_time', async () => {
    const db = makeDb()
    await upsertPerson(db as any, validPerson)

    expect(db.onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.anything() }),
    )
  })
})
