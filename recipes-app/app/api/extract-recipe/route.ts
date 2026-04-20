import { NextResponse } from 'next/server'

const FLASK_URL = 'https://retete-7p0b.onrender.com'

async function getTextFromSource(mode: string, input: string): Promise<string> {
  if (mode === 'instagram') {
    const res = await fetch(`${FLASK_URL}/caption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: input })
    })
    const data = await res.json()
    if (data.error) throw new Error(`Instagram: ${data.error}`)
    return data.caption
  }

  if (mode === 'url') {
    const res = await fetch(input)
    const html = await res.text()
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 4000)
  }

  return input
}

function isValidRecipe(recipe: any): boolean {
  if (!recipe.title || typeof recipe.title !== 'string') return false
  if (!recipe.ingredients || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) return false
  if (!recipe.steps || !Array.isArray(recipe.steps) || recipe.steps.length === 0) return false
  return true
}

export async function POST(request: Request) {
  const { mode, input } = await request.json()

  if (!input) return NextResponse.json({ error: 'Input lipsă' }, { status: 400 })

  try {
    const text = await getTextFromSource(mode, input)

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `Ești un extractor de rețete. Dacă textul nu conține o rețetă clară, returnează exact: {"error": "no_recipe"}

Dacă conține o rețetă, extrage și traduce TOTUL în limba română, inclusiv numele ingredientelor, titlul pașilor și descrierile. Returnează DOAR JSON valid cu structura:
{
  "title": string,
  "description": string,
  "category": string,
  "base_servings": number,
  "prep_time": number,
  "cook_time": number,
  "ingredients": [{"id": "0001", "name": string, "amount": number, "unit": string sau null}],
  "steps": [{"id": "s1", "title": string, "content": string, "timerSeconds": number sau null}],
  "notes": string sau null
}
Nu inventa date. Dacă lipsește o informație pune null. Totul în română.`
          },
          {
            role: 'user',
            content: `Extrage rețeta din acest text:\n\n${text}`
          }
        ],
        temperature: 0,
        response_format: { type: 'json_object' }
      })
    })

    const data = await response.json()
    const recipe = JSON.parse(data.choices[0].message.content)

    if (recipe.error === 'no_recipe') {
      return NextResponse.json({ error: 'Nu am reușit să găsesc o rețetă în sursa indicată.' }, { status: 422 })
    }

    if (!isValidRecipe(recipe)) {
      return NextResponse.json({ error: 'Nu am reușit să extrag rețeta. Încearcă cu Text / paste.' }, { status: 422 })
    }

    return NextResponse.json(recipe)

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
