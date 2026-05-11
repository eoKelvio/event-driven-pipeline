import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PersonEvent, AccountEvent, CardEvent } from '@pipeline/shared'

const { mockUpsertPerson, mockUpsertAccount, mockUpsertCard } = vi.hoisted(() => ({
  mockUpsertPerson: vi.fn().mockResolvedValue(undefined),
  mockUpsertAccount: vi.fn().mockResolvedValue(undefined),
  mockUpsertCard: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/repositories/customer.repository.js', () => ({
  upsertPerson: mockUpsertPerson,
  upsertAccount: mockUpsertAccount,
  upsertCard: mockUpsertCard,
}))

type EachMessageHandler = (ctx: { message: { value: Buffer | null } }) => Promise<void>

function makeKafka(onRun: (handler: EachMessageHandler) => void) {
  return {
    consumer: vi.fn().mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockResolvedValue(undefined),
      run: vi.fn().mockImplementation(({ eachMessage }: { eachMessage: EachMessageHandler }) => {
        onRun(eachMessage)
        return Promise.resolve()
      }),
    }),
  }
}

const { startPersonConsumer } = await import('../../src/consumers/person.consumer.js')
const { startAccountConsumer } = await import('../../src/consumers/account.consumer.js')
const { startCardConsumer } = await import('../../src/consumers/card.consumer.js')

beforeEach(() => vi.clearAllMocks())

const personPayload: PersonEvent = {
  person_id: 1,
  name: 'João',
  email: 'joao@example.com',
  gender: 'M',
  birth_date: '1990/01/01',
  address: 'Rua A, 1',
  salary: 3000,
  cpf: '12345678901',
  event_time: new Date().toISOString(),
}

const accountPayload: AccountEvent = {
  account_id: 10,
  status_id: 1,
  due_day: 5,
  person_id: 1,
  balance: 500,
  available_balance: 400,
  event_time: new Date().toISOString(),
}

const cardPayload: CardEvent = {
  card_id: 100,
  card_number: '4111111111111111',
  account_id: 10,
  status_id: 1,
  limit: 2000,
  expiration_date: '2030/01',
  event_time: new Date().toISOString(),
}

describe('startPersonConsumer', () => {
  it('chama upsertPerson quando recebe mensagem válida', async () => {
    let handler: EachMessageHandler | undefined
    const kafka = makeKafka((h) => { handler = h }) as any

    await startPersonConsumer(kafka)
    await handler!({ message: { value: Buffer.from(JSON.stringify(personPayload)) } })

    expect(mockUpsertPerson).toHaveBeenCalledWith(expect.objectContaining({ cpf: '12345678901' }))
  })

  it('ignora mensagem com value null', async () => {
    let handler: EachMessageHandler | undefined
    const kafka = makeKafka((h) => { handler = h }) as any

    await startPersonConsumer(kafka)
    await handler!({ message: { value: null } })

    expect(mockUpsertPerson).not.toHaveBeenCalled()
  })
})

describe('startAccountConsumer', () => {
  it('chama upsertAccount quando recebe mensagem válida', async () => {
    let handler: EachMessageHandler | undefined
    const kafka = makeKafka((h) => { handler = h }) as any

    await startAccountConsumer(kafka)
    await handler!({ message: { value: Buffer.from(JSON.stringify(accountPayload)) } })

    expect(mockUpsertAccount).toHaveBeenCalledWith(
      expect.objectContaining({ account_id: 10 }),
    )
  })
})

describe('startCardConsumer', () => {
  it('chama upsertCard quando recebe mensagem válida', async () => {
    let handler: EachMessageHandler | undefined
    const kafka = makeKafka((h) => { handler = h }) as any

    await startCardConsumer(kafka)
    await handler!({ message: { value: Buffer.from(JSON.stringify(cardPayload)) } })

    expect(mockUpsertCard).toHaveBeenCalledWith(
      expect.objectContaining({ card_id: 100 }),
    )
  })
})
