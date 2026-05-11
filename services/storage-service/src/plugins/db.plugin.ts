import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { createDb, Database } from '../db/connection.js'

declare module 'fastify' {
  interface FastifyInstance {
    db: Database
  }
}

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate('db', createDb())
})
