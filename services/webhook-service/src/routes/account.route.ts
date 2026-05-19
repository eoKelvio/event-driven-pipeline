import { FastifyInstance } from 'fastify'
import { WebhookEnvelopeSchema, AccountSchema, Topics } from '@pipeline/shared'
import { decrypt } from '../crypto/rsa.js'

const envelopeBody = {
  type: 'object',
  required: ['time', 'body', 'event'],
  properties: {
    time: { type: 'string', format: 'date-time', description: 'Event timestamp' },
    body: { type: 'string', description: 'RSA-OAEP encrypted payload (base64)' },
    event: { type: 'string', description: 'Event type identifier' },
  },
} as const

export default async function accountRoute(fastify: FastifyInstance) {
  fastify.post('/account', {
    schema: {
      tags: ['Events'],
      summary: 'Ingest an account event',
      body: envelopeBody,
      response: {
        202: {
          description: 'Event accepted',
          type: 'object',
          properties: { accepted: { type: 'boolean' } },
        },
      },
    },
  }, async (request, reply) => {
    const envelope = WebhookEnvelopeSchema.parse(request.body)

    const endTimer = fastify.metrics.decryptDuration.startTimer()
    const decryptedBody = decrypt(envelope.body)
    endTimer()

    const payload = AccountSchema.parse(JSON.parse(decryptedBody))

    await fastify.kafka.producer.send({
      topic: Topics.ACCOUNT_RAW,
      messages: [{ key: String(payload.person_id), value: JSON.stringify({ ...payload, event_time: envelope.time }) }],
    })

    fastify.metrics.eventsReceived.inc({ type: 'account', status: 'success' })
    return reply.status(202).send({ accepted: true })
  })
}
