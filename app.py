from flask import Flask, session, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import timedelta, datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Mail, Message
from sqlalchemy import func
import secrets
import os
import random
import string


app = Flask(__name__, static_folder='static', static_url_path='')

# Email configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')  
app.config['MAIL_DEFAULT_SENDER'] = ('MoodTracker Support', 'annannchan08132007@gmail.com')

mail = Mail(app)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(BASE_DIR, 'database.db')
app.config['SECRET_KEY'] = 'moodtracker-secret-key-2026'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

CORS(app, supports_credentials=True)
db = SQLAlchemy(app)
verification_codes = {}

# Database Models
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
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
    return db.session.get(User, user_id)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_static(path):
    if path == '':
        return send_from_directory('static', 'index.html')
    file_path = os.path.join('static', path)
    if os.path.exists(file_path):
        return send_from_directory('static', path)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/status')
def status():
    return jsonify({'status': 'online', 'message': 'MoodTracker API is running', 'version': '1.0.0'})
    
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password or not email:
        return jsonify({'error': 'Username, email and password required'}), 400
    
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400
    
    user = User(
        username=username, 
        email=email, 
        password_hash=generate_password_hash(password)
    )
    try:
        db.session.add(user)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Failed to create user"}), 400

    return jsonify({'success': True, 'message': 'Registration successful', 'user_id': user.id}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username_or_email = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if not username_or_email or not password:
        return jsonify({'error': 'Credentials required'}), 400
    
    user = User.query.filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    session['user_id'] = user.id
    session.permanent = True
    
    return jsonify({'success': True, 'message': 'Login successful', 'user': {'id': user.id, 'username': user.username, 'email': user.email}}), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/user', methods=['GET', 'PUT'])
def get_user():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    if request.method == 'PUT':
        data = request.get_json() or {}
        user.username = data.get('username', user.username)
        user.email = data.get('email', user.email)
        
        if 'password' in data and data['password']:
            user.password_hash = generate_password_hash(data['password'])
            
        db.session.commit()
        
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'created_at': user.created_at.isoformat() if user.created_at else None
    }), 200

@app.route('/api/user', methods=['DELETE'])
def delete_account():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    db.session.delete(user)
    db.session.commit()
    session.clear()
    return jsonify({'message': 'Account deleted successfully'}), 200


verification_codes = {}

