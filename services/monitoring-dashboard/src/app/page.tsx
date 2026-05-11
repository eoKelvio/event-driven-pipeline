'use client'

import { useEventStream } from '../hooks/useEventStream.js'
import { PipelineFlow } from '../components/PipelineFlow.js'
import { EventFeed } from '../components/EventFeed.js'

export default function Dashboard() {
  const { events, counts, connected } = useEventStream()

  return (
    <div style={{ minHeight: '100vh', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>Pipeline Monitor</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>Event-driven pipeline — real-time view</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#1a1d2e', borderRadius: 20 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: connected ? '#10b981' : '#ef4444',
            boxShadow: connected ? '0 0 6px #10b981' : '0 0 6px #ef4444',
          }} />
          <span style={{ fontSize: 13, color: connected ? '#10b981' : '#ef4444', fontWeight: 500 }}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, minHeight: 0 }}>
        <PipelineFlow counts={counts} />
        <div style={{ minHeight: 600 }}>
          <EventFeed events={events} />
        </div>
      </main>
    </div>
  )
}
