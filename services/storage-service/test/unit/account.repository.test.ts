import { describe, it, expect, vi } from 'vitest'
import { upsertAccount, getPersonIdByAccountId } from '../../src/repositories/account.repository.js'
import type { AccountEvent } from '@pipeline/shared'

const validAccount: AccountEvent = {
  account_id: 10,
  person_id: 1,
  status_id: 1,
  due_day: 5,
  balance: 500.0,
  available_balance: 400.0,
  event_time: new Date().toISOString(),
}

function makeDb(overrides = {}) {
  const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined)
  const values = vi.fn().mockReturnValue({ onConflictDoUpdate })
  const insert = vi.fn().mockReturnValue({ values })
  const limit = vi.fn().mockResolvedValue([])
  const where = vi.fn().mockReturnValue({ limit })
  const from = vi.fn().mockReturnValue({ where })
  const select = vi.fn().mockReturnValue({ from })
  return { insert, values, onConflictDoUpdate, select, from, where, limit, ...overrides }
}

describe('upsertAccount', () => {
  it('chama insert com os dados corretos', async () => {
    const db = makeDb()
    await upsertAccount(db as any, validAccount)

    expect(db.insert).toHaveBeenCalledOnce()
    expect(db.values).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: validAccount.account_id, personId: validAccount.person_id }),
    )
  })

  it('balance e availableBalance são convertidos para string', async () => {
    const db = makeDb()
    await upsertAccount(db as any, validAccount)

    expect(db.values).toHaveBeenCalledWith(
      expect.objectContaining({ balance: '500', availableBalance: '400' }),
    )
  })

  it('configura onConflictDoUpdate com guard de event_time', async () => {
    const db = makeDb()
    await upsertAccount(db as any, validAccount)

    expect(db.onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.anything() }),
    )
  })
})

describe('getPersonIdByAccountId', () => {
  it('retorna null quando conta não existe', async () => {
    const db = makeDb()
    const result = await getPersonIdByAccountId(db as any, 99)
    expect(result).toBeNull()
  })

  it('retorna personId quando conta existe', async () => {
    const limit = vi.fn().mockResolvedValue([{ personId: 1 }])
    const where = vi.fn().mockReturnValue({ limit })
    const from = vi.fn().mockReturnValue({ where })
    const select = vi.fn().mockReturnValue({ from })
    const db = makeDb({ select, from, where, limit })

    const result = await getPersonIdByAccountId(db as any, 10)
    expect(result).toBe(1)
  })
})
