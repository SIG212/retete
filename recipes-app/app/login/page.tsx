'use client'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const supabase = createClient()

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `https://retete-nu.vercel.app/auth/callback`
      }
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5', fontFamily: 'Outfit, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e5e5e1',
        height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px'
      }}>
        <a href="/" style={{ fontSize: '18px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em', textDecoration: 'none' }}>
          rețete<span style={{ color: '#1a6b3c' }}>.</span>
        </a>
      </nav>

      {/* MAIN */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{
          background: 'white', borderRadius: '20px', padding: '48px 40px',
          width: '100%', maxWidth: '420px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #e5e5e1'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              background: '#1a6b3c', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: '28px'
            }}>🍽️</div>
            <h1 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 800, color: '#111', letterSpacing: '-0.03em' }}>Rețetele mele</h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280', lineHeight: 1.6 }}>Salvează și organizează rețetele tale favorite.</p>
          </div>
          <button onClick={handleLogin}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              background: 'white', border: '1.5px solid #e5e5e1', borderRadius: '12px',
              padding: '14px 16px', cursor: 'pointer', fontFamily: 'Outfit',
              fontWeight: 600, fontSize: '0.95rem', color: '#111',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a6b3c'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e5e1'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z"/>
            </svg>
            Continuă cu Google
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af', marginTop: '20px', marginBottom: 0 }}>
            Prin continuarea, ești de acord cu Termenii și Condițiile noastre.
          </p>
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ padding: '20px', textAlign: 'center', fontSize: '0.8rem' }}>
        <a href="https://sig212.github.io/builder" target="_blank" rel="noopener noreferrer" style={{ color: '#9ca3af', textDecoration: 'none' }}>
          Făcut cu drag în România 🇷🇴
        </a>
      </footer>
    </div>
  )
}
