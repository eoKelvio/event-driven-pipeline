import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PersonEvent, AccountEvent, CardEvent } from '@pipeline/shared'

const { mockUpsertPerson, mockUpsertAccount, mockUpsertCard, mockGetPersonId } = vi.hoisted(() => ({
  mockUpsertPerson: vi.fn().mockResolvedValue(undefined),
  mockUpsertAccount: vi.fn().mockResolvedValue(undefined),
  mockUpsertCard: vi.fn().mockResolvedValue(undefined),
  mockGetPersonId: vi.fn().mockResolvedValue(1),
}))

vi.mock('../../src/repositories/person.repository.js', () => ({ upsertPerson: mockUpsertPerson }))
vi.mock('../../src/repositories/account.repository.js', () => ({
  upsertAccount: mockUpsertAccount,
  getPersonIdByAccountId: mockGetPersonId,
}))
vi.mock('../../src/repositories/card.repository.js', () => ({ upsertCard: mockUpsertCard }))

type EachMessageHandler = (ctx: { message: { value: Buffer | null } }) => Promise<void>

function makeKafka(onRun: (handler: EachMessageHandler) => void) {
  return {
    consumer: vi.fn().mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockResolvedValue(undefined),
      run: vi.fn().mockImplementation(({ eachMessage }: { eachMessage: EachMessageHandler }) => {
        onRun(eachMessage)
        return Promise.resolve()
      }),
    }),
  }
}

const mockEndTimer = vi.fn()
const mockMetrics = {
  eventsStored: { inc: vi.fn() },
  upsertDuration: { startTimer: vi.fn().mockReturnValue(mockEndTimer) },
}
const mockProducerSend = vi.fn().mockResolvedValue(undefined)
const mockProducer = { send: mockProducerSend }
const mockDb = {} as any

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
  it('ignora mensagem com value null', async () => {
    let handler: EachMessageHandler | undefined
    const kafka = makeKafka((h) => { handler = h }) as any

    await startPersonConsumer(kafka, mockDb, mockProducer as any, mockMetrics as any)
    await handler!({ message: { value: null } })

    expect(mockUpsertPerson).not.toHaveBeenCalled()
  })

  it('chama upsertPerson e publica no Kafka', async () => {
    let handler: EachMessageHandler | undefined
    const kafka = makeKafka((h) => { handler = h }) as any
    const msgValue = Buffer.from(JSON.stringify(personPayload))

    await startPersonConsumer(kafka, mockDb, mockProducer as any, mockMetrics as any)
    await handler!({ message: { value: msgValue } })

    expect(mockUpsertPerson).toHaveBeenCalledWith(mockDb, expect.objectContaining({ cpf: '12345678901' }))
    expect(mockProducerSend).toHaveBeenCalledTimes(2)
    expect(mockMetrics.eventsStored.inc).toHaveBeenCalledWith({ type: 'person', status: 'success' })
    expect(mockEndTimer).toHaveBeenCalled()
  })

  it('trata erro de chave duplicada (código 23505) sem relançar', async () => {
    let handler: EachMessageHandler | undefined
    const kafka = makeKafka((h) => { handler = h }) as any
    mockUpsertPerson.mockRejectedValueOnce({ code: '23505' })

    await startPersonConsumer(kafka, mockDb, mockProducer as any, mockMetrics as any)
    await handler!({ message: { value: Buffer.from(JSON.stringify(personPayload)) } })

    expect(mockMetrics.eventsStored.inc).toHaveBeenCalledWith({ type: 'person', status: 'duplicate' })
    expect(mockProducerSend).not.toHaveBeenCalled()
  })

  it('relança erros que não são duplicatas', async () => {
    let handler: EachMessageHandler | undefined
    const kafka = makeKafka((h) => { handler = h }) as any
    mockUpsertPerson.mockRejectedValueOnce(new Error('DB error'))

    await startPersonConsumer(kafka, mockDb, mockProducer as any, mockMetrics as any)

    await expect(
      handler!({ message: { value: Buffer.from(JSON.stringify(personPayload)) } })
    ).rejects.toThrow('DB error')
  })
})

describe('startAccountConsumer', () => {
  it('ignora mensagem com value null', async () => {
    let handler: EachMessageHandler | undefined
    const kafka = makeKafka((h) => { handler = h }) as any

    await startAccountConsumer(kafka, mockDb, mockProducer as any, mockMetrics as any)
    await handler!({ message: { value: null } })

    expect(mockUpsertAccount).not.toHaveBeenCalled()
  })

  it('chama upsertAccount e publica no Kafka', async () => {
    let handler: EachMessageHandler | undefined
    const kafka = makeKafka((h) => { handler = h }) as any
    const msgValue = Buffer.from(JSON.stringify(accountPayload))

    await startAccountConsumer(kafka, mockDb, mockProducer as any, mockMetrics as any)
    await handler!({ message: { value: msgValue } })

    expect(mockUpsertAccount).toHaveBeenCalledWith(mockDb, expect.objectContaining({ account_id: 10 }))
    expect(mockProducerSend).toHaveBeenCalledTimes(2)
    expect(mockMetrics.eventsStored.inc).toHaveBeenCalledWith({ type: 'account', status: 'success' })
  })
})

describe('startCardConsumer', () => {
  it('ignora mensagem com value null', async () => {
    let handler: EachMessageHandler | undefined
    const kafka = makeKafka((h) => { handler = h }) as any

    await startCardConsumer(kafka, mockDb, mockProducer as any, mockMetrics as any)
    await handler!({ message: { value: null } })

    expect(mockUpsertCard).not.toHaveBeenCalled()
  })

  it('chama upsertCard e publica CARD_STORED e CONSOLIDATION_TRIGGER', async () => {
    let handler: EachMessageHandler | undefined
    const kafka = makeKafka((h) => { handler = h }) as any
    mockGetPersonId.mockResolvedValueOnce(1)

    await startCardConsumer(kafka, mockDb, mockProducer as any, mockMetrics as any)
    await handler!({ message: { value: Buffer.from(JSON.stringify(cardPayload)) } })

    expect(mockUpsertCard).toHaveBeenCalledWith(mockDb, expect.objectContaining({ card_id: 100 }))
    expect(mockProducerSend).toHaveBeenCalledTimes(2)
    expect(mockMetrics.eventsStored.inc).toHaveBeenCalledWith({ type: 'card', status: 'success' })
  })

  it('não publica CONSOLIDATION_TRIGGER quando account não é encontrada', async () => {
    let handler: EachMessageHandler | undefined
    const kafka = makeKafka((h) => { handler = h }) as any
    mockGetPersonId.mockResolvedValueOnce(null)

    await startCardConsumer(kafka, mockDb, mockProducer as any, mockMetrics as any)
    await handler!({ message: { value: Buffer.from(JSON.stringify(cardPayload)) } })

    expect(mockProducerSend).toHaveBeenCalledTimes(1)
  })
})
