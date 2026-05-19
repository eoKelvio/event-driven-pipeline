import { FastifyInstance } from 'fastify'
import { encrypt } from '../crypto/rsa.js'

export default async function devRoute(fastify: FastifyInstance) {
  fastify.post('/dev/encrypt', async (request, reply) => {
    const encrypted = encrypt(JSON.stringify(request.body))
    return reply.send({ encrypted })
  })
}
