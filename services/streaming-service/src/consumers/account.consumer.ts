import { Kafka } from 'kafkajs'
import { Topics, AccountEventSchema } from '@pipeline/shared'
import { upsertAccount } from '../repositories/customer.repository.js'

export async function startAccountConsumer(kafka: Kafka) {
  const consumer = kafka.consumer({ groupId: 'streaming-service-account' })
  await consumer.connect()
  await consumer.subscribe({ topic: Topics.ACCOUNT_STORED, fromBeginning: false })

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return
      const data = AccountEventSchema.parse(JSON.parse(message.value.toString()))
      await upsertAccount(data)
    },
  })

  return consumer
}
