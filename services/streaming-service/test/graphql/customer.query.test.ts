import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { FastifyInstance } from 'fastify'

const { mockFindByCpf } = vi.hoisted(() => ({
  mockFindByCpf: vi.fn(),
}))

vi.mock('kafkajs', () => ({
  Kafka: vi.fn().mockImplementation(() => ({
    consumer: vi.fn().mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockResolvedValue(undefined),
      run: vi.fn().mockResolvedValue(undefined),
    }),
  })),
}))

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../../src/repositories/customer.repository.js', () => ({
  upsertPerson: vi.fn(),
  upsertAccount: vi.fn(),
  upsertCard: vi.fn(),
  findByCpf: mockFindByCpf,
}))

const { buildApp } = await import('../../src/app.js')

const mockCustomer = {
  cpf: '12345678901',
  person_id: 1,
  name: 'João Silva',
  email: 'joao@example.com',
  gender: 'M',
  birth_date: '1990/05/20',
  address: 'Rua das Flores, 100',
  salary: 5000.0,
  accounts: [
    {
      account_id: 10,
      status_id: 1,
      due_day: 10,
      balance: 1000.0,
      available_balance: 800.0,
      cards: [
        {
          card_id: 100,
          card_number: '4111111111111111',
          status_id: 1,
          limit: 5000.0,
          expiration_date: '2028/12',
        },
      ],
    },
  ],
}

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
})

afterAll(async () => {
  await app.close()
})

const CUSTOMER_QUERY = `
  query GetCustomer($cpf: String!) {
    customer(cpf: $cpf) {
      cpf
      name
      email
      salary
      accounts {
        account_id
        balance
        cards {
          card_id
          card_number
          limit
        }
      }
    }
  }
`

describe('GraphQL query: customer', () => {
  it('retorna dados do cliente quando encontrado', async () => {
    mockFindByCpf.mockResolvedValue(mockCustomer)

    const response = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: CUSTOMER_QUERY,
        variables: { cpf: '12345678901' },
      }),
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data.customer.cpf).toBe('12345678901')
    expect(body.data.customer.name).toBe('João Silva')
    expect(body.data.customer.accounts).toHaveLength(1)
    expect(body.data.customer.accounts[0].cards).toHaveLength(1)
  })

  it('retorna null quando cliente não existe', async () => {
    mockFindByCpf.mockResolvedValue(null)

    const response = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: CUSTOMER_QUERY,
        variables: { cpf: '00000000000' },
      }),
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data.customer).toBeNull()
  })
})
