'use client'

import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import type { PipelineEvent } from '../lib/kafka-bridge.js'

export type { PipelineEvent }

export type EventCounts = { person: number; account: number; card: number }

const TOPIC_TYPE: Record<string, keyof EventCounts> = {
  'events.person.stored': 'person',
  'events.account.stored': 'account',
  'events.card.stored': 'card',
}

export function useEventStream() {
  const [events, setEvents] = useState<PipelineEvent[]>([])
  const [counts, setCounts] = useState<EventCounts>({ person: 0, account: 0, card: 0 })
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socket = io()

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('pipeline:event', (event: PipelineEvent) => {
      setEvents((prev) => [event, ...prev].slice(0, 100))
      const type = TOPIC_TYPE[event.topic]
      if (type) setCounts((prev) => ({ ...prev, [type]: prev[type] + 1 }))
    })

    return () => { socket.disconnect() }
  }, [])

  return { events, counts, connected }
}
