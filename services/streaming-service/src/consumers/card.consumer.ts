import { Kafka } from 'kafkajs'
import { Topics, CardEventSchema } from '@pipeline/shared'
import { upsertCard } from '../repositories/customer.repository.js'

export async function startCardConsumer(kafka: Kafka) {
  const consumer = kafka.consumer({ groupId: 'streaming-service-card' })
  await consumer.connect()
  await consumer.subscribe({ topic: Topics.CARD_STORED, fromBeginning: false })

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return
      const data = CardEventSchema.parse(JSON.parse(message.value.toString()))
      await upsertCard(data)
    },
  })

  return consumer
}
