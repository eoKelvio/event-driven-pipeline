import { generatePerson } from './generate-person.mjs'
import { generateAccount } from './generate-account.mjs'
import { generateCard } from './generate-card.mjs'

export { generatePerson, generateAccount, generateCard }

const person = generatePerson({
  person_id: undefined,
  name: 'João Silva',
  email: undefined,
  gender: 'M',
  birth_date: '1990-01-15',
  address: 'Rua das Flores, 123, São Paulo - SP',
  salary: 7500.0,
  cpf: undefined,
})

const account = generateAccount({
  account_id: undefined,
  person_id: person.id,
  status_id: 1,
  due_day: 10,
  balance: 0.0,
  available_balance: 5000.0,
})

const card = generateCard({
  card_id: undefined,
  account_id: account.id,
  card_number: '4111111111111111',
  status_id: 1,
  limit: 3000.0,
  expiration_date: '2028-12-31',
})

console.error(`person_id:  ${person.id}`)
console.error(`account_id: ${account.id}`)
console.error(`card_id:    ${card.id}`)

console.log(`person:\n${person.encrypted}`)
console.log()
console.log(`account:\n${account.encrypted}`)
console.log()
console.log(`card:\n${card.encrypted}`)
