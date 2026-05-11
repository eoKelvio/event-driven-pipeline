import SchemaBuilder from '@pothos/core'
import { findByCpf } from '../repositories/customer.repository.js'

const builder = new SchemaBuilder({})

const CardType = builder.objectRef<{
  card_id: number
  card_number: string
  status_id: number
  limit: number
  expiration_date: string
}>('Card')

CardType.implement({
  fields: (t) => ({
    card_id: t.exposeInt('card_id'),
    card_number: t.exposeString('card_number'),
    status_id: t.exposeInt('status_id'),
    limit: t.exposeFloat('limit'),
    expiration_date: t.exposeString('expiration_date'),
  }),
})

const AccountType = builder.objectRef<{
  account_id: number
  status_id: number
  due_day: number
  balance: number
  available_balance: number
  cards: {
    card_id: number
    card_number: string
    status_id: number
    limit: number
    expiration_date: string
  }[]
}>('Account')

AccountType.implement({
  fields: (t) => ({
    account_id: t.exposeInt('account_id'),
    status_id: t.exposeInt('status_id'),
    due_day: t.exposeInt('due_day'),
    balance: t.exposeFloat('balance'),
    available_balance: t.exposeFloat('available_balance'),
    cards: t.expose('cards', { type: [CardType] }),
  }),
})

const CustomerType = builder.objectRef<{
  cpf: string
  person_id: number
  name: string
  email: string
  gender: string
  birth_date: string
  address: string
  salary: number
  accounts: {
    account_id: number
    status_id: number
    due_day: number
    balance: number
    available_balance: number
    cards: {
      card_id: number
      card_number: string
      status_id: number
      limit: number
      expiration_date: string
    }[]
  }[]
}>('Customer')

CustomerType.implement({
  fields: (t) => ({
    cpf: t.exposeString('cpf'),
    person_id: t.exposeInt('person_id'),
    name: t.exposeString('name'),
    email: t.exposeString('email'),
    gender: t.exposeString('gender'),
    birth_date: t.exposeString('birth_date'),
    address: t.exposeString('address'),
    salary: t.exposeFloat('salary'),
    accounts: t.expose('accounts', { type: [AccountType] }),
  }),
})

builder.queryType({
  fields: (t) => ({
    customer: t.field({
      type: CustomerType,
      nullable: true,
      args: {
        cpf: t.arg.string({ required: true }),
      },
      resolve: async (_, { cpf }) => {
        const doc = await findByCpf(cpf)
        if (!doc) return null
        return doc as typeof CustomerType.$inferType
      },
    }),
  }),
})

export const schema = builder.toSchema()
