import { z } from 'zod'

export const PersonSchema = z.object({
  person_id: z.number().int(),
  name: z.string(),
  email: z.string().email(),
  gender: z.enum(['M', 'F']),
  birth_date: z.string(),
  address: z.string(),
  salary: z.number(),
  cpf: z.string().length(11),
})

export type Person = z.infer<typeof PersonSchema>

export const PersonEventSchema = PersonSchema.extend({ event_time: z.string() })
export type PersonEvent = z.infer<typeof PersonEventSchema>
