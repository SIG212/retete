'use client'
import { useState } from 'react'
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

export default function DashboardClient({ recipes: initialRecipes }: { recipes: Recipe[] }) {
  const [query, setQuery] = useState('')
  const [recipes, setRecipes] = useState(initialRecipes)
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()

  const normalize = (s: string) =>
    s.toLowerCase()
     .normalize('NFD')
     .replace(/[\u0300-\u036f]/g, '')

  const filtered = recipes.filter(r => {
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

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7F6', fontFamily: 'Outfit, sans-serif' }}>
      <nav style={{ background: '#1E293B', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ color: '#4ADE80', fontWeight: 700, fontSize: '1.2rem' }}>🍽️ Rețete</span>
        <a href="/add" style={{ background: '#2D5A27', color: 'white', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
          + Adaugă
        </a>
      </nav>

      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 16px' }}>
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Caută rețete sau ingrediente..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ width: '100%', padding: '12px 18px 12px 42px', borderRadius: '24px', border: '1px solid #ddd', fontFamily: 'Outfit', fontSize: '0.95rem', background: 'white', boxSizing: 'border-box' }}
          />
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>🔍</span>
          {query && (
            <button onClick={() => setQuery('')}
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '1rem', padding: 0 }}>
              ✕
            </button>
          )}
        </div>

        {query && (
          <p style={{ fontSize: '0.82rem', color: '#94A3B8', marginBottom: '16px' }}>
            {filtered.length} {filtered.length === 1 ? 'rezultat' : 'rezultate'} pentru „{query}"
          </p>
        )}

        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(recipe => (
              <a key={recipe.id} href={`/recipe/${recipe.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #2D5A27', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ background: '#F0FDF4', color: '#2D5A27', padding: '2px 10px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      {recipe.category || 'general'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {recipe.cook_time && (
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{recipe.cook_time} min</span>
                      )}
                      <button
                        onClick={e => handleDelete(e, recipe.id)}
                        disabled={deleting === recipe.id}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '1rem', padding: '2px 4px', borderRadius: '4px', lineHeight: 1 }}
                        title="Șterge rețeta">
                        {deleting === recipe.id ? '...' : '🗑️'}
                      </button>
                    </div>
                  </div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 600, color: '#1A202C' }}>{recipe.title}</h3>
                  {recipe.description && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#718096', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {recipe.description}
                    </p>
                  )}
                  <div style={{ marginTop: '10px', fontSize: '0.78rem', color: '#94A3B8' }}>
                    {recipe.base_servings} porții · {recipe.ingredients?.length || 0} ingrediente
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            {query ? (
              <>
                <p style={{ color: '#94A3B8', marginBottom: '8px' }}>Niciun rezultat pentru „{query}"</p>
                <button onClick={() => setQuery('')} style={{ color: '#2D5A27', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Outfit' }}>
                  Șterge căutarea
                </button>
              </>
            ) : (
              <>
                <p style={{ color: '#94A3B8', marginBottom: '12px' }}>Nu ai nicio rețetă încă.</p>
                <a href="/add" style={{ color: '#2D5A27', fontWeight: 600, textDecoration: 'underline' }}>Adaugă prima rețetă</a>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
