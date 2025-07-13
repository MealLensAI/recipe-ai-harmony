from flask import Flask, session, request, jsonify
from flask_session import Session
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SESSION_SECRET', 'supersecretkey')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = os.path.join(os.path.dirname(__file__), 'sessions')
Session(app)

@app.route('/api/session', methods=['POST'])
def create_session():
    session['user_id'] = request.json.get('user_id')
    return jsonify({'session_id': request.cookies.get('session'), 'user_id': session.get('user_id')}), 201

@app.route('/api/session', methods=['GET'])
def get_session():
    user_id = session.get('user_id')
    if user_id:
        return jsonify({'user_id': user_id}), 200
    return jsonify({'error': 'No active session'}), 404

if __name__ == '__main__':
    app.run(debug=True)
