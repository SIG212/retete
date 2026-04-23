'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Ingredient = { id: string; name: string; amount: number; unit?: string }
type Step = { id: string; title: string; content: string; timerSeconds?: number }
type Recipe = {
  id: string
  title: string
  description?: string
  category?: string
  base_servings: number
  prep_time?: number
  cook_time?: number
  ingredients?: Ingredient[]
  steps?: Step[]
  notes?: string
  source_url?: string
  user_id?: string
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  paste: { bg: '#d1fae5', text: '#065f46' },
  desert: { bg: '#fef3c7', text: '#92400e' },
  supe: { bg: '#dbeafe', text: '#1e40af' },
  salads: { bg: '#ecfccb', text: '#3f6212' },
  general: { bg: '#f3f4f6', text: '#374151' },
}

export default function RecipeDetail({ recipe, community, userId }: { recipe: Recipe, community: Recipe[], userId?: string }) {
  const [servings, setServings] = useState(recipe.base_servings)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const scale = servings / recipe.base_servings
  const fmt = (n: number) => Number.isInteger(n) ? Math.round(n * scale) : Math.round(n * scale * 10) / 10
  const portii = (n: number) => n === 1 ? '1 porție' : `${n} porții`

  const handleDelete = async () => {
    if (!confirm('Ștergi rețeta?')) return
    setDeleting(true)
    const res = await fetch('/api/delete-recipe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: recipe.id })
    })
    if (res.ok) router.push('/dashboard')
    else setDeleting(false)
  }

  const isOwner = userId && recipe.user_id === userId
  const catStyle = categoryColors[(recipe.category || 'general').toLowerCase()] || categoryColors.general

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="/dashboard" style={{
            color: '#6b7280', textDecoration: 'none', fontSize: '13px', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Înapoi
          </a>
          {isOwner && (
            <button onClick={handleDelete} disabled={deleting}
              style={{
                background: 'none', border: '1.5px solid #dc2626', borderRadius: '8px',
                color: '#dc2626', padding: '6px 14px', cursor: 'pointer',
                fontFamily: 'Outfit', fontWeight: 600, fontSize: '12px',
                transition: 'all 0.15s'
              }}>
              {deleting ? 'Se șterge...' : '🗑️ Șterge'}
            </button>
          )}
        </div>
      </nav>

      {/* MAIN */}
      <main style={{ maxWidth: '780px', margin: '0 auto', padding: '32px 20px 100px' }}>
        {/* RECIPE HEADER */}
        <div style={{ marginBottom: '24px' }}>
          {recipe.category && (
            <span style={{
              background: catStyle.bg, color: catStyle.text, padding: '3px 10px', borderRadius: '5px',
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em'
            }}>
              {recipe.category}
            </span>
          )}
          <h1 style={{ margin: '10px 0 8px', fontSize: '28px', fontWeight: 900, color: '#111', lineHeight: 1.1, letterSpacing: '-0.04em' }}>{recipe.title}</h1>
          {recipe.description && <p style={{ margin: '0 0 12px', fontSize: '15px', color: '#6b7280', lineHeight: 1.6 }}>{recipe.description}</p>}
          <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#9ca3af', flexWrap: 'wrap' }}>
            {recipe.prep_time && <span>Prep: {recipe.prep_time} min</span>}
            {recipe.cook_time && <span>Gătit: {recipe.cook_time} min</span>}
            {recipe.source_url && <a href={recipe.source_url} target="_blank" style={{ color: '#1a6b3c', textDecoration: 'none', fontWeight: 600 }}>Sursă originală →</a>}
          </div>
        </div>

        {/* SERVINGS */}
        <div style={{
          background: 'white', borderRadius: '14px', padding: '18px 22px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e5e5e1',
          marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#111' }}>Porții</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={() => setServings(s => Math.max(1, s - 1))}
              style={{
                width: '36px', height: '36px', borderRadius: '10px', border: '1.5px solid #e5e5e1',
                background: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: 600, color: '#4A5568',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
              }}>−</button>
            <span style={{ fontWeight: 800, fontSize: '18px', minWidth: '70px', textAlign: 'center' }}>{portii(servings)}</span>
            <button onClick={() => setServings(s => Math.min(20, s + 1))}
              style={{
                width: '36px', height: '36px', borderRadius: '10px', border: '1.5px solid #e5e5e1',
                background: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: 600, color: '#4A5568',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
              }}>+</button>
          </div>
        </div>

        {/* INGREDIENTS */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div style={{
            background: 'white', borderRadius: '14px', padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e5e5e1',
            marginBottom: '14px'
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111' }}>Ingrediente</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recipe.ingredients.map(ing => (
                <li key={ing.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                  <span style={{ color: '#4A5568' }}>{ing.name}</span>
                  <span style={{ fontWeight: 600, color: '#111' }}>{fmt(ing.amount)} {ing.unit || ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* STEPS */}
        {recipe.steps && recipe.steps.length > 0 && (
          <div style={{
            background: 'white', borderRadius: '14px', padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e5e5e1',
            marginBottom: '14px'
          }}>
            <h2 style={{ margin: '0 0 18px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111' }}>Mod de preparare</h2>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {recipe.steps.map((step, i) => (
                <li key={step.id} style={{ display: 'flex', gap: '16px' }}>
                  <span style={{
                    width: '30px', height: '30px', borderRadius: '50%', background: '#d1fae5',
                    color: '#065f46', fontSize: '13px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {i + 1}
                  </span>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '15px', color: '#111' }}>{step.title}</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: 1.7 }}>{step.content}</p>
                    {step.timerSeconds && (
                      <span style={{ fontSize: '13px', color: '#e67e22', marginTop: '6px', display: 'inline-block' }}>
                        ⏱ {Math.floor(step.timerSeconds / 60)} min
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* NOTES */}
        {recipe.notes && (
          <div style={{
            background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px',
            padding: '16px 18px', marginBottom: '24px'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#92400e', fontStyle: 'italic' }}>{recipe.notes}</p>
          </div>
        )}

        {/* COMMUNITY RECIPES */}
        {community.length > 0 && (
          <div>
            <h2 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: '14px' }}>Alte rețete</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {community.map(r => (
                <a key={r.id} href={`/recipe/${r.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'white', borderRadius: '12px', padding: '16px 20px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)', border: '1px solid #e5e5e1',
                    borderLeft: '4px solid #e5e5e1', transition: 'transform 0.15s, box-shadow 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.07)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)' }}
                  >
                    <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#111', letterSpacing: '-0.02em' }}>{r.title}</h3>
                    {r.description && <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>{r.description}</p>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
