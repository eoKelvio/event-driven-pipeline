import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'
import { config } from '../config.js'

export function createDb() {
  const client = postgres(config.databaseUrl)
  return drizzle(client, { schema })
}

export type Database = ReturnType<typeof createDb>
