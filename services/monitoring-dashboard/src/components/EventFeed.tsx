'use client'

import type { PipelineEvent } from '../hooks/useEventStream.js'

const TOPIC_COLOR: Record<string, string> = {
  'events.person.stored': '#3b82f6',
  'events.account.stored': '#f59e0b',
  'events.card.stored': '#8b5cf6',
}

const TOPIC_LABEL: Record<string, string> = {
  'events.person.stored': 'PERSON',
  'events.account.stored': 'ACCOUNT',
  'events.card.stored': 'CARD',
}

function getKey(event: PipelineEvent): string {
  const d = event.data
  if (d.cpf) return `cpf: ${String(d.cpf).slice(0, 6)}***`
  if (d.account_id) return `account: ${d.account_id}`
  if (d.card_id) return `card: ${d.card_id}`
  return '—'
}

export function EventFeed({ events }: { events: PipelineEvent[] }) {
  return (
    <div style={{ background: '#1a1d2e', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h2 style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, marginBottom: 16, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Live Events {events.length > 0 && <span style={{ color: '#64748b', fontWeight: 400 }}>({events.length})</span>}
      </h2>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {events.length === 0 ? (
          <div style={{ color: '#334155', fontSize: 14, textAlign: 'center', marginTop: 40 }}>
            Aguardando eventos...
          </div>
        ) : (
          events.map((event, i) => {
            const color = TOPIC_COLOR[event.topic] ?? '#64748b'
            const label = TOPIC_LABEL[event.topic] ?? event.topic
            const time = new Date(event.timestamp).toLocaleTimeString('pt-BR')
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#0f1117', borderRadius: 8, borderLeft: `3px solid ${color}`, fontFamily: 'monospace', fontSize: 13 }}>
                <span style={{ color, fontWeight: 700, minWidth: 60, fontSize: 11 }}>{label}</span>
                <span style={{ color: '#94a3b8', flex: 1 }}>{getKey(event)}</span>
                <span style={{ color: '#475569', fontSize: 11 }}>{time}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
