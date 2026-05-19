import { Kafka, Producer } from 'kafkajs'
import { Topics, PersonEventSchema } from '@pipeline/shared'
import { upsertPerson } from '../repositories/person.repository.js'
import type { Database } from '../db/connection.js'
import type { Counter, Histogram } from 'prom-client'

type StorageMetrics = { eventsStored: Counter<'type' | 'status'>; upsertDuration: Histogram<'table'> }

export async function startPersonConsumer(kafka: Kafka, db: Database, producer: Producer, metrics: StorageMetrics) {
  const consumer = kafka.consumer({ groupId: 'storage-service-person' })
  await consumer.connect()
  await consumer.subscribe({ topic: Topics.PERSON_RAW, fromBeginning: false })

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return

      const data = PersonEventSchema.parse(JSON.parse(message.value.toString()))

      try {
        const end = metrics.upsertDuration.startTimer({ table: 'person' })
        await upsertPerson(db, data)
        end()
      } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'code' in err && err.code === '23505') {
          console.warn(`[person] duplicate rejected — cpf or email already exists: ${data.cpf}`)
          metrics.eventsStored.inc({ type: 'person', status: 'duplicate' })
          return
        }
        throw err
      }

      metrics.eventsStored.inc({ type: 'person', status: 'success' })

      await producer.send({
        topic: Topics.PERSON_STORED,
        messages: [{ key: data.cpf, value: message.value }],
      })

      await producer.send({
        topic: Topics.CONSOLIDATION_TRIGGER,
        messages: [{ key: String(data.person_id), value: JSON.stringify({ person_id: data.person_id }) }],
      })
    },
  })

  return consumer
}
