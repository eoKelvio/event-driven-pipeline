import { FastifyInstance } from 'fastify'
import { PersonEventSchema, Topics } from '@pipeline/shared'
import { upsertPerson } from '../repositories/person.repository.js'

export default async function personRoute(fastify: FastifyInstance) {
  fastify.post('/person', async (request, reply) => {
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
