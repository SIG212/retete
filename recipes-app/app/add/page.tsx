'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/app/components/Footer'

type Ingredient = { id: string; name: string; amount: number; unit?: string }
type Step = { id: string; title: string; content: string; timerSeconds?: number }
type RecipeJSON = {
  title: string
  description?: string
  category?: string
  base_servings?: number
  prep_time?: number
  cook_time?: number
  ingredients: Ingredient[]
  steps: Step[]
  notes?: string
  source_url?: string
}

function portii(n: number) {
  if (n === 1) return '1 porție'
  return `${n} porții`
}

function fmt(amount: number, scale: number) {
  const scaled = amount * scale
  return Number.isInteger(amount) ? Math.round(scaled) : Math.round(scaled * 10) / 10
}

function detectMode(input: string): 'instagram' | 'url' | 'text' {
  const trimmed = input.trim()
  if (trimmed.includes('instagram.com/') || trimmed.includes('facebook.com/') || trimmed.includes('fb.watch/')) return 'instagram'
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return 'url'
  return 'text'
}

export default function AddRecipePage() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recipe, setRecipe] = useState<RecipeJSON | null>(null)
  const [servings, setServings] = useState(2)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [retrying, setRetrying] = useState(false)

  const mode = detectMode(input)

  const modeLabel = {
    instagram: '📸 Instagram / Facebook detectat',
    url: '🔗 URL detectat',
    text: '📝 Text'
  }

  const extract = async (isRetry = false) => {
    setLoading(true)
    setError('')
    setRecipe(null)
    setRetrying(isRetry)
    try {
      const res = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, input })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setRecipe(data)
      setServings(data.base_servings || 2)
    } catch (e: any) {
      const msg = e.message || ''
      if (msg.includes('fetch') || msg.includes('timeout') || msg.includes('network')) {
        setError('Încearcă din nou în câteva secunde. La prima căutare, uneori serverul doarme.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
      setRetrying(false)
    }
  }

  const save = async () => {
    if (!recipe) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/save-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...recipe, source_url: recipe.source_url || input })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      router.push('/dashboard')
    } catch (e: any) {
      setError(e.message)
      setSaving(false)
    }
  }

  const scale = recipe ? servings / (recipe.base_servings || 2) : 1

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5', fontFamily: 'Outfit, sans-serif' }}>
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
        <a href="/dashboard" style={{ fontSize: '18px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em', textDecoration: 'none' }}>
          rețete<span style={{ color: '#1a6b3c' }}>.</span>
        </a>
        <a href="/dashboard" style={{
          color: '#6b7280', textDecoration: 'none', fontSize: '13px', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Înapoi
        </a>
      </nav>

      {/* MAIN */}
      <main style={{ maxWidth: '780px', margin: '0 auto', padding: '32px 20px 100px' }}>
        {/* HERO */}
        <div style={{
          background: '#1a6b3c', borderRadius: '20px', padding: '36px 40px 34px',
          marginBottom: '32px', position: 'relative', overflow: 'hidden'
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
            Adaugă o rețetă nouă
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: '10px' }}>
            Extrage rețeta din<br />orice sursă
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontWeight: 400, maxWidth: '420px', marginBottom: '20px' }}>
            Lipește un link sau textul rețetei mai jos.
          </p>

          <textarea
            placeholder="Lipește un link (Instagram, blog) sau textul rețetei direct..."
            value={input}
            onChange={e => { setInput(e.target.value); setRecipe(null); setError('') }}
            rows={4}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.1)',
              fontFamily: 'Outfit', fontSize: '14px', color: '#fff',
              resize: 'none', boxSizing: 'border-box', lineHeight: 1.6, outline: 'none'
            }}
          />
        </div>

        {input.trim() && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px' }}>
              {modeLabel[mode]}
            </p>
            {mode === 'instagram' && (
              <p style={{ fontSize: '12px', color: '#e67e22', margin: 0 }}>
                Postările de Instagram și Facebook funcționează doar dacă au rețeta în descriere (caption).
              </p>
            )}
          </div>
        )}

        <button onClick={() => extract(false)} disabled={loading || !input.trim()}
          style={{
            width: '100%', background: loading ? '#9ca3af' : '#1a6b3c', color: 'white',
            padding: '14px', borderRadius: '12px', border: 'none', fontFamily: 'Outfit',
            fontWeight: 700, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '24px', transition: 'background 0.15s'
          }}>
          {loading ? (retrying ? 'Se reîncearcă...' : 'Se extrage...') : 'Extrage rețeta'}
        </button>

        {loading && (
          <div style={{ textAlign: 'center', padding: '16px 0', marginBottom: '8px' }}>
            <img src="https://media1.tenor.com/m/6YX4QrCXrgYAAAAd/jerry-hungry.gif" 
              alt="se extrage..." 
              style={{ width: '100%', borderRadius: '12px' }} />
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '8px' }}>
              {mode === 'instagram' ? 'Se extrage din Instagram...' : 'Se analizează rețeta...'}
            </p>
          </div>
        )}

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px',
            padding: '14px 16px', marginBottom: '20px'
          }}>
            <p style={{ margin: '0 0 10px', color: '#dc2626', fontSize: '14px' }}>{error}</p>
            {error.includes('hibernare') && (
              <button onClick={() => extract(true)}
                style={{
                  background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px',
                  padding: '8px 16px', fontFamily: 'Outfit', fontWeight: 600, fontSize: '13px',
                  cursor: 'pointer'
                }}>
                Încearcă din nou
              </button>
            )}
          </div>
        )}

        {recipe && (
          <div style={{
            background: 'white', borderRadius: '16px', padding: '28px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e5e5e1'
          }}>
            <div style={{ marginBottom: '20px' }}>
              {recipe.category && (
                <span style={{
                  background: '#d1fae5', color: '#065f46', padding: '3px 10px', borderRadius: '5px',
                  fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em'
                }}>
                  {recipe.category}
                </span>
              )}
              <input
                value={recipe.title}
                onChange={e => setRecipe({ ...recipe, title: e.target.value })}
                style={{
                  width: '100%', fontSize: '22px', fontWeight: 800, color: '#111',
                  border: 'none', borderBottom: '2px solid #e5e5e1', outline: 'none',
                  padding: '6px 0', marginBottom: '6px', fontFamily: 'Outfit',
                  background: 'transparent', boxSizing: 'border-box', letterSpacing: '-0.03em'
                }}
              />
              {recipe.description && <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>{recipe.description}</p>}
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '13px', color: '#9ca3af' }}>
                {recipe.prep_time && <span>Prep: {recipe.prep_time} min</span>}
                {recipe.cook_time && <span>Gătit: {recipe.cook_time} min</span>}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e5e5e1', margin: '20px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111' }}>Ingrediente</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>{portii(servings)}</span>
                <button onClick={() => setServings(s => Math.max(1, s - 1))}
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #e5e5e1',
                    background: 'white', cursor: 'pointer', fontWeight: 600, color: '#4A5568',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                  }}>−</button>
                <span style={{ fontWeight: 700, fontSize: '16px', minWidth: '20px', textAlign: 'center' }}>{servings}</span>
                <button onClick={() => setServings(s => Math.min(20, s + 1))}
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #e5e5e1',
                    background: 'white', cursor: 'pointer', fontWeight: 600, color: '#4A5568',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                  }}>+</button>
              </div>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recipe.ingredients?.map((ing, i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                  <span style={{ color: '#4A5568' }}>{ing.name}</span>
                  <span style={{ color: '#111', fontWeight: 600 }}>{fmt(ing.amount, scale)} {ing.unit || ''}</span>
                </li>
              ))}
            </ul>

            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mod de preparare</h3>
            <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recipe.steps?.map((step, i) => (
                <li key={i} style={{ display: 'flex', gap: '14px' }}>
                  <span style={{
                    width: '28px', height: '28px', borderRadius: '50%', background: '#d1fae5',
                    color: '#065f46', fontSize: '12px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {i + 1}
                  </span>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '14px', color: '#111' }}>{step.title}</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: 1.7 }}>{step.content}</p>
                  </div>
                </li>
              ))}
            </ol>

            {recipe.notes && (
              <div style={{
                background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px',
                padding: '14px 16px', marginBottom: '24px'
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#92400e', fontStyle: 'italic' }}>{recipe.notes}</p>
              </div>
            )}

            <button onClick={save} disabled={saving}
              style={{
                width: '100%', background: saving ? '#9ca3af' : '#1a6b3c', color: 'white',
                padding: '14px', borderRadius: '12px', border: 'none', fontFamily: 'Outfit',
                fontWeight: 700, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s'
              }}>
              {saving ? 'Se salvează...' : 'Salvează rețeta'}
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
