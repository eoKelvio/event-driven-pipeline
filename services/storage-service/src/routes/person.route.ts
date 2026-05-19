import { FastifyInstance } from 'fastify'
import { PersonEventSchema, Topics } from '@pipeline/shared'
import { upsertPerson } from '../repositories/person.repository.js'

export default async function personRoute(fastify: FastifyInstance) {
  fastify.post('/person', {
    schema: {
      tags: ['Events'],
      summary: 'Upsert a person event',
      body: {
        type: 'object',
        required: ['person_id', 'name', 'email', 'gender', 'birth_date', 'address', 'salary', 'cpf', 'event_time'],
        properties: {
          person_id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          gender: { type: 'string', enum: ['M', 'F'] },
          birth_date: { type: 'string', description: 'YYYY/MM/DD' },
          address: { type: 'string' },
          salary: { type: 'number' },
          cpf: { type: 'string' },
          event_time: { type: 'string', format: 'date-time' },
        },
      },
      response: {
        201: {
          description: 'Person stored',
          type: 'object',
          properties: { stored: { type: 'boolean' } },
        },
      },
    },
  }, async (request, reply) => {
    const data = PersonEventSchema.parse(request.body)

    const end = fastify.metrics.upsertDuration.startTimer({ table: 'person' })
    await upsertPerson(fastify.db, data)
    end()

    await fastify.kafka.producer.send({
      topic: Topics.PERSON_STORED,
      messages: [{ key: data.cpf, value: JSON.stringify(data) }],
    })
    await fastify.kafka.producer.send({
      topic: Topics.CONSOLIDATION_TRIGGER,
      messages: [{ key: data.cpf, value: JSON.stringify({ cpf: data.cpf }) }],
    })

    fastify.metrics.eventsStored.inc({ type: 'person', status: 'success' })
    return reply.status(201).send({ stored: true })
  })
}
