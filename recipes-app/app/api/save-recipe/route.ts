import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })

    const recipe = await request.json()

    const { error } = await supabase.from('recipes').insert({
      user_id: user.id,
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      base_servings: recipe.base_servings || 2,
      prep_time: recipe.prep_time,
      cook_time: recipe.cook_time,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      notes: recipe.notes,
      source_url: recipe.source_url,
      is_public: true
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
