import { Kafka, Producer } from 'kafkajs'
import type { Sql } from 'postgres'
import type { Counter, Histogram } from 'prom-client'
import { Topics } from '@pipeline/shared'
import { Customer } from '../models/customer.model.js'

type StreamingMetrics = { upsertTotal: Counter<'type'>; consolidationDuration: Histogram }

export async function startConsolidationConsumer(kafka: Kafka, producer: Producer, sql: Sql, metrics: StreamingMetrics) {
  const consumer = kafka.consumer({ groupId: 'streaming-service-consolidation' })
  await consumer.connect()
  await consumer.subscribe({ topic: Topics.CONSOLIDATION_TRIGGER, fromBeginning: false })

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return

      const payload = JSON.parse(message.value.toString()) as { person_id?: number }
      if (!payload.person_id) return

      const rows = await sql`
        SELECT
          p.person_id, p.cpf, p.name, p.email, p.gender, p.birth_date, p.address, p.salary,
          a.account_id, a.status_id AS account_status_id, a.due_day, a.balance, a.available_balance,
          c.card_id, c.card_number, c.status_id AS card_status_id, c.credit_limit, c.expiration_date
        FROM person p
        LEFT JOIN account a ON a.person_id = p.person_id
        LEFT JOIN card c ON c.account_id = a.account_id
        WHERE p.person_id = ${payload.person_id}
      `

      if (rows.length === 0) return

      const first = rows[0]
      const accountsMap = new Map<
        number,
        { account_id: number; status_id: number; due_day: number; balance: number; available_balance: number; cards: object[] }
      >()

      for (const row of rows) {
        if (row.account_id !== null) {
          if (!accountsMap.has(row.account_id)) {
            accountsMap.set(row.account_id, {
              account_id: Number(row.account_id),
              status_id: Number(row.account_status_id),
              due_day: Number(row.due_day),
              balance: parseFloat(row.balance),
              available_balance: parseFloat(row.available_balance),
              cards: [],
            })
          }

          if (row.card_id !== null) {
            accountsMap.get(row.account_id)!.cards.push({
              card_id: Number(row.card_id),
              card_number: row.card_number,
              status_id: Number(row.card_status_id),
              limit: parseFloat(row.credit_limit),
              expiration_date: row.expiration_date,
            })
          }
        }
      }

      const endTimer = metrics.consolidationDuration.startTimer()
      await Customer.findOneAndUpdate(
        { person_id: Number(first.person_id) },
        {
          $set: {
            person_id: Number(first.person_id),
            cpf: first.cpf,
            name: first.name,
            email: first.email,
            gender: first.gender,
            birth_date: first.birth_date instanceof Date
              ? first.birth_date.toISOString().slice(0, 10)
              : first.birth_date,
            address: first.address,
            salary: parseFloat(first.salary),
            accounts: Array.from(accountsMap.values()),
          },
        },
        { upsert: true },
      )
      endTimer()
      metrics.upsertTotal.inc({ type: 'consolidation' })

      await producer.send({
        topic: Topics.CUSTOMER_STORED,
        messages: [{ key: String(first.person_id), value: JSON.stringify({ person_id: Number(first.person_id), cpf: first.cpf }) }],
      })
    },
  })

  return consumer
}
