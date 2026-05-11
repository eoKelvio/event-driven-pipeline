import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { FastifyInstance } from 'fastify'
import type { AccountEvent } from '@pipeline/shared'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn().mockResolvedValue(undefined) }))
const { mockUpsert } = vi.hoisted(() => ({ mockUpsert: vi.fn().mockResolvedValue(undefined) }))

vi.mock('kafkajs', () => ({
  Kafka: vi.fn().mockImplementation(() => ({
    producer: vi.fn().mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      send: mockSend,
    }),
    consumer: vi.fn().mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockResolvedValue(undefined),
      run: vi.fn().mockResolvedValue(undefined),
    }),
  })),
}))

vi.mock('postgres', () => ({ default: vi.fn().mockReturnValue({}) }))
vi.mock('drizzle-orm/postgres-js', () => ({ drizzle: vi.fn().mockReturnValue({}) }))
vi.mock('../../src/repositories/account.repository.js', () => ({ upsertAccount: mockUpsert }))

const { buildApp } = await import('../../src/app.js')

const validAccount: AccountEvent = {
  account_id: 10,
  status_id: 1,
  due_day: 15,
  person_id: 1,
  balance: 1000.0,
  available_balance: 800.0,
  event_time: new Date().toISOString(),
}

let app: FastifyInstance

beforeAll(async () => { app = await buildApp() })
afterAll(async () => { await app.close() })

describe('POST /account', () => {
  it('retorna 201 e chama upsert e Kafka quando o payload é válido', async () => {
    const response = await app.inject({ method: 'POST', url: '/account', body: validAccount })

    expect(response.statusCode).toBe(201)
    expect(mockUpsert).toHaveBeenCalledOnce()
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ topic: 'events.account.stored' }),
    )
  })

  it('retorna 400 quando o payload é inválido', async () => {
    const response = await app.inject({ method: 'POST', url: '/account', body: { account_id: 'errado' } })
    expect(response.statusCode).toBe(400)
  })
})
