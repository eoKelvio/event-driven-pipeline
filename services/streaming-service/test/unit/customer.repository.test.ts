import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PersonEvent, AccountEvent, CardEvent } from '@pipeline/shared'

const mockFindOneAndUpdate = vi.fn().mockResolvedValue(null)
const mockUpdateOne = vi.fn().mockResolvedValue({ modifiedCount: 1 })
const mockFindOne = vi.fn()

vi.mock('../../src/models/customer.model.js', () => ({
  Customer: {
    findOneAndUpdate: mockFindOneAndUpdate,
    updateOne: mockUpdateOne,
    findOne: mockFindOne,
  },
}))

const { upsertPerson, upsertAccount, upsertCard, findByCpf } = await import(
  '../../src/repositories/customer.repository.js'
)

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

const validAccount: AccountEvent = {
  account_id: 10,
  status_id: 1,
  due_day: 10,
  person_id: 1,
  balance: 1000.0,
  available_balance: 800.0,
  event_time: new Date().toISOString(),
}

const validCard: CardEvent = {
  card_id: 100,
  card_number: '4111111111111111',
  account_id: 10,
  status_id: 1,
  limit: 5000.0,
  expiration_date: '2028/12',
  event_time: new Date().toISOString(),
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUpdateOne.mockResolvedValue({ modifiedCount: 1 })
})

describe('upsertPerson', () => {
  it('chama findOneAndUpdate com cpf como filtro e upsert true', async () => {
    await upsertPerson(validPerson)
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { cpf: validPerson.cpf },
      expect.objectContaining({ $set: expect.objectContaining({ name: validPerson.name }) }),
      { upsert: true },
    )
  })
})

describe('upsertAccount', () => {
  it('atualiza conta existente com $set e arrayFilters', async () => {
    await upsertAccount(validAccount)
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { person_id: validAccount.person_id },
      expect.objectContaining({ $set: expect.anything() }),
      expect.objectContaining({ arrayFilters: expect.any(Array) }),
    )
  })

  it('faz push da conta quando nenhuma existe (modifiedCount === 0)', async () => {
    mockUpdateOne.mockResolvedValueOnce({ modifiedCount: 0 })
    await upsertAccount(validAccount)
    expect(mockUpdateOne).toHaveBeenCalledTimes(2)
    expect(mockUpdateOne).toHaveBeenLastCalledWith(
      { person_id: validAccount.person_id },
      expect.objectContaining({ $push: expect.anything() }),
    )
  })
})

describe('upsertCard', () => {
  it('atualiza cartão existente com arrayFilters', async () => {
    await upsertCard(validCard)
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { 'accounts.account_id': validCard.account_id },
      expect.objectContaining({ $set: expect.anything() }),
      expect.objectContaining({ arrayFilters: expect.any(Array) }),
    )
  })

  it('faz push do cartão quando nenhum existe (modifiedCount === 0)', async () => {
    mockUpdateOne.mockResolvedValueOnce({ modifiedCount: 0 })
    await upsertCard(validCard)
    expect(mockUpdateOne).toHaveBeenCalledTimes(2)
    expect(mockUpdateOne).toHaveBeenLastCalledWith(
      { 'accounts.account_id': validCard.account_id },
      expect.objectContaining({ $push: expect.anything() }),
    )
  })
})

describe('findByCpf', () => {
  it('chama findOne com o cpf e retorna o resultado', async () => {
    const mockCustomer = { cpf: '12345678901', name: 'João' }
    mockFindOne.mockReturnValue({ lean: () => Promise.resolve(mockCustomer) })

    const result = await findByCpf('12345678901')
    expect(mockFindOne).toHaveBeenCalledWith({ cpf: '12345678901' })
    expect(result).toEqual(mockCustomer)
  })
})
