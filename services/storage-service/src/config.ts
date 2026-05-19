export const config = {
  port: Number(process.env.PORT ?? 9998),
  kafkaBrokers: (process.env.KAFKA_BOOTSTRAP_SERVERS ?? 'localhost:29092').split(','),
  databaseUrl:
    process.env.DATABASE_URL ?? 'postgres://pipeline:pipeline123@localhost:5432/pipeline',
}
