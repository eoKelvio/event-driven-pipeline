import { publicEncrypt, constants } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { randomId } from './utils.mjs'

const publicKey = readFileSync('keys/public.pem', 'utf8')

export function generatePerson({
  person_id = randomId(),
  name = 'João Silva',
  email = `joao.silva.${person_id}@example.com`,
  gender = 'M',
  birth_date = '1990-01-15',
  address = 'Rua das Flores, 123, São Paulo - SP',
  salary = 7500.0,
  cpf = String(person_id).padStart(11, '0'),
} = {}) {
  const body = { person_id, name, email, gender, birth_date, address, salary, cpf }
  const encrypted = publicEncrypt(
    { key: publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING },
    Buffer.from(JSON.stringify(body)),
  ).toString('base64')
  return { id: person_id, encrypted }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { id, encrypted } = generatePerson()
  console.error(`person_id: ${id}`)
  console.log(encrypted)
}
