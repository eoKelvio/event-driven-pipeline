import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { FastifyInstance } from 'fastify'

const { mockEncrypt } = vi.hoisted(() => ({ mockEncrypt: vi.fn() }))

vi.mock('kafkajs', () => ({
  Kafka: vi.fn().mockImplementation(() => ({
    producer: vi.fn().mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      send: vi.fn().mockResolvedValue(undefined),
    }),
  })),
}))

vi.mock('../../src/crypto/rsa.js', () => ({
  decrypt: vi.fn(),
  encrypt: mockEncrypt,
}))

const { buildApp } = await import('../../src/app.js')

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
})

afterAll(async () => {
  await app.close()
})

describe('POST /dev/encrypt', () => {
  it('retorna o payload criptografado', async () => {
    mockEncrypt.mockReturnValue('encrypted-value')

    const response = await app.inject({
      method: 'POST',
      url: '/dev/encrypt',
      body: { name: 'João', cpf: '12345678901' },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ encrypted: 'encrypted-value' })
    expect(mockEncrypt).toHaveBeenCalledWith(JSON.stringify({ name: 'João', cpf: '12345678901' }))
  })

  it('funciona com body vazio', async () => {
    mockEncrypt.mockReturnValue('empty-encrypted')

    const response = await app.inject({
      method: 'POST',
      url: '/dev/encrypt',
      body: {},
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ encrypted: 'empty-encrypted' })
  })
})
