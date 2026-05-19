import { z } from 'zod'

export const WebhookEnvelopeSchema = z.object({
  body: z.string(),
})

export type WebhookEnvelope = z.infer<typeof WebhookEnvelopeSchema>
