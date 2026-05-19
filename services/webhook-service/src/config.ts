export const config = {
  port: Number(process.env.PORT ?? 9999),
  kafkaBrokers: (process.env.KAFKA_BOOTSTRAP_SERVERS ?? 'localhost:29092').split(','),
  privateKeyPath: process.env.PRIVATE_KEY_PATH ?? 'keys/private.pem',
  publicKeyPath: process.env.PUBLIC_KEY_PATH ?? 'keys/public.pem',
}
