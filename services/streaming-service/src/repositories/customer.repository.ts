import { Customer } from '../models/customer.model.js'
import type { PersonEvent, AccountEvent, CardEvent } from '@pipeline/shared'

export async function upsertPerson(data: PersonEvent): Promise<void> {
  await Customer.findOneAndUpdate(
    { cpf: data.cpf },
    {
      $set: {
        person_id: data.person_id,
        name: data.name,
        email: data.email,
        gender: data.gender,
        birth_date: data.birth_date,
        address: data.address,
        salary: data.salary,
      },
    },
    { upsert: true },
  )
}

export async function upsertAccount(data: AccountEvent): Promise<void> {
  const accountData = {
    account_id: data.account_id,
    status_id: data.status_id,
    due_day: data.due_day,
    balance: data.balance,
    available_balance: data.available_balance,
  }

  const result = await Customer.updateOne(
    { person_id: data.person_id },
    { $set: { 'accounts.$[elem]': accountData } },
    { arrayFilters: [{ 'elem.account_id': data.account_id }] },
  )

  if (result.modifiedCount === 0) {
    await Customer.updateOne(
      { person_id: data.person_id },
      { $push: { accounts: { ...accountData, cards: [] } } },
    )
  }
}

export async function upsertCard(data: CardEvent): Promise<void> {
  const cardData = {
    card_id: data.card_id,
    card_number: data.card_number,
    status_id: data.status_id,
    limit: data.limit,
    expiration_date: data.expiration_date,
  }

  const result = await Customer.updateOne(
    { 'accounts.account_id': data.account_id },
    { $set: { 'accounts.$[acc].cards.$[card]': cardData } },
    {
      arrayFilters: [{ 'acc.account_id': data.account_id }, { 'card.card_id': data.card_id }],
    },
  )

  if (result.modifiedCount === 0) {
    await Customer.updateOne(
      { 'accounts.account_id': data.account_id },
      { $push: { 'accounts.$.cards': cardData } },
    )
  }
}

export async function findByCpf(cpf: string) {
  return Customer.findOne({ cpf }).lean()
}
