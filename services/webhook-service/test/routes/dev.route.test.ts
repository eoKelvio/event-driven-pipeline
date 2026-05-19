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

    const response = await app.inject({ method: 'POST', url: '/dev/encrypt', body: {} })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ encrypted: 'empty-encrypted' })
  })
})

describe('POST /dev/encrypt/person', () => {
  it('criptografa payload de pessoa e retorna string base64', async () => {
    mockEncrypt.mockReturnValue('person-encrypted')

    const payload = { person_id: 1, name: 'João Silva', email: 'joao@example.com', gender: 'M', birth_date: '1990/01/15', address: 'Rua A', salary: 5000, cpf: '12345678900' }
    const response = await app.inject({ method: 'POST', url: '/dev/encrypt/person', body: payload })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ encrypted: 'person-encrypted' })
    expect(mockEncrypt).toHaveBeenCalledWith(JSON.stringify(payload))
  })

  it('retorna 400 quando campos obrigatórios estão ausentes', async () => {
    const response = await app.inject({ method: 'POST', url: '/dev/encrypt/person', body: { name: 'João' } })
    expect(response.statusCode).toBe(400)
  })
})

describe('POST /dev/encrypt/account', () => {
  it('criptografa payload de conta e retorna string base64', async () => {
    mockEncrypt.mockReturnValue('account-encrypted')

    const payload = { account_id: 1, status_id: 1, due_day: 10, person_id: 1, balance: 1000, available_balance: 800 }
    const response = await app.inject({ method: 'POST', url: '/dev/encrypt/account', body: payload })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ encrypted: 'account-encrypted' })
    expect(mockEncrypt).toHaveBeenCalledWith(JSON.stringify(payload))
  })

  it('retorna 400 quando campos obrigatórios estão ausentes', async () => {
    const response = await app.inject({ method: 'POST', url: '/dev/encrypt/account', body: { account_id: 1 } })
    expect(response.statusCode).toBe(400)
  })
})

describe('POST /dev/encrypt/card', () => {
  it('criptografa payload de cartão e retorna string base64', async () => {
    mockEncrypt.mockReturnValue('card-encrypted')

    const payload = { card_id: 1, card_number: '1234567890123456', account_id: 1, status_id: 1, limit: 5000, expiration_date: '12/2028' }
    const response = await app.inject({ method: 'POST', url: '/dev/encrypt/card', body: payload })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ encrypted: 'card-encrypted' })
    expect(mockEncrypt).toHaveBeenCalledWith(JSON.stringify(payload))
  })

  it('retorna 400 quando campos obrigatórios estão ausentes', async () => {
    const response = await app.inject({ method: 'POST', url: '/dev/encrypt/card', body: { card_id: 1 } })
    expect(response.statusCode).toBe(400)
  })
})
