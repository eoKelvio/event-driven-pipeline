import { publicEncrypt, constants } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { randomId } from './utils.mjs'

const publicKey = readFileSync('keys/public.pem', 'utf8')

export function generateCard({
  card_id = randomId(),
  account_id = randomId(),
  card_number = '4111111111111111',
  status_id = 1,
  limit = 3000.0,
  expiration_date = '2028-12-31',
} = {}) {
  const body = { card_id, card_number, account_id, status_id, limit, expiration_date }
  const encrypted = publicEncrypt(
    { key: publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING },
    Buffer.from(JSON.stringify(body)),
  ).toString('base64')
  return { id: card_id, encrypted }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const account_id = Number(process.argv[2])
  if (!account_id) {
    console.error('Usage: node scripts/generate-card.mjs <account_id>')
    process.exit(1)
  }
  const { id, encrypted } = generateCard({ account_id })
  console.error(`card_id: ${id}`)
  console.log(encrypted)
}
