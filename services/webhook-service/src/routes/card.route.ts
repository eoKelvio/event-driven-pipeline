import { FastifyInstance } from 'fastify'
import { WebhookEnvelopeSchema, CardSchema, Topics } from '@pipeline/shared'
import { decrypt } from '../crypto/rsa.js'

const envelopeBody = {
  type: 'object',
  required: ['body'],
  properties: {
    body: { type: 'string', description: 'RSA-OAEP encrypted payload (base64). Use POST /dev/encrypt/card to generate.' },
  },
} as const

export default async function cardRoute(fastify: FastifyInstance) {
  fastify.post('/card', {
    schema: {
      tags: ['Events'],
      summary: 'Ingest a card event',
      body: envelopeBody,
      response: {
        202: {
          description: 'Event accepted',
          type: 'object',
          properties: {
            accepted: { type: 'boolean' },
            event: { type: 'string' },
            event_time: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const envelope = WebhookEnvelopeSchema.parse(request.body)

    const endTimer = fastify.metrics.decryptDuration.startTimer()
    const decryptedBody = decrypt(envelope.body)
    endTimer()

    const payload = CardSchema.parse(JSON.parse(decryptedBody))
    const event_time = new Date().toISOString()

    await fastify.kafka.producer.send({
      topic: Topics.CARD_RAW,
      messages: [{ key: String(payload.account_id), value: JSON.stringify({ ...payload, event_time }) }],
    })

    fastify.metrics.eventsReceived.inc({ type: 'card', status: 'success' })
    return reply.status(202).send({ accepted: true, event: 'card.received', event_time })
  })
}
