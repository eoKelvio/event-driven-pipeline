import { FastifyInstance } from 'fastify'
import { WebhookEnvelopeSchema, CardSchema, Topics } from '@pipeline/shared'
import { decrypt } from '../crypto/rsa.js'

export default async function cardRoute(fastify: FastifyInstance) {
  fastify.post('/card', async (request, reply) => {
    const envelope = WebhookEnvelopeSchema.parse(request.body)

    const endTimer = fastify.metrics.decryptDuration.startTimer()
    const decryptedBody = decrypt(envelope.body)
    endTimer()

    const payload = CardSchema.parse(JSON.parse(decryptedBody))

    await fastify.kafka.producer.send({
      topic: Topics.CARD_RAW,
      messages: [{ key: String(payload.account_id), value: JSON.stringify({ ...payload, event_time: envelope.time }) }],
    })

    fastify.metrics.eventsReceived.inc({ type: 'card', status: 'success' })
    return reply.status(202).send({ accepted: true })
  })
}
