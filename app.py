# -*- coding: utf-8 -*-
"""
MoodTracker - Flask Application
Backend API server with static file hosting and HTML template rendering
"""

from flask import Flask, session, request, jsonify, send_from_directory, render_template, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import timedelta, datetime
from werkzeug.security import generate_password_hash, check_password_hash
import os

# ============================================
# Flask Application Configuration
# ============================================

app = Flask(__name__, static_folder='static', static_url_path='')

# Secret key for session encryption
app.config['SECRET_KEY'] = 'moodtracker-secret-key-2026'

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Session configuration
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

# Enable CORS for frontend access
CORS(app, supports_credentials=True)

# ============================================
# Database Initialization & Models
# ============================================

db = SQLAlchemy(app)

class User(db.Model):
    """User account model"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    security_question = db.Column(db.String(200))
    security_answer_hash = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    emotion_logs = db.relationship('EmotionLog', backref='user', lazy=True, cascade='all, delete-orphan')


class EmotionLog(db.Model):
    """Emotion log model"""
    __tablename__ = 'emotion_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    emotion = db.Column(db.String(30), nullable=False)
    note = db.Column(db.String(300))
    log_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=default=db.func.current_timestamp())


# ============================================
# Helper Functions
# ============================================

def get_current_user():
    """Get current logged-in user"""
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)


# ============================================
# Page View Routes (HTML Templates & Static)
# ============================================

@app.route('/')
def index():
    """Serve login page"""
    return render_template('index.html')


@app.route('/register', methods=['GET', 'POST'])
def register_page():
    """Handle HTML form registration"""
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '').strip()

        if not username or not password or not email:
            flash('All fields are required.', 'danger')
            return render_template('register.html')

        if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
            flash('User already exists with that username or email.', 'danger')
            return render_template('register.html')

        new_user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password)
        )
        db.session.add(new_user)
        db.session.commit()

        flash('Registration successful! Please sign in.', 'success')
        return redirect(url_for('index'))

    return render_template('register.html')


# ============================================
# API Routes - User Authentication (JSON)
# ============================================

@app.route('/api/status')
def status():
    return jsonify({'status': 'online', 'version': '1.0.0'})


@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password)
    )
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Registration successful', 'user_id': user.id}), 201


@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    user = User.query.filter_by(username=username).first()
    
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    session['user_id'] = user.id
    session.permanent = True
    
    return jsonify({
        'success': True,
        'user': {'id': user.id, 'username': user.username, 'email': user.email}
    }), 200


@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200


@app.route('/api/user', methods=['GET', 'PUT', 'DELETE'])
def handle_user():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    if request.method == 'GET':
        return jsonify({'id': user.id, 'username': user.username, 'email': user.email}), 200
        
    elif request.method == 'PUT':
        data = request.get_json() or {}
        if 'email' in data: user.email = data['email']
        if 'password' in data: user.password_hash = generate_password_hash(data['password'])
        db.session.commit()
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    elif request.method == 'DELETE':
        db.session.delete(user)
        db.session.commit()
        session.clear()
        return jsonify({'message': 'Account deleted successfully'}), 200


# ============================================
# API Routes - Emotion Logs & Analytics
# ============================================

@app.route('/api/logs', methods=['GET', 'POST'])
def handle_emotion_logs():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    if request.method == 'POST':
        data = request.get_json() or {}
        emotion = data.get('emotion', '').strip()
        note = data.get('note', '').strip()
        log_date_str = data.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        if not emotion:
            return jsonify({'error': 'Emotion is required'}), 400
            
        log = EmotionLog(
            user_id=user.id,
            emotion=emotion,
            note=note,
            log_date=datetime.strptime(log_date_str, '%Y-%m-%d').date()
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({'success': True, 'log_id': log.id}), 201
        
    elif request.method == 'GET':
        logs = EmotionLog.query.filter_by(user_id=user.id).order_by(EmotionLog.log_date.desc()).all()
        return jsonify({
            'logs': [{'id': l.id, 'emotion': l.emotion, 'note': l.note, 'log_date': l.log_date.isoformat()} for l in logs]
        }), 200


@app.route('/api/stats', methods=['GET'])
def get_stats():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    days = request.args.get('days', 30, type=int)
    start_date = datetime.now().date() - timedelta(days=days)
    logs = EmotionLog.query.filter_by(user_id=user.id).filter(EmotionLog.log_date >= start_date).all()
    
    stats = {}
    for log in logs:
        stats[log.emotion] = stats.get(log.emotion, 0) + 1
    
    return jsonify({
        'total': len(logs),
        'days': days,
        'statistics': [{'emotion': k, 'count': v} for k, v in stats.items()]
    }), 200

# ============================================
# Database Creation & Application Runner
# ============================================

with app.app_context():
    db.create_all()
    print("✅ Database tables verified")

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 MoodTracker Server Starting...")
    print("🌐 Server: http://127.0.0.1:5000")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)


# ============================================
# Requirement d: Rule-Based Emotion Analysis
# ============================================

def analyze_emotion_text(text):
    """Simple rule-based emotion detector based on keywords"""
    text_lower = text.lower()
    
    anxious_keywords = ['anxious', 'worried', 'stressed', 'panic', 'nervous', 'scared']
    sad_keywords = ['sad', 'depressed', 'unhappy', 'lonely', 'crying', 'down']
    happy_keywords = ['happy', 'excited', 'joy', 'great', 'awesome', 'good', 'glad']
    
    if any(word in text_lower for word in anxious_keywords):
        return 'Anxious'
    elif any(word in text_lower for word in sad_keywords):
        return 'Sad'
    elif any(word in text_lower for word in happy_keywords):
        return 'Happy'
    
    return 'Neutral'


# ============================================
# Requirement c: Forgot / Reset Password Endpoint
# ============================================

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    """Reset user password using email"""
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    new_password = data.get('password', '').strip()
    
    if not email or not new_password:
        return jsonify({'error': 'Email and new password are required'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'No account found with that email address'}), 404
        
    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Password updated successfully'}), 200
