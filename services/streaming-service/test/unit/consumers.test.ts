import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFindOneAndUpdate } = vi.hoisted(() => ({
  mockFindOneAndUpdate: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/models/customer.model.js', () => ({
  Customer: { findOneAndUpdate: mockFindOneAndUpdate },
}))

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
  upsertTotal: { inc: vi.fn() },
  consolidationDuration: { startTimer: vi.fn().mockReturnValue(mockEndTimer) },
}

const mockProducerSend = vi.fn().mockResolvedValue(undefined)
const mockProducer = { send: mockProducerSend }

const { startConsolidationConsumer } = await import('../../src/consumers/consolidation.consumer.js')

beforeEach(() => vi.clearAllMocks())

const personRow = {
  person_id: 1,
  cpf: '12345678901',
  name: 'João',
  email: 'joao@example.com',
  gender: 'M',
  birth_date: '1990-01-15',
  address: 'Rua A, 1',
  salary: '5000.00',
  account_id: null,
  account_status_id: null,
  due_day: null,
  balance: null,
  available_balance: null,
  card_id: null,
  card_number: null,
  card_status_id: null,
  credit_limit: null,
  expiration_date: null,
}

describe('startConsolidationConsumer', () => {
  it('ignora mensagem com value null', async () => {
    let handler: EachMessageHandler | undefined
    const kafka = makeKafka((h) => { handler = h }) as any
    const sql = vi.fn().mockResolvedValue([])

    await startConsolidationConsumer(kafka, mockProducer as any, sql as any, mockMetrics as any)
    await handler!({ message: { value: null } })

    expect(sql).not.toHaveBeenCalled()
    expect(mockFindOneAndUpdate).not.toHaveBeenCalled()
  })

  it('ignora mensagem sem person_id', async () => {
    let handler: EachMessageHandler | undefined
    const kafka = makeKafka((h) => { handler = h }) as any
    const sql = vi.fn().mockResolvedValue([])

    await startConsolidationConsumer(kafka, mockProducer as any, sql as any, mockMetrics as any)
    await handler!({ message: { value: Buffer.from(JSON.stringify({ other: 'data' })) } })

    expect(sql).not.toHaveBeenCalled()
    expect(mockFindOneAndUpdate).not.toHaveBeenCalled()
  })

  it('ignora quando SQL não retorna linhas', async () => {
    let handler: EachMessageHandler | undefined
    const kafka = makeKafka((h) => { handler = h }) as any
    const sql = vi.fn().mockResolvedValue([])

    await startConsolidationConsumer(kafka, mockProducer as any, sql as any, mockMetrics as any)
    await handler!({ message: { value: Buffer.from(JSON.stringify({ person_id: 1 })) } })

    expect(mockFindOneAndUpdate).not.toHaveBeenCalled()
    expect(mockProducerSend).not.toHaveBeenCalled()
  })

  it('chama findOneAndUpdate e producer.send no caminho feliz (só pessoa)', async () => {
    let handler: EachMessageHandler | undefined
    const kafka = makeKafka((h) => { handler = h }) as any
    const sql = vi.fn().mockResolvedValue([personRow])

    await startConsolidationConsumer(kafka, mockProducer as any, sql as any, mockMetrics as any)
    await handler!({ message: { value: Buffer.from(JSON.stringify({ person_id: 1 })) } })

    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { person_id: 1 },
      expect.objectContaining({
        $set: expect.objectContaining({ cpf: '12345678901', name: 'João', accounts: [] }),
      }),
      { upsert: true },
    )
    expect(mockProducerSend).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'events.customer.stored',
        messages: expect.arrayContaining([
          expect.objectContaining({ key: '1' }),
        ]),
      }),
    )
  })

  it('incrementa métrica upsertTotal após consolidação', async () => {
    let handler: EachMessageHandler | undefined
    const kafka = makeKafka((h) => { handler = h }) as any
    const sql = vi.fn().mockResolvedValue([personRow])

    await startConsolidationConsumer(kafka, mockProducer as any, sql as any, mockMetrics as any)
    await handler!({ message: { value: Buffer.from(JSON.stringify({ person_id: 1 })) } })

    expect(mockMetrics.upsertTotal.inc).toHaveBeenCalledWith({ type: 'consolidation' })
    expect(mockEndTimer).toHaveBeenCalled()
  })

  it('converte birth_date Date para string ISO', async () => {
    let handler: EachMessageHandler | undefined
    const kafka = makeKafka((h) => { handler = h }) as any
    const rowWithDate = { ...personRow, birth_date: new Date('1990-01-15T00:00:00.000Z') }
    const sql = vi.fn().mockResolvedValue([rowWithDate])

    await startConsolidationConsumer(kafka, mockProducer as any, sql as any, mockMetrics as any)
    await handler!({ message: { value: Buffer.from(JSON.stringify({ person_id: 1 })) } })

    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        $set: expect.objectContaining({ birth_date: '1990-01-15' }),
      }),
      expect.anything(),
    )
  })

  it('monta hierarquia de contas e cartões corretamente', async () => {
    let handler: EachMessageHandler | undefined
    const kafka = makeKafka((h) => { handler = h }) as any
    const rowWithAccount = {
      ...personRow,
      account_id: 10,
      account_status_id: 1,
      due_day: 5,
      balance: '500.00',
      available_balance: '400.00',
      card_id: 100,
      card_number: '4111111111111111',
      card_status_id: 1,
      credit_limit: '2000.00',
      expiration_date: '2030/01',
    }
    const sql = vi.fn().mockResolvedValue([rowWithAccount])

    await startConsolidationConsumer(kafka, mockProducer as any, sql as any, mockMetrics as any)
    await handler!({ message: { value: Buffer.from(JSON.stringify({ person_id: 1 })) } })

    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { person_id: 1 },
      expect.objectContaining({
        $set: expect.objectContaining({
          accounts: [
            expect.objectContaining({
              account_id: 10,
              cards: [expect.objectContaining({ card_id: 100 })],
            }),
          ],
        }),
      }),
      { upsert: true },
    )
  })
})
