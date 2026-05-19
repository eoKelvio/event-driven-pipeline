export const Topics = {
  PERSON_RAW: 'events.person.raw',
  ACCOUNT_RAW: 'events.account.raw',
  CARD_RAW: 'events.card.raw',

  PERSON_STORED: 'events.person.stored',
  ACCOUNT_STORED: 'events.account.stored',
  CARD_STORED: 'events.card.stored',

  CONSOLIDATION_TRIGGER: 'triggers.consolidation',
  CUSTOMER_STORED: 'events.customer.stored',
} as const

export type Topic = (typeof Topics)[keyof typeof Topics]
