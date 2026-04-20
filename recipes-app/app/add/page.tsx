'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
    <div style={{ minHeight: '100vh', background: '#F4F7F6', fontFamily: 'Outfit, sans-serif' }}>
      <nav style={{ background: '#1E293B', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 10 }}>
        <a href="/dashboard" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.9rem' }}>← Înapoi</a>
        <span style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>Adaugă rețetă</span>
      </nav>

      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 16px' }}>
        <textarea
          placeholder="Lipește un link (Instagram, blog) sau textul rețetei direct..."
          value={input}
          onChange={e => { setInput(e.target.value); setRecipe(null); setError('') }}
          rows={4}
          style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #ddd', fontFamily: 'Outfit', fontSize: '0.95rem', marginBottom: '8px', resize: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
        />

        {input.trim() && mode === 'instagram' && (
          <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginBottom: '4px', marginTop: '-4px' }}>
            Postările de Instagram și Facebook funcționează doar dacă au rețeta în descriere (caption).
          </p>
        )}
        {input.trim() && (
          <div style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '0 0 4px' }}>
              {modeLabel[mode]}
            </p>
            {mode === 'instagram' && (
              <p style={{ fontSize: '0.78rem', color: '#E67E22', margin: 0 }}>
                Postările de Instagram și Facebook funcționează doar dacă au rețeta în descriere (caption).
              </p>
            )}
          </div>
        )}

        <button onClick={() => extract(false)} disabled={loading || !input.trim()}
          style={{ width: '100%', background: loading ? '#94A3B8' : '#1E293B', color: 'white', padding: '13px', borderRadius: '10px', border: 'none', fontFamily: 'Outfit', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '24px' }}>
          {loading ? (retrying ? 'Se reîncearcă...' : 'Se extrage...') : 'Extrage rețeta'}
        </button>

        {loading && (
          <div style={{ textAlign: 'center', padding: '16px 0', marginTop: '-16px', marginBottom: '8px' }}>
            <img src="https://media1.tenor.com/m/6YX4QrCXrgYAAAAd/jerry-hungry.gif" 
              alt="se extrage..." 
              style={{ width: '100%', borderRadius: '12px' }} />
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '8px' }}>
              {mode === 'instagram' ? 'Se extrage din Instagram...' : 'Se analizează rețeta...'}
            </p>
          </div>
        )}

        {error && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 8px', color: '#C53030', fontSize: '0.85rem' }}>{error}</p>
            {error.includes('hibernare') && (
              <button onClick={() => extract(true)}
                style={{ background: '#C53030', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontFamily: 'Outfit', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                Încearcă din nou
              </button>
            )}
          </div>
        )}

        {recipe && (
          <div style={{ background: 'white', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <div style={{ marginBottom: '16px' }}>
              {recipe.category && (
                <span style={{ background: '#F0FDF4', color: '#2D5A27', padding: '2px 10px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  {recipe.category}
                </span>
              )}
              <input
                value={recipe.title}
                onChange={e => setRecipe({ ...recipe, title: e.target.value })}
                style={{ width: '100%', fontSize: '1.3rem', fontWeight: 700, color: '#1A202C', border: 'none', borderBottom: '2px solid #E2E8F0', outline: 'none', padding: '4px 0', marginBottom: '4px', fontFamily: 'Outfit', background: 'transparent', boxSizing: 'border-box' }}
              />
              {recipe.description && <p style={{ margin: 0, fontSize: '0.9rem', color: '#718096' }}>{recipe.description}</p>}
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '0.8rem', color: '#94A3B8' }}>
                {recipe.prep_time && <span>Prep: {recipe.prep_time} min</span>}
                {recipe.cook_time && <span>Gătit: {recipe.cook_time} min</span>}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '16px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1A202C' }}>Ingrediente</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{portii(servings)}</span>
                <button onClick={() => setServings(s => Math.max(1, s - 1))}
                  style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', fontWeight: 600, color: '#4A5568', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ fontWeight: 700, fontSize: '1rem', minWidth: '16px', textAlign: 'center' }}>{servings}</span>
                <button onClick={() => setServings(s => Math.min(20, s + 1))}
                  style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', fontWeight: 600, color: '#4A5568', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {recipe.ingredients?.map((ing, i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid #F8FAFC', paddingBottom: '6px' }}>
                  <span style={{ color: '#4A5568' }}>{ing.name}</span>
                  <span style={{ color: '#1A202C', fontWeight: 600 }}>{fmt(ing.amount, scale)} {ing.unit || ''}</span>
                </li>
              ))}
            </ul>

            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1A202C', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mod de preparare</h3>
            <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recipe.steps?.map((step, i) => (
                <li key={i} style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#F0FDF4', color: '#2D5A27', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <div>
                    <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.9rem', color: '#1A202C' }}>{step.title}</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#718096', lineHeight: 1.6 }}>{step.content}</p>
                  </div>
                </li>
              ))}
            </ol>

            {recipe.notes && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400E', fontStyle: 'italic' }}>{recipe.notes}</p>
              </div>
            )}

            <button onClick={save} disabled={saving}
              style={{ width: '100%', background: saving ? '#94A3B8' : '#2D5A27', color: 'white', padding: '13px', borderRadius: '10px', border: 'none', fontFamily: 'Outfit', fontWeight: 600, fontSize: '0.95rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Se salvează...' : 'Salvează rețeta'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
