from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads/'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/feedback', methods=['POST'])
def feedback():
    data = request.form.to_dict()
    # Store feedback in a file or database (placeholder)
    print('Received feedback:', data)
    return jsonify({'status': 'success', 'message': 'Feedback received.'})

@app.route('/food_detect', methods=['POST'])
def food_detect():
    input_type = request.form.get('image_or_ingredient_list')
    if input_type == 'ingredient_list':
        ingredients = request.form.get('ingredient_list')
        print('Received ingredient list:', ingredients)
        # Process ingredients (placeholder)
        return jsonify({'status': 'success', 'ingredients': ingredients})
    elif input_type == 'image':
        if 'image' not in request.files:
            return jsonify({'status': 'error', 'message': 'No image uploaded.'}), 400
        file = request.files['image']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            print('Image saved:', filename)
            # Process image (placeholder)
            return jsonify({'status': 'success', 'image': filename})
        else:
            return jsonify({'status': 'error', 'message': 'Invalid file type.'}), 400
    else:
        return jsonify({'status': 'error', 'message': 'Invalid input type.'}), 400

@app.route('/meal_plan', methods=['POST'])
def save_meal_plan():
    data = request.get_json()
    print('Received meal plan:', data)
    # Store meal plan (placeholder)
    return jsonify({'status': 'success', 'message': 'Meal plan saved.'})

@app.route('/meal_plan', methods=['GET'])
def get_meal_plan():
    # Retrieve meal plan (placeholder)
    return jsonify({'status': 'success', 'meal_plan': []})

if __name__ == '__main__':
    app.run(debug=True)
