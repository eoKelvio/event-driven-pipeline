import { FastifyInstance } from 'fastify'
import { encrypt } from '../crypto/rsa.js'

export default async function devRoute(fastify: FastifyInstance) {
  fastify.post('/dev/encrypt', {
    schema: {
      tags: ['Dev'],
      summary: 'Encrypt a JSON payload for local testing',
      body: {
        type: 'object',
        description: 'Any JSON object to be RSA-OAEP encrypted',
      },
      response: {
        200: {
          type: 'object',
          properties: { encrypted: { type: 'string', description: 'Base64-encoded encrypted payload' } },
        },
      },
    },
  }, async (request, reply) => {
    const encrypted = encrypt(JSON.stringify(request.body))
    return reply.send({ encrypted })
  })
}
