import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7F6', fontFamily: 'Outfit, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ background: '#1E293B', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#4ADE80', fontWeight: 700, fontSize: '1.2rem' }}>🍽️ Rețete</span>
        <a href="/login" style={{ background: '#2D5A27', color: 'white', padding: '8px 18px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
          Intră în cont
        </a>
      </nav>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>🍽️</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1A202C', marginBottom: '12px', maxWidth: '480px', lineHeight: 1.2 }}>
          Rețetele tale favorite, într-un singur loc
        </h1>
        <p style={{ fontSize: '1rem', color: '#718096', marginBottom: '32px', maxWidth: '400px', lineHeight: 1.6 }}>
          Salvează rețete din Instagram, bloguri sau text. Calculează automat ingredientele pentru oricâte porții vrei.
        </p>

        <a href="/login" style={{ background: '#2D5A27', color: 'white', padding: '14px 32px', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '1rem', marginBottom: '48px' }}>
          Începe gratuit
        </a>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '600px' }}>
          {[
            { icon: '📸', text: 'Din Instagram' },
            { icon: '🔗', text: 'Din orice blog' },
            { icon: '📝', text: 'Text liber' },
            { icon: '⚖️', text: 'Scalare porții' },
            { icon: '🔍', text: 'Căutare rapidă' },
            { icon: '👥', text: 'Rețete publice' },
          ].map(f => (
            <div key={f.text} style={{ background: 'white', borderRadius: '10px', padding: '12px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#4A5568', fontWeight: 500 }}>
              <span>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </main>

      <footer style={{ padding: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#94A3B8' }}>
        Făcut cu drag în România 🇷🇴
      </footer>
    </div>
  )
}
