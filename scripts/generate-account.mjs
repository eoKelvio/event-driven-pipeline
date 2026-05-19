import { publicEncrypt, constants } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { randomId } from './utils.mjs'

const publicKey = readFileSync('keys/public.pem', 'utf8')

export function generateAccount({
  account_id = randomId(),
  person_id = randomId(),
  status_id = 1,
  due_day = 10,
  balance = 0.0,
  available_balance = 5000.0,
} = {}) {
  const body = { account_id, person_id, status_id, due_day, balance, available_balance }
  const encrypted = publicEncrypt(
    { key: publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING },
    Buffer.from(JSON.stringify(body)),
  ).toString('base64')
  return { id: account_id, encrypted }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const person_id = Number(process.argv[2])
  if (!person_id) {
    console.error('Usage: node scripts/generate-account.mjs <person_id>')
    process.exit(1)
  }
  const { id, encrypted } = generateAccount({ person_id })
  console.error(`account_id: ${id}`)
  console.log(encrypted)
}
