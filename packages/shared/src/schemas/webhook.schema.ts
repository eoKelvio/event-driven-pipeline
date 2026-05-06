import { z } from 'zod'

export const WebhookEnvelopeSchema = z.object({
  time: z.string(),
  body: z.string(),
  event: z.string(),
})

export type WebhookEnvelope = z.infer<typeof WebhookEnvelopeSchema>
