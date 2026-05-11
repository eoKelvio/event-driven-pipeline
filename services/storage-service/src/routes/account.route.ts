import { FastifyInstance } from 'fastify'
import { AccountEventSchema, Topics } from '@pipeline/shared'
import { upsertAccount } from '../repositories/account.repository.js'

export default async function accountRoute(fastify: FastifyInstance) {
  fastify.post('/account', async (request, reply) => {
    const data = AccountEventSchema.parse(request.body)

    const end = fastify.metrics.upsertDuration.startTimer({ table: 'account' })
    await upsertAccount(fastify.db, data)
    end()

    await fastify.kafka.producer.send({
      topic: Topics.ACCOUNT_STORED,
      messages: [{ key: String(data.person_id), value: JSON.stringify(data) }],
    })
    await fastify.kafka.producer.send({
      topic: Topics.CONSOLIDATION_TRIGGER,
      messages: [{ key: String(data.person_id), value: JSON.stringify({ person_id: data.person_id }) }],
    })

    fastify.metrics.eventsStored.inc({ type: 'account', status: 'success' })
    return reply.status(201).send({ stored: true })
  })
}
