import { z } from 'zod'

export const CardSchema = z.object({
  card_id: z.number().int(),
  card_number: z.string(),
  account_id: z.number().int(),
  status_id: z.number().int(),
  limit: z.number(),
  expiration_date: z.string(),
})

export type Card = z.infer<typeof CardSchema>
