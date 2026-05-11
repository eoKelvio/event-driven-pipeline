import { Kafka, Producer } from 'kafkajs'
import { Topics, CardEventSchema } from '@pipeline/shared'
import { upsertCard } from '../repositories/card.repository.js'
import type { Database } from '../db/connection.js'

export async function startCardConsumer(kafka: Kafka, db: Database, producer: Producer) {
  const consumer = kafka.consumer({ groupId: 'storage-service-card' })
  await consumer.connect()
  await consumer.subscribe({ topic: Topics.CARD_RAW, fromBeginning: false })

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return

      const data = CardEventSchema.parse(JSON.parse(message.value.toString()))
      await upsertCard(db, data)

      await producer.send({
        topic: Topics.CARD_STORED,
        messages: [{ key: String(data.account_id), value: message.value }],
      })

      await producer.send({
        topic: Topics.CONSOLIDATION_TRIGGER,
        messages: [{ key: String(data.account_id), value: JSON.stringify({ account_id: data.account_id }) }],
      })
    },
  })

  return consumer
}
