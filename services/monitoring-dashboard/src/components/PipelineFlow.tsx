'use client'

import type { EventCounts } from '../hooks/useEventStream.js'

const STAGES = [
  { label: 'Webhook', port: ':9999', color: '#3b82f6', key: null },
  { label: 'Kafka', port: 'broker', color: '#f59e0b', key: null },
  { label: 'Storage', port: ':9998', color: '#10b981', key: null },
  { label: 'Streaming', port: ':9997', color: '#8b5cf6', key: null },
  { label: 'MongoDB', port: 'nosql', color: '#ef4444', key: null },
]

export function PipelineFlow({ counts }: { counts: EventCounts }) {
  return (
    <div style={{ background: '#1a1d2e', borderRadius: 12, padding: 24 }}>
      <h2 style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, marginBottom: 24, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Pipeline Flow
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {STAGES.map((stage, i) => (
          <div key={stage.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#0f1117', borderRadius: 8, border: `1px solid ${stage.color}33` }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: stage.color, boxShadow: `0 0 8px ${stage.color}` }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 500 }}>{stage.label}</div>
                <div style={{ color: '#64748b', fontSize: 12 }}>{stage.port}</div>
              </div>
            </div>
            {i < STAGES.length - 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', color: '#334155', fontSize: 18, lineHeight: 1, margin: '2px 0' }}>↓</div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #1e293b' }}>
        <h3 style={{ color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Events Stored
        </h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {([['Person', counts.person, '#3b82f6'], ['Account', counts.account, '#f59e0b'], ['Card', counts.card, '#8b5cf6']] as const).map(([label, count, color]) => (
            <div key={label} style={{ flex: 1, background: '#0f1117', borderRadius: 8, padding: '10px 12px', textAlign: 'center', border: `1px solid ${color}33` }}>
              <div style={{ color, fontSize: 22, fontWeight: 700, fontFamily: 'monospace' }}>{count}</div>
              <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
