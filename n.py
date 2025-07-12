from flask import Flask, request, jsonify
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

def get_google_image_url(query):
    search_url = "https://www.google.com/search?tbm=isch&q=" + requests.utils.quote(query)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
    }
    resp = requests.get(search_url, headers=headers)
    soup = BeautifulSoup(resp.text, "html.parser")
    images = soup.find_all("img")
    # The first image is usually the Google logo, so skip it
    for img in images[1:]:
        src = img.get("src")
        if src and src.startswith("http"):
            return src
    return None

@app.route('/image', methods=['POST'])
def image():
    data = request.get_json()
    if not data or 'q' not in data:
        return jsonify({"error": "Missing 'q' in JSON body"}), 400
    query = data['q']
    img_url = get_google_image_url(query)
    if img_url:
        return jsonify({"image_url": img_url})
    else:
        return jsonify({"error": "No image found"}), 404

if __name__ == '__main__':
    app.run(debug=True)
