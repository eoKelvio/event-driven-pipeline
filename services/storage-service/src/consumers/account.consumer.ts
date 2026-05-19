import { Kafka, Producer } from 'kafkajs'
import { Topics, AccountEventSchema } from '@pipeline/shared'
import { upsertAccount } from '../repositories/account.repository.js'
import type { Database } from '../db/connection.js'
import type { Counter, Histogram } from 'prom-client'

type StorageMetrics = { eventsStored: Counter<'type' | 'status'>; upsertDuration: Histogram<'table'> }

export async function startAccountConsumer(kafka: Kafka, db: Database, producer: Producer, metrics: StorageMetrics) {
  const consumer = kafka.consumer({ groupId: 'storage-service-account' })
  await consumer.connect()
  await consumer.subscribe({ topic: Topics.ACCOUNT_RAW, fromBeginning: false })

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return

      const data = AccountEventSchema.parse(JSON.parse(message.value.toString()))

      const end = metrics.upsertDuration.startTimer({ table: 'account' })
      await upsertAccount(db, data)
      end()
      metrics.eventsStored.inc({ type: 'account', status: 'success' })

      await producer.send({
        topic: Topics.ACCOUNT_STORED,
        messages: [{ key: String(data.person_id), value: message.value }],
      })

      await producer.send({
        topic: Topics.CONSOLIDATION_TRIGGER,
        messages: [{ key: String(data.person_id), value: JSON.stringify({ person_id: data.person_id }) }],
      })
    },
  })

  return consumer
}
