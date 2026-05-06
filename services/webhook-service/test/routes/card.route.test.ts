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

const validCard = {
  card_id: 100,
  card_number: '4111111111111111',
  account_id: 10,
  status_id: 1,
  limit: 5000.0,
  expiration_date: '12/2028',
}

const envelope = { time: new Date().toISOString(), body: 'encrypted', event: 'card' }

let app: FastifyInstance

beforeAll(async () => { app = await buildApp() })
afterAll(async () => { await app.close() })

describe('POST /card', () => {
  it('retorna 202 e publica no Kafka quando o payload é válido', async () => {
    mockDecrypt.mockReturnValue(JSON.stringify(validCard))

    const response = await app.inject({ method: 'POST', url: '/card', body: envelope })

    expect(response.statusCode).toBe(202)
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ topic: 'events.card.raw' }),
    )
  })

  it('retorna 400 quando o payload decriptado é inválido', async () => {
    mockDecrypt.mockReturnValue(JSON.stringify({ card_id: 'errado' }))

    const response = await app.inject({ method: 'POST', url: '/card', body: envelope })

    expect(response.statusCode).toBe(400)
  })
})
