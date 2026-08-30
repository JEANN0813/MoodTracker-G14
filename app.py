from flask import Flask, session, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import timedelta, datetime
from werkzeug.security import generate_password_hash, check_password_hash
import secrets  
import os

# Flask Application Configuration
app = Flask(__name__, static_folder='static', static_url_path='')

app.config['SECRET_KEY'] = 'moodtracker-secret-key-2026'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

# Enable CORS for frontend access
CORS(app, supports_credentials=True)

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    security_question = db.Column(db.String(200))
    security_answer_hash = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
   
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expiration = db.Column(db.DateTime, nullable=True)
    
    emotion_logs = db.relationship('EmotionLog', backref='user', lazy=True, cascade='all, delete-orphan')

class EmotionLog(db.Model):
    __tablename__ = 'emotion_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    emotion = db.Column(db.String(30), nullable=False)
    note = db.Column(db.String(300))
    log_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)

# Static File Routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_static(path):
    if path == '':
        return send_from_directory('static', 'index.html')
    file_path = os.path.join('static', path)
    if os.path.exists(file_path):
        return send_from_directory('static', path)
    return jsonify({'error': 'Not found'}), 404

# API Routes - User Authentication
@app.route('/api/status')
def status():
    return jsonify({'status': 'online', 'message': 'MoodTracker API is running', 'version': '1.0.0'})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    user = User(username=username, email=email, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Registration successful', 'user_id': user.id}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    session['user_id'] = user.id
    session.permanent = True
    
    return jsonify({'success': True, 'message': 'Login successful', 'user': {'id': user.id, 'username': user.username, 'email': user.email}}), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/user', methods=['GET'])
def get_user():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    return jsonify({'id': user.id, 'username': user.username, 'email': user.email, 'created_at': user.created_at.isoformat() if user.created_at else None}), 200


@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    
    user = User.query.filter_by(email=email).first()
    if not user:
        
        return jsonify({'message': 'If the email exists, a reset code has been sent.'}), 200
    
    
    reset_code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
    
    
    user.reset_token = reset_code
    user.reset_token_expiration = datetime.now() + timedelta(minutes=15)
    db.session.commit()
    
    
    return jsonify({'message': 'Reset code generated.', 'reset_code': reset_code}), 200

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    email = data.get('email')
    reset_code = data.get('reset_code')
    new_password = data.get('new_password')
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.reset_token != reset_code:
        return jsonify({'error': 'Invalid reset code'}), 400
    
    if datetime.now() > user.reset_token_expiration:
        return jsonify({'error': 'Reset code expired'}), 400
    
    user.password_hash = generate_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expiration = None
    db.session.commit()
    
    return jsonify({'message': 'Password reset successfully'}), 200


@app.route('/api/logs', methods=['POST'])
def add_emotion_log():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    emotion = data.get('emotion', '').strip()
    note = data.get('note', '').strip()
    log_date_str = data.get('date', datetime.now().strftime('%Y-%m-%d'))
    
    if not emotion:
        return jsonify({'error': 'Emotion is required'}), 400
    
    try:
        log_date = datetime.strptime(log_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    log = EmotionLog(user_id=user.id, emotion=emotion, note=note, log_date=log_date)
    db.session.add(log)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Log added successfully', 'log_id': log.id}), 201

@app.route('/api/logs', methods=['GET'])
def get_emotion_logs():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    logs = EmotionLog.query.filter_by(user_id=user.id).order_by(
        EmotionLog.log_date.desc(),
        EmotionLog.created_at.desc()
    ).all()
    
    return jsonify({'logs': [{'id': log.id, 'emotion': log.emotion, 'note': log.note, 'log_date': log.log_date.isoformat(), 'created_at': log.created_at.isoformat() if log.created_at else None} for log in logs]}), 200

@app.route('/api/logs/<int:log_id>', methods=['PUT'])
def update_emotion_log(log_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    log = EmotionLog.query.get(log_id)
    if not log:
        return jsonify({'error': 'Log not found'}), 404
    
    if log.user_id != user.id:
        return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    if 'emotion' in data:
        log.emotion = data['emotion']
    if 'note' in data:
        log.note = data['note']
    
    db.session.commit()
    return jsonify({'message': 'Log updated successfully'}), 200

@app.route('/api/logs/<int:log_id>', methods=['DELETE'])
def delete_emotion_log(log_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    log = EmotionLog.query.get(log_id)
    if not log:
        return jsonify({'error': 'Log not found'}), 404
    
    if log.user_id != user.id:
        return jsonify({'error': 'Permission denied'}), 403
    
    db.session.delete(log)
    db.session.commit()
    return jsonify({'message': 'Log deleted successfully'}), 200

@app.route('/api/calendar/<int:year>/<int:month>', methods=['GET'])
def get_calendar(year, month):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    start_date = datetime(year, month, 1).date()
    if month == 12:
        end_date = datetime(year + 1, 1, 1).date()
    else:
        end_date = datetime(year, month + 1, 1).date()
    
    logs = EmotionLog.query.filter_by(user_id=user.id).filter(
        EmotionLog.log_date >= start_date,
        EmotionLog.log_date < end_date
    ).order_by(EmotionLog.created_at.desc()).all()
    
    daily_emotions = {}
    for log in logs:
        date_str = log.log_date.isoformat()
        if date_str not in daily_emotions:
            daily_emotions[date_str] = log.emotion
    
    return jsonify({'year': year, 'month': month, 'data': daily_emotions}), 200

@app.route('/api/stats', methods=['GET'])
def get_stats():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    days = request.args.get('days', 30, type=int)
    start_date = datetime.now().date() - timedelta(days=days)
    
    logs = EmotionLog.query.filter_by(user_id=user.id).filter(
        EmotionLog.log_date >= start_date
    ).all()
    
    stats = {}
    for log in logs:
        stats[log.emotion] = stats.get(log.emotion, 0) + 1
    
    return jsonify({'total': len(logs), 'days': days, 'statistics': [{'emotion': k, 'count': v} for k, v in stats.items()]}), 200



with app.app_context():
    db.create_all()
    print("Database tables verified")


# Run the application
if __name__ == '__main__':
    print()
    print("MoodTracker Server Starting...")
    print()
    print(f"Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print(f"Server: http://127.0.0.1:5000")
    print(f"Static folder: static/")
    print(f"Debug Mode: ON")
    print()
    print("Access the web app:")
    print("  http://127.0.0.1:5000")
    print()
    print("Press Ctrl+C to stop the server")
    print()
    
    app.run(debug=True, host='0.0.0.0', port=5000)