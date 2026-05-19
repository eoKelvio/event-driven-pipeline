import { describe, it, expect, vi } from 'vitest'
import { upsertCard } from '../../src/repositories/card.repository.js'
import type { CardEvent } from '@pipeline/shared'

const validCard: CardEvent = {
  card_id: 100,
  card_number: '4111111111111111',
  account_id: 10,
  status_id: 1,
  limit: 2000.0,
  expiration_date: '2030/01',
  event_time: new Date().toISOString(),
}

function makeDb() {
  const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined)
  const values = vi.fn().mockReturnValue({ onConflictDoUpdate })
  const insert = vi.fn().mockReturnValue({ values })
  return { insert, values, onConflictDoUpdate }
}

describe('upsertCard', () => {
  it('chama insert com os dados corretos', async () => {
    const db = makeDb()
    await upsertCard(db as any, validCard)

    expect(db.insert).toHaveBeenCalledOnce()
    expect(db.values).toHaveBeenCalledWith(
      expect.objectContaining({ cardId: validCard.card_id, cardNumber: validCard.card_number, accountId: validCard.account_id }),
    )
  })

  it('creditLimit é convertido para string', async () => {
    const db = makeDb()
    await upsertCard(db as any, validCard)

    expect(db.values).toHaveBeenCalledWith(
      expect.objectContaining({ creditLimit: '2000' }),
    )
  })

  it('configura onConflictDoUpdate com guard de event_time', async () => {
    const db = makeDb()
    await upsertCard(db as any, validCard)

    expect(db.onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.anything() }),
    )
  })
})
