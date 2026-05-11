import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { FastifyInstance } from 'fastify'
import type { PersonEvent } from '@pipeline/shared'

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
vi.mock('../../src/repositories/person.repository.js', () => ({ upsertPerson: mockUpsert }))

const { buildApp } = await import('../../src/app.js')

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

let app: FastifyInstance

beforeAll(async () => { app = await buildApp() })
afterAll(async () => { await app.close() })

describe('POST /person', () => {
  it('retorna 201 e chama upsert e Kafka quando o payload é válido', async () => {
    const response = await app.inject({ method: 'POST', url: '/person', body: validPerson })

    expect(response.statusCode).toBe(201)
    expect(JSON.parse(response.body)).toEqual({ stored: true })
    expect(mockUpsert).toHaveBeenCalledOnce()
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ topic: 'events.person.stored' }),
    )
  })

  it('retorna 400 quando faltam campos obrigatórios', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/person',
      body: { person_id: 1 },
    })
    expect(response.statusCode).toBe(400)
  })

  it('retorna 400 quando event_time está ausente', async () => {
    const { event_time, ...withoutTime } = validPerson
    const response = await app.inject({ method: 'POST', url: '/person', body: withoutTime })
    expect(response.statusCode).toBe(400)
  })
})
