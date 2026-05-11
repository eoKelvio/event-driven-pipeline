import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pipeline Monitor',
  description: 'Event-driven pipeline monitoring dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
