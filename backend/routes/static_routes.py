import os
from flask import Blueprint, jsonify, send_from_directory

static_bp = Blueprint('static', __name__)

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
STATIC_DIR = os.path.join(BASE_DIR, 'static')

@static_bp.route('/status')
def status():
    return jsonify({'status': 'online', 'message': 'MoodTracker API is running', 'version': '1.0.0'})

@static_bp.route('/', defaults={'path': ''})
@static_bp.route('/<path:path>')
def serve_static(path):
    static_dir = os.path.join(BASE_DIR, 'static')
    if path == '':
        return send_from_directory(static_dir, 'index.html')
    file_path = os.path.join(static_dir, path)
    if os.path.isfile(file_path):
        return send_from_directory(static_dir, path)
    return jsonify({'error': 'Not found', 'looked_for': file_path}), 404


