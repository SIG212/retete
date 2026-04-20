import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rețetele mele',
  description: 'Salvează și organizează rețetele tale',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  )
}
