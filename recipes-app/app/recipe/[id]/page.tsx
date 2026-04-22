import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import RecipeDetail from './RecipeDetail'

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: recipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()

  if (!recipe) notFound()

  const { data: communityRaw } = await supabase
    .from('recipes')
    .select('id, title, description, category, cook_time, base_servings, ingredients, steps, user_id')
    .eq('is_public', true)
    .neq('id', id)
    .limit(6)
    .order('created_at', { ascending: false })

  return <RecipeDetail recipe={recipe} community={communityRaw || []} userId={user?.id} />
}
