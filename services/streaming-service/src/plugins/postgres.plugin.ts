import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import postgres, { Sql } from 'postgres'
import { config } from '../config.js'

declare module 'fastify' {
  interface FastifyInstance {
    pg: Sql
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const sql = postgres(config.databaseUrl)
  fastify.decorate('pg', sql)
  fastify.addHook('onClose', async () => {
    await sql.end()
  })
})
