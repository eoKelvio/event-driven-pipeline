export const config = {
  port: Number(process.env.PORT ?? 9997),
  kafkaBrokers: (process.env.KAFKA_BOOTSTRAP_SERVERS ?? 'localhost:29092').split(','),
  mongoUrl:
    process.env.MONGO_URL ?? 'mongodb://pipeline:pipeline123@localhost:27017/pipeline?authSource=admin',
}
