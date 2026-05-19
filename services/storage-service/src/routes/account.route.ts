import { FastifyInstance } from 'fastify'
import { AccountEventSchema, Topics } from '@pipeline/shared'
import { upsertAccount } from '../repositories/account.repository.js'

export default async function accountRoute(fastify: FastifyInstance) {
  fastify.post('/account', {
    schema: {
      tags: ['Events'],
      summary: 'Upsert an account event',
      body: {
        type: 'object',
        required: ['account_id', 'status_id', 'due_day', 'person_id', 'balance', 'available_balance', 'event_time'],
        properties: {
          account_id: { type: 'integer' },
          status_id: { type: 'integer' },
          due_day: { type: 'integer' },
          person_id: { type: 'integer' },
          balance: { type: 'number' },
          available_balance: { type: 'number' },
          event_time: { type: 'string', format: 'date-time' },
        },
      },
      response: {
        201: {
          description: 'Account stored',
          type: 'object',
          properties: { stored: { type: 'boolean' } },
        },
      },
    },
  }, async (request, reply) => {
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
