import yt_dlp
from flask import Flask, request, jsonify
import os
import tempfile
import json
import google.generativeai as genai

app = Flask(__name__)

genai.configure(api_key=os.environ.get('GEMINI_API_KEY', ''))

SYSTEM_PROMPT = """Ești un extractor de rețete. Dacă textul nu conține o rețetă clară, returnează exact: {"error": "no_recipe"}

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
Nu inventa date. Dacă lipsește o informație pune null. Totul în română. Convertește toate unitățile imperiale în metric."""

def get_cookies_file(platform):
    env_var = 'INSTAGRAM_COOKIES' if platform == 'instagram' else 'FACEBOOK_COOKIES'
    cookies_content = os.environ.get(env_var, '')
    if not cookies_content:
        return None
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write(cookies_content)
        return f.name

def detect_platform(url):
    if 'instagram.com' in url:
        return 'instagram'
    if 'facebook.com' in url or 'fb.watch' in url:
        return 'facebook'
    return 'other'

def extract_with_gemini(text):
    import time
    model = genai.GenerativeModel('gemini-2.5-flash-lite')
    for attempt in range(3):
        try:
            response = model.generate_content(
                f"{SYSTEM_PROMPT}\n\nExtrage rețeta din acest text:\n\n{text}",
                generation_config=genai.GenerationConfig(
                    response_mime_type='application/json'
                )
            )
            return json.loads(response.text)
        except Exception as e:
            if '429' in str(e) and attempt < 2:
                time.sleep(5)
                continue
            raise e

@app.route('/extract', methods=['POST'])
def extract():
    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({'error': 'URL lipsă'}), 400

    try:
        platform = detect_platform(url)
        cookies_file = get_cookies_file(platform)

        ydl_opts = {
            'quiet': True,
            'extract_flat': True,
            'skip_download': True,
            'no_playlist': True,
        }
        if cookies_file:
            ydl_opts['cookiefile'] = cookies_file

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            caption = info.get('description', '')

        if not caption:
            return jsonify({'error': 'Caption gol — post privat sau URL invalid'}), 422

        recipe = extract_with_gemini(caption)
        return jsonify(recipe)

    except Exception as e:
        print(f"EROARE: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/caption', methods=['POST'])
def get_caption():
    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({'error': 'URL lipsă'}), 400
    try:
        platform = detect_platform(url)
        cookies_file = get_cookies_file(platform)
        ydl_opts = {'quiet': True, 'extract_flat': True, 'skip_download': True, 'no_playlist': True}
        if cookies_file:
            ydl_opts['cookiefile'] = cookies_file
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            caption = info.get('description', '')
        if not caption:
            return jsonify({'error': 'Caption gol — post privat sau URL invalid'}), 422
        return jsonify({'caption': caption})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
