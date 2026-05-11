import { FastifyInstance } from 'fastify'
import { WebhookEnvelopeSchema, PersonSchema, Topics } from '@pipeline/shared'
import { decrypt } from '../crypto/rsa.js'

export default async function personRoute(fastify: FastifyInstance) {
  fastify.post('/person', async (request, reply) => {
    const envelope = WebhookEnvelopeSchema.parse(request.body)

    const endTimer = fastify.metrics.decryptDuration.startTimer()
    const decryptedBody = decrypt(envelope.body)
    endTimer()

    const payload = PersonSchema.parse(JSON.parse(decryptedBody))

    await fastify.kafka.producer.send({
      topic: Topics.PERSON_RAW,
      messages: [{ key: payload.cpf, value: JSON.stringify({ ...payload, event_time: envelope.time }) }],
    })

    fastify.metrics.eventsReceived.inc({ type: 'person', status: 'success' })
    return reply.status(202).send({ accepted: true })
  })
}