@app.route('/api/send-code', methods=['POST'])
def send_code():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    
    code = ''.join(random.choices(string.digits, k=6))
    verification_codes[email] = {
        'code': code,
        'expires': datetime.now() + timedelta(minutes=5) 
    }

    
    try:
        msg = Message("Your Password Reset Verification Code", recipients=[email])
        msg.body = f"Hello,\n\nYour verification code is: {code}\n\nIt will expire in 5 minutes."
        mail.send(msg)
        return jsonify({'message': 'Verification code sent successfully!'}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to send email: {str(e)}'}), 500

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    code = data.get('code', '').strip()
    new_password = data.get('password', '').strip()
    
    if not email or not code or not new_password:
        return jsonify({'error': 'All fields are required'}), 400
    
    # Check verification code
    record = verification_codes.get(email)
    if not record:
        return jsonify({'error': 'No verification code found'}), 400
    
    if datetime.now() > record['expires']:
        del verification_codes[email]
        return jsonify({'error': 'Verification code expired'}), 400
    
    if record['code'] != code:
        return jsonify({'error': 'Invalid verification code'}), 400
    
    # Update password
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    
    # Remove used code
    del verification_codes[email]
    
    return jsonify({'success': True, 'message': 'Password reset successfully!'}), 200
# Logs Routes
@app.route('/api/logs', methods=['POST'])
def add_emotion_log():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json() or {}
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
    
    log = db.session.get(EmotionLog, log_id)
    if not log:
        return jsonify({'error': 'Log not found'}), 404
    
    if log.user_id != user.id:
        return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json() or {}
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
    
    log = db.session.get(EmotionLog, log_id)
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

@app.route('/api/analysis/frequency', methods=['GET'])
def get_emotion_frequency():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    days = request.args.get('days', 30, type=int)
    start_date = datetime.now().date() - timedelta(days=days)
    
    results = db.session.query(
        EmotionLog.emotion,
        func.count(EmotionLog.id).label('count')
    ).filter(
        EmotionLog.user_id == user.id,
        EmotionLog.log_date >= start_date
    ).group_by(
        EmotionLog.emotion
    ).order_by(
        func.count(EmotionLog.id).desc()
    ).all()
    
    total = sum(r.count for r in results)
    
    statistics = []
    for emotion, count in results:
        percentage = round((count / total) * 100) if total > 0 else 0
        statistics.append({
            'emotion': emotion,
            'count': count,
            'percentage': percentage
        })
    
    return jsonify({
        'total': total,
        'days': days,
        'statistics': statistics
    }), 200

@app.route('/api/analysis/trend', methods=['GET'])
def get_emotion_trend():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    weeks = request.args.get('weeks', 4, type=int)
    start_date = datetime.now().date() - timedelta(weeks=weeks)
    
    logs = EmotionLog.query.filter_by(user_id=user.id).filter(
        EmotionLog.log_date >= start_date
    ).order_by(EmotionLog.log_date).all()
    
    if not logs:
        return jsonify({
            'trend': 'no_data',
            'message': 'Not enough data to analyze trends. Keep logging!',
            'weekly_data': []
        }), 200
    
    weekly_data = {}
    happy_emotions = ['Happy', 'Calm', 'Excited']
    sad_emotions = ['Sad', 'Anxious', 'Angry']
    
    for log in logs:
        week_number = log.log_date.isocalendar()[1]
        week_key = f"Week {week_number}"
        
        if week_key not in weekly_data:
            weekly_data[week_key] = {'happy': 0, 'sad': 0, 'total': 0}
        
        if log.emotion in happy_emotions:
            weekly_data[week_key]['happy'] += 1
        elif log.emotion in sad_emotions:
            weekly_data[week_key]['sad'] += 1
        weekly_data[week_key]['total'] += 1
    
    weeks_list = list(weekly_data.keys())
    if len(weeks_list) >= 2:
        first_week = weeks_list[0]
        last_week = weeks_list[-1]
        
        first_happy = weekly_data[first_week].get('happy', 0)
        last_happy = weekly_data[last_week].get('happy', 0)
        first_sad = weekly_data[first_week].get('sad', 0)
        last_sad = weekly_data[last_week].get('sad', 0)
        
        if last_happy > first_happy and last_sad < first_sad:
            trend = 'improving'
            message = '📈 Your mood is improving! Keep it up!'
        elif last_happy < first_happy and last_sad > first_sad:
            trend = 'declining'
            message = '📉 Your mood seems to be declining. Consider talking to someone.'
        else:
            trend = 'stable'
            message = '➡ Your mood is relatively stable.'
    else:
        trend = 'insufficient_data'
        message = '📊 Not enough data yet. Keep logging your mood!'
    
    weekly_result = [{'week': week, **data} for week, data in weekly_data.items()]
    
    return jsonify({
        'trend': trend,
        'message': message,
        'weekly_data': weekly_result
    }), 200

@app.route('/api/analysis/suggestions', methods=['GET'])
def get_suggestions():
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
    
    suggestions = []
    sad_count = stats.get('Sad', 0) + stats.get('Anxious', 0)
    happy_count = stats.get('Happy', 0) + stats.get('Calm', 0)
    
    if sad_count > 5:
        suggestions.append('😢 You have been feeling down. Try talking to a friend.')
    if stats.get('Anxious', 0) > 3:
        suggestions.append('😰 You seem anxious. Try deep breathing exercises.')
    if happy_count > 5 and happy_count > sad_count:
        suggestions.append('😊 You are doing great! Keep up the positive energy!')
    if not suggestions:
        suggestions.append('📊 Keep logging your mood to get personalized suggestions!')
    
    suggestions.append('💪 Your feelings are valid. Take care of yourself today.')
    
    return jsonify({
        'suggestions': suggestions,
        'based_on_days': days
    }), 200

with app.app_context():
    db.create_all()

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