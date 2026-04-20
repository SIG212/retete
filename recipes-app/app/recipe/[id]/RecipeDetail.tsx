'use client'
import { useState } from 'react'

type Ingredient = { id: string; name: string; amount: number; unit?: string }
type Step = { id: string; title: string; content: string; timerSeconds?: number }
type Recipe = {
  id: string; title: string; description?: string; category?: string
  base_servings: number; prep_time?: number; cook_time?: number
  ingredients: Ingredient[]; steps: Step[]; notes?: string; source_url?: string
}

export default function RecipeDetail({ recipe, community }: { recipe: Recipe, community: Recipe[] }) {
  const [servings, setServings] = useState(recipe.base_servings)
  const scale = servings / recipe.base_servings
  const fmt = (n: number) => Number.isInteger(n) ? Math.round(n * scale) : Math.round(n * scale * 10) / 10

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7F6', fontFamily: 'Outfit, sans-serif' }}>
      <nav style={{ background: '#1E293B', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 10 }}>
        <a href="/dashboard" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.9rem' }}>← Înapoi</a>
      </nav>

      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          {recipe.category && (
            <span style={{ background: '#F0FDF4', color: '#2D5A27', padding: '2px 10px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
              {recipe.category}
            </span>
          )}
          <h1 style={{ margin: '8px 0 6px', fontSize: '1.6rem', fontWeight: 700, color: '#1A202C', lineHeight: 1.2 }}>{recipe.title}</h1>
          {recipe.description && <p style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#718096', lineHeight: 1.6 }}>{recipe.description}</p>}
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#94A3B8', flexWrap: 'wrap' }}>
            {recipe.prep_time && <span>Prep: {recipe.prep_time} min</span>}
            {recipe.cook_time && <span>Gătit: {recipe.cook_time} min</span>}
            {recipe.source_url && <a href={recipe.source_url} target="_blank" style={{ color: '#2D5A27' }}>Sursă originală</a>}
          </div>
        </div>

        {/* Porții */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1A202C' }}>Porții</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={() => setServings(s => Math.max(1, s - 1))}
              style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600, color: '#4A5568', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', minWidth: '20px', textAlign: 'center' }}>{servings}</span>
            <button onClick={() => setServings(s => Math.min(20, s + 1))}
              style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600, color: '#4A5568', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>
        </div>

        {/* Ingrediente */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '14px' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1A202C' }}>Ingrediente</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recipe.ingredients?.map(ing => (
              <li key={ing.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid #F8FAFC', paddingBottom: '8px' }}>
                <span style={{ color: '#4A5568' }}>{ing.name}</span>
                <span style={{ fontWeight: 600, color: '#1A202C' }}>{fmt(ing.amount)} {ing.unit || ''}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pași */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '14px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1A202C' }}>Mod de preparare</h2>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recipe.steps?.map((step, i) => (
              <li key={step.id} style={{ display: 'flex', gap: '14px' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F0FDF4', color: '#2D5A27', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {i + 1}
                </span>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.95rem', color: '#1A202C' }}>{step.title}</p>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#718096', lineHeight: 1.7 }}>{step.content}</p>
                  {step.timerSeconds && (
                    <span style={{ fontSize: '0.78rem', color: '#E67E22', marginTop: '4px', display: 'inline-block' }}>
                      ⏱ {Math.floor(step.timerSeconds / 60)} min
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {recipe.notes && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '14px 16px', marginBottom: '24px' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400E', fontStyle: 'italic' }}>{recipe.notes}</p>
          </div>
        )}

        {/* Community */}
        {community.length > 0 && (
          <div>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8', marginBottom: '12px' }}>Alte rețete</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {community.map(r => (
                <a key={r.id} href={`/recipe/${r.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'white', borderRadius: '10px', padding: '14px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', borderLeft: '3px solid #E2E8F0' }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 600, color: '#1A202C' }}>{r.title}</h3>
                    {r.description && <p style={{ margin: 0, fontSize: '0.82rem', color: '#94A3B8' }}>{r.description}</p>}
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
