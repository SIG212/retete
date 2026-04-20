import yt_dlp
from flask import Flask, request, jsonify
import os
import tempfile

app = Flask(__name__)

@app.route('/caption', methods=['POST'])
def get_caption():
    data = request.json
    url = data.get('url')
    
    if not url:
        return jsonify({'error': 'URL lipsă'}), 400
    
    try:
        cookies_content = os.environ.get('INSTAGRAM_COOKIES', '')
        
        ydl_opts = {
            'quiet': False,
            'extract_flat': True,
        }
        
        if cookies_content:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
                f.write(cookies_content)
                cookies_file = f.name
            ydl_opts['cookiefile'] = cookies_file
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            caption = info.get('description', '')
            print(f"CAPTION EXTRAS: {caption[:200]}")
            
        if not caption:
            return jsonify({'error': 'Caption gol — post privat sau URL invalid'}), 422
            
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
