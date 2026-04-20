import yt_dlp
from flask import Flask, request, jsonify
import os

app = Flask(__name__)

@app.route('/caption', methods=['POST'])
def get_caption():
    data = request.json
    url = data.get('url')
    
    if not url:
        return jsonify({'error': 'URL lipsă'}), 400
    
    try:
        ydl_opts = {
            'quiet': True,
            'extract_flat': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            caption = info.get('description', '')
            
        if not caption:
            return jsonify({'error': 'Caption gol — post privat sau URL invalid'}), 422
            
        return jsonify({'caption': caption})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
