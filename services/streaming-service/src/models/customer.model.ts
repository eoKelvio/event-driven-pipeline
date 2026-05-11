import { Schema, model } from 'mongoose'

const CardSchema = new Schema(
  {
    card_id: { type: Number, required: true },
    card_number: { type: String, required: true },
    status_id: { type: Number, required: true },
    limit: { type: Number, required: true },
    expiration_date: { type: String, required: true },
  },
  { _id: false },
)

const AccountSchema = new Schema(
  {
    account_id: { type: Number, required: true },
    status_id: { type: Number, required: true },
    due_day: { type: Number, required: true },
    balance: { type: Number, required: true },
    available_balance: { type: Number, required: true },
    cards: { type: [CardSchema], default: [] },
  },
  { _id: false },
)

const CustomerSchema = new Schema(
  {
    cpf: { type: String, required: true, unique: true, index: true },
    person_id: { type: Number, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    gender: { type: String, required: true },
    birth_date: { type: String, required: true },
    address: { type: String, required: true },
    salary: { type: Number, required: true },
    accounts: { type: [AccountSchema], default: [] },
  },
  { timestamps: true },
)

export const Customer = model('Customer', CustomerSchema)

export interface CustomerAccount {
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
}
