import { NextResponse } from 'next/server'

export const maxDuration = 60

const FLASK_URL = 'https://retete-production.up.railway.app'

async function getTextFromSource(mode: string, input: string): Promise<{ text?: string, recipe?: any }> {
  if (mode === 'instagram') {
    const res = await fetch(`${FLASK_URL}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: input }),
      signal: AbortSignal.timeout(55000)
    })
    const data = await res.json()
    if (data.error) {
      if (data.error.includes('rate-limit') || data.error.includes('login required') || data.error.includes('not available')) {
        throw new Error('Instagram a blocat requestul temporar. Copiază descrierea postului și lipește-o în câmpul de text.')
      }
      throw new Error(`Instagram: ${data.error}`)
    }
    return { recipe: data }
  }

  if (mode === 'url') {
    try {
      const res = await fetch(input, {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      })
      const html = await res.text()
      if (!html.includes('challenge-platform') && !html.includes('Just a moment')) {
        return { text: html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 8000) }
      }
    } catch {}
    const jinaRes = await fetch(`https://r.jina.ai/${input}`, {
      signal: AbortSignal.timeout(20000),
      headers: { 'Accept': 'text/plain' }
    })
    const text = await jinaRes.text()
    return { text: text.slice(0, 8000) }
  }

  return { text: input }
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
    const source = await getTextFromSource(mode, input)

    // Instagram returneaza deja reteta procesata de Flask
    if (source.recipe) {
      if (source.recipe.error === 'no_recipe') {
        return NextResponse.json({ error: 'Nu am reușit să găsesc o rețetă în sursa indicată.' }, { status: 422 })
      }
      if (!isValidRecipe(source.recipe)) {
        return NextResponse.json({ error: 'Nu am reușit să extrag rețeta. Încearcă cu Text / paste.' }, { status: 422 })
      }
      return NextResponse.json(source.recipe)
    }

    // URL si text merg prin DeepSeek din Next.js
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

Dacă conține o rețetă, extrage și traduce TOTUL în limba română. Returnează DOAR JSON valid cu structura:
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
Nu inventa date. Dacă lipsește o informație pune null. Totul în română. Convertește toate unitățile imperiale în metric.`
          },
          {
            role: 'user',
            content: `Extrage rețeta din acest text:\n\n${source.text}`
          }
        ],
        temperature: 0,
        response_format: { type: 'json_object' }
      }),
      signal: AbortSignal.timeout(45000)
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
