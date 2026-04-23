'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Recipe = {
  id: string
  title: string
  description?: string
  category?: string
  base_servings: number
  cook_time?: number
  ingredients: any[]
}

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

const categoryColors: Record<string, { border: string; bg: string; text: string }> = {
  paste: { border: '#10b981', bg: '#d1fae5', text: '#065f46' },
  desert: { border: '#f59e0b', bg: '#fef3c7', text: '#92400e' },
  supe: { border: '#3b82f6', bg: '#dbeafe', text: '#1e40af' },
  salads: { border: '#84cc16', bg: '#ecfccb', text: '#3f6212' },
  general: { border: '#d1d5db', bg: '#f3f4f6', text: '#374151' },
}

const FILTERS = [
  { key: 'toate', label: 'Toate' },
  { key: 'paste', label: '🍝 Paste' },
  { key: 'desert', label: '🍮 Desert' },
  { key: 'supe', label: '🥣 Supe' },
  { key: 'salads', label: '🥗 Salate' },
]

function detectMode(input: string): 'instagram' | 'url' | 'text' {
  const trimmed = input.trim()
  if (trimmed.includes('instagram.com/') || trimmed.includes('facebook.com/') || trimmed.includes('fb.watch/')) return 'instagram'
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return 'url'
  return 'text'
}

function portii(n: number) {
  if (n === 1) return '1 porție'
  return `${n} porții`
}

function fmt(amount: number, scale: number) {
  const scaled = amount * scale
  return Number.isInteger(amount) ? Math.round(scaled) : Math.round(scaled * 10) / 10
}

