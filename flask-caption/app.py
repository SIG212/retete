import yt_dlp
from flask import Flask, request, jsonify
import os
import tempfile

app = Flask(__name__)

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

@app.route('/caption', methods=['POST'])
def get_caption():
    data = request.json
    url = data.get('url')

    if not url:
        return jsonify({'error': 'URL lipsă'}), 400

    try:
        platform = detect_platform(url)
        cookies_file = get_cookies_file(platform)

        ydl_opts = {
            'quiet': False,
            'extract_flat': False,
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        }

        if cookies_file:
            ydl_opts['cookiefile'] = cookies_file

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            print(f"TITLE: {info.get('title')}")
            print(f"DESCRIPTION: {info.get('description', '')[:300]}")

            caption = info.get('description') or info.get('fulltitle') or ''
            
            if not caption or caption.lower() in ['facebook', 'instagram']:
                return jsonify({'error': 'Caption gol — postul nu are text sau e privat'}), 422

            print(f"CAPTION FINAL: {caption[:300]}")

        return jsonify({'caption': caption})

    except Exception as e:
        print(f"EROARE: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
