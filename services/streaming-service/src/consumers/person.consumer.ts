import { Kafka } from 'kafkajs'
import { Topics, PersonEventSchema } from '@pipeline/shared'
import { upsertPerson } from '../repositories/customer.repository.js'

export async function startPersonConsumer(kafka: Kafka) {
  const consumer = kafka.consumer({ groupId: 'streaming-service-person' })
  await consumer.connect()
  await consumer.subscribe({ topic: Topics.PERSON_STORED, fromBeginning: false })

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return
      const data = PersonEventSchema.parse(JSON.parse(message.value.toString()))
      await upsertPerson(data)
    },
  })

  return consumer
}