export default function DashboardClient({ recipes: initialRecipes }: { recipes: Recipe[] }) {
  const [query, setQuery] = useState('')
  const [recipes, setRecipes] = useState(initialRecipes)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState('toate')
  const router = useRouter()

  // Extraction state
  const [heroInput, setHeroInput] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractedRecipe, setExtractedRecipe] = useState<RecipeJSON | null>(null)
  const [extractServings, setExtractServings] = useState(2)
  const [extractError, setExtractError] = useState('')
  const [saving, setSaving] = useState(false)

  const normalize = (s: string) =>
    s.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

  const filtered = useMemo(() => {
    return recipes.filter(r => {
      if (activeFilter !== 'toate') {
        const cat = (r.category || 'general').toLowerCase()
        if (cat !== activeFilter) return false
      }
      if (!query.trim()) return true
      const q = normalize(query)
      const ingredientMatch = r.ingredients?.some((ing: any) =>
        normalize(ing.name || '').includes(q)
      )
      return (
        normalize(r.title || '').includes(q) ||
        normalize(r.description || '').includes(q) ||
        normalize(r.category || '').includes(q) ||
        ingredientMatch
      )
    })
  }, [recipes, query, activeFilter])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Ștergi rețeta?')) return
    setDeleting(id)
    const res = await fetch('/api/delete-recipe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (res.ok) {
      setRecipes(prev => prev.filter(r => r.id !== id))
    }
    setDeleting(null)
  }

  const extract = async () => {
    if (!heroInput.trim()) return
    const mode = detectMode(heroInput)
    setExtracting(true)
    setExtractError('')
    setExtractedRecipe(null)
    try {
      const res = await fetch('/api/extract-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, input: heroInput })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setExtractedRecipe(data)
      setExtractServings(data.base_servings || 2)
    } catch (e: any) {
      const msg = e.message || ''
      if (msg.includes('fetch') || msg.includes('timeout') || msg.includes('network')) {
        setExtractError('Încearcă din nou în câteva secunde. La prima căutare, uneori serverul doarme.')
      } else {
        setExtractError(msg)
      }
    } finally {
      setExtracting(false)
    }
  }

  const saveExtracted = async () => {
    if (!extractedRecipe) return
    setSaving(true)
    setExtractError('')
    try {
      const res = await fetch('/api/save-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...extractedRecipe, source_url: extractedRecipe.source_url || heroInput })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      // Refresh the page to show the new recipe
      router.refresh()
    } catch (e: any) {
      setExtractError(e.message)
      setSaving(false)
    }
  }

  const getCategoryStyle = (category?: string) => {
    const cat = (category || 'general').toLowerCase()
    return categoryColors[cat] || categoryColors.general
  }

  const extractScale = extractedRecipe ? extractServings / (extractedRecipe.base_servings || 2) : 1

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
        <a href="/add" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '10px',
          padding: '9px 20px', fontSize: '13px', fontWeight: 700,
          textDecoration: 'none', cursor: 'pointer', transition: 'background 0.15s'
        }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Adaugă rețetă
        </a>
      </nav>

      {/* MAIN */}
      <main style={{ maxWidth: '780px', margin: '0 auto', padding: '32px 20px 100px' }}>
        {/* HERO */}
        <div style={{
          background: '#1a6b3c', borderRadius: '20px', padding: '36px 40px 34px',
          marginBottom: '40px', position: 'relative', overflow: 'hidden'
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
            Extrage și salvează rețete
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontWeight: 400, maxWidth: '420px', marginBottom: '20px' }}>
            Bon apetit!
          </p>

          {/* HERO INPUT - Direct extraction */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: '14px', padding: '11px 14px'
          }}>
            <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            <input
              type="text"
              placeholder="Adaugă link sau text..."
              value={heroInput}
              onChange={e => { setHeroInput(e.target.value); setExtractedRecipe(null); setExtractError('') }}
              onKeyDown={e => { if (e.key === 'Enter') extract() }}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontFamily: 'Outfit', fontSize: '14px', color: '#fff', minWidth: 0
              }}
            />
            <button
              onClick={extract}
              disabled={extracting || !heroInput.trim()}
              style={{
                background: '#fff', color: '#1a6b3c', borderRadius: '8px',
                padding: '9px 18px', fontSize: '13px', fontWeight: 700,
                fontFamily: 'Outfit', whiteSpace: 'nowrap', cursor: extracting ? 'not-allowed' : 'pointer',
                opacity: extracting ? 0.7 : 1, transition: 'opacity 0.15s', border: 'none', flexShrink: 0
              }}>
              {extracting ? 'Se extrage...' : 'Extrage'}
            </button>
          </div>
          <p style={{ marginTop: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 400, lineHeight: 1.5 }}>
            Folosește reel-uri de Instagram (cu rețeta în caption), blog-uri sau text copy-paste
          </p>
        </div>

        {/* EXTRACTION ERROR */}
        {extractError && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px',
            padding: '14px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <p style={{ margin: 0, color: '#dc2626', fontSize: '14px' }}>{extractError}</p>
            <button onClick={() => setExtractError('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '16px', padding: '4px' }}>
              ✕
            </button>
          </div>
        )}

        {/* EXTRACTED RECIPE PREVIEW */}
        {extractedRecipe && (
          <div style={{
            background: 'white', borderRadius: '16px', padding: '28px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e5e5e1',
            marginBottom: '32px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                {extractedRecipe.category && (
                  <span style={{
                    background: '#d1fae5', color: '#065f46', padding: '3px 10px', borderRadius: '5px',
                    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em'
                  }}>
                    {extractedRecipe.category}
                  </span>
                )}
                <h2 style={{ margin: '8px 0 6px', fontSize: '22px', fontWeight: 800, color: '#111', letterSpacing: '-0.03em' }}>{extractedRecipe.title}</h2>
                {extractedRecipe.description && <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>{extractedRecipe.description}</p>}
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '13px', color: '#9ca3af' }}>
                  {extractedRecipe.prep_time && <span>Prep: {extractedRecipe.prep_time} min</span>}
                  {extractedRecipe.cook_time && <span>Gătit: {extractedRecipe.cook_time} min</span>}
                </div>
              </div>
              <button onClick={() => { setExtractedRecipe(null); setHeroInput('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '16px', padding: '4px', flexShrink: 0 }}>
                ✕
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e5e5e1', margin: '20px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111' }}>Ingrediente</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>{portii(extractServings)}</span>
                <button onClick={() => setExtractServings(s => Math.max(1, s - 1))}
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #e5e5e1',
                    background: 'white', cursor: 'pointer', fontWeight: 600, color: '#4A5568',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                  }}>−</button>
                <span style={{ fontWeight: 700, fontSize: '16px', minWidth: '20px', textAlign: 'center' }}>{extractServings}</span>
                <button onClick={() => setExtractServings(s => Math.min(20, s + 1))}
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #e5e5e1',
                    background: 'white', cursor: 'pointer', fontWeight: 600, color: '#4A5568',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                  }}>+</button>
              </div>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {extractedRecipe.ingredients?.map((ing, i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                  <span style={{ color: '#4A5568' }}>{ing.name}</span>
                  <span style={{ color: '#111', fontWeight: 600 }}>{fmt(ing.amount, extractScale)} {ing.unit || ''}</span>
                </li>
              ))}
            </ul>

            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mod de preparare</h3>
            <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {extractedRecipe.steps?.map((step, i) => (
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

            {extractedRecipe.notes && (
              <div style={{
                background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px',
                padding: '14px 16px', marginBottom: '24px'
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#92400e', fontStyle: 'italic' }}>{extractedRecipe.notes}</p>
              </div>
            )}

            <button onClick={saveExtracted} disabled={saving}
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

        {/* SECTION HEADING + SEARCH */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '16px', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em', color: '#111', whiteSpace: 'nowrap' }}>Rețetele mele</h2>
          <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex', pointerEvents: 'none' }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Caută rețete sau ingrediente..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: '100%', height: '40px',
                background: '#fff', border: '1.5px solid #e5e5e1', borderRadius: '10px',
                padding: '0 36px 0 38px', fontFamily: 'Outfit', fontSize: '14px', color: '#111',
                outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
                boxSizing: 'border-box'
              }}
              onFocus={e => { e.target.style.borderColor = '#1a6b3c'; e.target.style.boxShadow = '0 0 0 3px rgba(26,107,60,0.08)' }}
              onBlur={e => { e.target.style.borderColor = '#e5e5e1'; e.target.style.boxShadow = 'none' }}
            />
            {query && (
              <button onClick={() => setQuery('')}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af',
                  fontSize: '13px', padding: '2px 4px', fontFamily: 'Outfit', lineHeight: 1
                }}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* FILTERS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)}
              style={{
                padding: '7px 16px', borderRadius: '999px',
                border: `1.5px solid ${activeFilter === f.key ? '#1a6b3c' : '#e5e5e1'}`,
                background: activeFilter === f.key ? '#1a6b3c' : '#fff',
                fontSize: '13px', fontWeight: 600,
                color: activeFilter === f.key ? '#fff' : '#6b7280',
                cursor: 'pointer', fontFamily: 'Outfit', transition: 'all 0.15s'
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* RESULTS META */}
        {query && (
          <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '14px', minHeight: '18px' }}>
            {filtered.length} {filtered.length === 1 ? 'rezultat' : 'rezultate'} pentru „{query}"
          </div>
        )}

        {/* CARD LIST */}
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((recipe, idx) => {
              const catStyle = getCategoryStyle(recipe.category)
              return (
                <a key={recipe.id} href={`/recipe/${recipe.id}`}
                  style={{
                    background: '#fff', border: '1px solid #e5e5e1',
                    borderLeft: `4px solid ${catStyle.border}`,
                    borderRadius: '14px', padding: '18px 20px',
                    cursor: 'pointer', textDecoration: 'none', color: 'inherit',
                    display: 'block', transition: 'transform 0.15s, box-shadow 0.15s',
                    animation: `fadeUp 0.18s ease ${0.03 + idx * 0.04}s both`
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.07)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.08em', padding: '3px 9px', borderRadius: '5px',
                        background: catStyle.bg, color: catStyle.text
                      }}>
                        {recipe.category || 'general'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {recipe.cook_time && (
                        <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>{recipe.cook_time} min</span>
                      )}
                      <button
                        onClick={e => handleDelete(e, recipe.id)}
                        disabled={deleting === recipe.id}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#d1d5db', padding: '4px', borderRadius: '6px',
                          display: 'flex', alignItems: 'center', transition: 'all 0.12s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.background = 'none' }}
                        title="Șterge rețeta"
                      >
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h3 style={{ margin: '0 0 5px', fontSize: '15px', fontWeight: 700, color: '#111', letterSpacing: '-0.02em', lineHeight: 1.35 }}>
                    {recipe.title}
                  </h3>
                  {recipe.description && (
                    <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#6b7280', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontWeight: 400 }}>
                      {recipe.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>
                    <span>{recipe.base_servings} {recipe.base_servings === 1 ? 'porție' : 'porții'}</span>
                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#d1d5db', display: 'inline-block' }}></span>
                    <span>{recipe.ingredients?.length || 0} ingrediente</span>
                  </div>
                </a>
              )
            })}
          </div>
        ) : (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div style={{
              width: '52px', height: '52px', background: '#f3f4f6', borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px'
            }}>
              <svg width="22" height="22" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            {query ? (
              <>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Nicio rețetă găsită</p>
                <button onClick={() => setQuery('')} style={{ fontSize: '13px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Outfit', textDecoration: 'underline' }}>
                  Încearcă un alt termen de căutare.
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Nu ai rețete încă</p>
                <a href="/add" style={{ fontSize: '13px', color: '#1a6b3c', fontWeight: 600, textDecoration: 'underline' }}>Adaugă prima ta rețetă</a>
              </>
            )}
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
