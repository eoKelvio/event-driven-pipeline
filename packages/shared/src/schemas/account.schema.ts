import { z } from 'zod'

export const AccountSchema = z.object({
  account_id: z.number().int(),
  status_id: z.number().int(),
  due_day: z.number().int(),
  person_id: z.number().int(),
  balance: z.number(),
  available_balance: z.number(),
})

export type Account = z.infer<typeof AccountSchema>
