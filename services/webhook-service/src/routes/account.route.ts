import { FastifyInstance } from 'fastify'
import { WebhookEnvelopeSchema, AccountSchema, Topics } from '@pipeline/shared'
import { decrypt } from '../crypto/rsa.js'

export default async function accountRoute(fastify: FastifyInstance) {
  fastify.post('/account', async (request, reply) => {
    const envelope = WebhookEnvelopeSchema.parse(request.body)

    const endTimer = fastify.metrics.decryptDuration.startTimer()
    const decryptedBody = decrypt(envelope.body)
    endTimer()

    const payload = AccountSchema.parse(JSON.parse(decryptedBody))

    await fastify.kafka.producer.send({
      topic: Topics.ACCOUNT_RAW,
      messages: [{ key: String(payload.person_id), value: JSON.stringify(payload) }],
    })

    fastify.metrics.eventsReceived.inc({ type: 'account', status: 'success' })
    return reply.status(202).send({ accepted: true })
  })
}
