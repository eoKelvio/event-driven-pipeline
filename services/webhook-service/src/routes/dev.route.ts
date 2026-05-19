import { FastifyInstance } from 'fastify'
import { encrypt } from '../crypto/rsa.js'

const encryptedResponse = {
  200: {
    type: 'object',
    properties: { encrypted: { type: 'string', description: 'Base64-encoded RSA-OAEP encrypted payload. Use as the body field in the main endpoints.' } },
  },
} as const

export default async function devRoute(fastify: FastifyInstance) {
  fastify.post('/dev/encrypt', {
    schema: {
      tags: ['Dev'],
      summary: 'Encrypt any JSON payload',
      body: { type: 'object', description: 'Any JSON object to be RSA-OAEP encrypted' },
      response: encryptedResponse,
    },
  }, async (request, reply) => {
    return reply.send({ encrypted: encrypt(JSON.stringify(request.body)) })
  })

  fastify.post('/dev/encrypt/person', {
    schema: {
      tags: ['Dev'],
      summary: 'Encrypt a person payload',
      body: {
        type: 'object',
        required: ['person_id', 'name', 'email', 'gender', 'birth_date', 'address', 'salary', 'cpf'],
        properties: {
          person_id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'João Silva' },
          email: { type: 'string', format: 'email', example: 'joao@example.com' },
          gender: { type: 'string', enum: ['M', 'F'], example: 'M' },
          birth_date: { type: 'string', description: 'YYYY/MM/DD', example: '1990/01/15' },
          address: { type: 'string', example: 'Rua das Flores, 123' },
          salary: { type: 'number', example: 5000.00 },
          cpf: { type: 'string', example: '12345678900' },
        },
      },
      response: encryptedResponse,
    },
  }, async (request, reply) => {
    return reply.send({ encrypted: encrypt(JSON.stringify(request.body)) })
  })

  fastify.post('/dev/encrypt/account', {
    schema: {
      tags: ['Dev'],
      summary: 'Encrypt an account payload',
      body: {
        type: 'object',
        required: ['account_id', 'status_id', 'due_day', 'person_id', 'balance', 'available_balance'],
        properties: {
          account_id: { type: 'integer', example: 1 },
          status_id: { type: 'integer', example: 1 },
          due_day: { type: 'integer', example: 10 },
          person_id: { type: 'integer', example: 1 },
          balance: { type: 'number', example: 1000.00 },
          available_balance: { type: 'number', example: 800.00 },
        },
      },
      response: encryptedResponse,
    },
  }, async (request, reply) => {
    return reply.send({ encrypted: encrypt(JSON.stringify(request.body)) })
  })

  fastify.post('/dev/encrypt/card', {
    schema: {
      tags: ['Dev'],
      summary: 'Encrypt a card payload',
      body: {
        type: 'object',
        required: ['card_id', 'card_number', 'account_id', 'status_id', 'limit', 'expiration_date'],
        properties: {
          card_id: { type: 'integer', example: 1 },
          card_number: { type: 'string', example: '1234567890123456' },
          account_id: { type: 'integer', example: 1 },
          status_id: { type: 'integer', example: 1 },
          limit: { type: 'number', example: 5000.00 },
          expiration_date: { type: 'string', example: '12/2028' },
        },
      },
      response: encryptedResponse,
    },
  }, async (request, reply) => {
    return reply.send({ encrypted: encrypt(JSON.stringify(request.body)) })
  })
}
