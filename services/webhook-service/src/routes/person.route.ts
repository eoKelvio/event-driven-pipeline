import { FastifyInstance } from 'fastify'
import { WebhookEnvelopeSchema, PersonSchema, Topics } from '@pipeline/shared'
import { decrypt } from '../crypto/rsa.js'

const envelopeBody = {
  type: 'object',
  required: ['body'],
  properties: {
    body: { type: 'string', description: 'RSA-OAEP encrypted payload (base64). Use POST /dev/encrypt/person to generate.' },
  },
} as const

export default async function personRoute(fastify: FastifyInstance) {
  fastify.post('/person', {
    schema: {
      tags: ['Events'],
      summary: 'Ingest a person event',
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

    const payload = PersonSchema.parse(JSON.parse(decryptedBody))
    const event_time = new Date().toISOString()

    await fastify.kafka.producer.send({
      topic: Topics.PERSON_RAW,
      messages: [{ key: payload.cpf, value: JSON.stringify({ ...payload, event_time }) }],
    })

    fastify.metrics.eventsReceived.inc({ type: 'person', status: 'success' })
    return reply.status(202).send({ accepted: true, event: 'person.received', event_time })
  })
}
