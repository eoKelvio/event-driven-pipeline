import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { FastifyInstance } from 'fastify'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn().mockResolvedValue(undefined) }))
const { mockDecrypt } = vi.hoisted(() => ({ mockDecrypt: vi.fn() }))

vi.mock('kafkajs', () => ({
  Kafka: vi.fn().mockImplementation(() => ({
    producer: vi.fn().mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      send: mockSend,
    }),
  })),
}))

vi.mock('../../src/crypto/rsa.js', () => ({ decrypt: mockDecrypt }))

const { buildApp } = await import('../../src/app.js')

const validAccount = {
  account_id: 10,
  status_id: 1,
  due_day: 15,
  person_id: 1,
  balance: 1000.0,
  available_balance: 800.0,
}

const envelope = { time: new Date().toISOString(), body: 'encrypted', event: 'account' }

let app: FastifyInstance

beforeAll(async () => { app = await buildApp() })
afterAll(async () => { await app.close() })

describe('POST /account', () => {
  it('retorna 202 e publica no Kafka quando o payload é válido', async () => {
    mockDecrypt.mockReturnValue(JSON.stringify(validAccount))

    const response = await app.inject({ method: 'POST', url: '/account', body: envelope })

    expect(response.statusCode).toBe(202)
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ topic: 'events.account.raw' }),
    )
  })

  it('retorna 400 quando o payload decriptado é inválido', async () => {
    mockDecrypt.mockReturnValue(JSON.stringify({ account_id: 'errado' }))

    const response = await app.inject({ method: 'POST', url: '/account', body: envelope })

    expect(response.statusCode).toBe(400)
  })
})
