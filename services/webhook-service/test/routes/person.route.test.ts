import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { FastifyInstance } from 'fastify'

// mockSend precisa existir antes do vi.mock (hoisted resolve isso)
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

const validPerson = {
  person_id: 1,
  name: 'João Silva',
  email: 'joao@example.com',
  gender: 'M',
  birth_date: '1990/05/20',
  address: 'Rua das Flores, 100',
  salary: 5000.0,
  cpf: '12345678901',
}

const envelope = (payload: object) => ({
  time: new Date().toISOString(),
  body: 'encrypted',
  event: 'person',
})

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
})

afterAll(async () => {
  await app.close()
})

describe('POST /person', () => {
  it('retorna 202 e publica no Kafka quando o payload é válido', async () => {
    mockDecrypt.mockReturnValue(JSON.stringify(validPerson))

    const response = await app.inject({
      method: 'POST',
      url: '/person',
      body: envelope(validPerson),
    })

    expect(response.statusCode).toBe(202)
    expect(JSON.parse(response.body)).toEqual({ accepted: true })
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'events.person.raw',
        messages: expect.arrayContaining([
          expect.objectContaining({ key: validPerson.cpf }),
        ]),
      }),
    )
  })

  it('retorna 400 quando o envelope está incompleto', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/person',
      body: { time: new Date().toISOString() }, // faltam body e event
    })

    expect(response.statusCode).toBe(400)
  })

  it('retorna 400 quando o payload decriptado não bate com o schema', async () => {
    mockDecrypt.mockReturnValue(JSON.stringify({ person_id: 'nao-e-numero' }))

    const response = await app.inject({
      method: 'POST',
      url: '/person',
      body: envelope({}),
    })

    expect(response.statusCode).toBe(400)
  })
})
