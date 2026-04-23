import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Footer from '@/app/components/Footer'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

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
        <span style={{ fontSize: '18px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em' }}>
          rețete<span style={{ color: '#1a6b3c' }}>.</span>
        </span>
        <a href="/login" style={{
          background: '#1a6b3c', color: 'white', padding: '9px 20px', borderRadius: '10px',
          textDecoration: 'none', fontWeight: 700, fontSize: '13px',
          transition: 'background 0.15s'
        }}>
          Intră în cont
        </a>
      </nav>

      {/* MAIN */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
        {/* HERO */}
        <div style={{
          background: '#1a6b3c', borderRadius: '20px', padding: '48px 40px 44px',
          marginBottom: '40px', position: 'relative', overflow: 'hidden',
          maxWidth: '780px', width: '100%'
        }}>
          <div style={{
            position: 'absolute', right: '-60px', bottom: '-60px',
            width: '260px', height: '260px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)', pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute', right: '90px', bottom: '-90px',
            width: '170px', height: '170px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)', pointerEvents: 'none'
          }} />
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
            Instagram, blog-uri sau text copy-paste
          </div>
          <h1 style={{ fontSize: '38px', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: '10px' }}>
            Rețetele tale favorite,<br />într-un singur loc
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontWeight: 400, maxWidth: '420px', marginBottom: '20px', margin: '0 auto 20px' }}>
            Salvează rețete din Instagram, bloguri sau text. Calculează automat ingredientele pentru oricâte porții vrei.
          </p>
          <a href="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: '14px', padding: '11px 14px', textDecoration: 'none',
            transition: 'opacity 0.15s'
          }}>
            <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            <span style={{
              background: '#fff', color: '#1a6b3c', borderRadius: '8px',
              padding: '9px 18px', fontSize: '13px', fontWeight: 700,
              fontFamily: 'Outfit', whiteSpace: 'nowrap'
            }}>Începe gratuit</span>
          </a>
          <p style={{ marginTop: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 400, lineHeight: 1.5 }}>
            Folosește reel-uri de Instagram (cu rețeta în caption), blog-uri sau text copy-paste
          </p>
        </div>

        {/* FEATURES */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '600px' }}>
          {[
            { icon: '📸', text: 'Din Instagram' },
            { icon: '🔗', text: 'Din orice blog' },
            { icon: '📝', text: 'Text liber' },
            { icon: '⚖️', text: 'Scalare porții' },
            { icon: '🔍', text: 'Căutare rapidă' },
            { icon: '👥', text: 'Rețete publice' },
          ].map(f => (
            <div key={f.text} style={{
              background: 'white', borderRadius: '10px', padding: '12px 18px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e5e1',
              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem',
              color: '#4A5568', fontWeight: 500
            }}>
              <span>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
