import { Kafka, Producer } from 'kafkajs'
import { Topics, CardEventSchema } from '@pipeline/shared'
import { upsertCard } from '../repositories/card.repository.js'
import { getPersonIdByAccountId } from '../repositories/account.repository.js'
import type { Database } from '../db/connection.js'
import type { Counter, Histogram } from 'prom-client'

type StorageMetrics = { eventsStored: Counter<'type' | 'status'>; upsertDuration: Histogram<'table'> }

export async function startCardConsumer(kafka: Kafka, db: Database, producer: Producer, metrics: StorageMetrics) {
  const consumer = kafka.consumer({ groupId: 'storage-service-card' })
  await consumer.connect()
  await consumer.subscribe({ topic: Topics.CARD_RAW, fromBeginning: false })

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return

      const data = CardEventSchema.parse(JSON.parse(message.value.toString()))

      const end = metrics.upsertDuration.startTimer({ table: 'card' })
      await upsertCard(db, data)
      end()
      metrics.eventsStored.inc({ type: 'card', status: 'success' })

      await producer.send({
        topic: Topics.CARD_STORED,
        messages: [{ key: String(data.account_id), value: message.value }],
      })

      const personId = await getPersonIdByAccountId(db, data.account_id)
      if (personId === null) {
        console.warn(`[card] account ${data.account_id} not found — skipping consolidation trigger`)
        return
      }

      await producer.send({
        topic: Topics.CONSOLIDATION_TRIGGER,
        messages: [{ key: String(personId), value: JSON.stringify({ person_id: personId }) }],
      })
    },
  })

  return consumer
}
