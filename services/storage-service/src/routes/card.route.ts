import { FastifyInstance } from 'fastify'
import { CardEventSchema, Topics } from '@pipeline/shared'
import { upsertCard } from '../repositories/card.repository.js'

export default async function cardRoute(fastify: FastifyInstance) {
  fastify.post('/card', {
    schema: {
      tags: ['Events'],
      summary: 'Upsert a card event',
      body: {
        type: 'object',
        required: ['card_id', 'card_number', 'account_id', 'status_id', 'limit', 'expiration_date', 'event_time'],
        properties: {
          card_id: { type: 'integer' },
          card_number: { type: 'string' },
          account_id: { type: 'integer' },
          status_id: { type: 'integer' },
          limit: { type: 'number' },
          expiration_date: { type: 'string' },
          event_time: { type: 'string', format: 'date-time' },
        },
      },
      response: {
        201: {
          description: 'Card stored',
          type: 'object',
          properties: { stored: { type: 'boolean' } },
        },
      },
    },
  }, async (request, reply) => {
    const data = CardEventSchema.parse(request.body)

    const end = fastify.metrics.upsertDuration.startTimer({ table: 'card' })
    await upsertCard(fastify.db, data)
    end()

    await fastify.kafka.producer.send({
      topic: Topics.CARD_STORED,
      messages: [{ key: String(data.account_id), value: JSON.stringify(data) }],
    })
    await fastify.kafka.producer.send({
      topic: Topics.CONSOLIDATION_TRIGGER,
      messages: [{ key: String(data.account_id), value: JSON.stringify({ account_id: data.account_id }) }],
    })

    fastify.metrics.eventsStored.inc({ type: 'card', status: 'success' })
    return reply.status(201).send({ stored: true })
  })
}
