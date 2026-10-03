import random
import string
from datetime import datetime, timedelta
import re

from flask import Blueprint,request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash

from backend.extensions import db, mail
from backend.models import User
from backend.utils import validate_password_strength, validate_email
from flask_mail import Message

auth_bp = Blueprint('auth', __name__, url_prefix='/api')

verification_codes = {}

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password or not email:
        return jsonify({'error': 'Username, email and password required'}), 400

    is_valid, error_msg = validate_password_strength(password)
    if not is_valid:
      return jsonify({'error': error_msg}), 400


    if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
      return jsonify({'error': 'Invalid email format'}), 400
    
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

@auth_bp.route('/login', methods=['POST'])
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

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/send-code', methods=['POST'])
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

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    code = data.get('code', '').strip()
    new_password = data.get('password', '').strip()
    
    if not email or not code or not new_password:
        return jsonify({'error': 'All fields are required'}), 400

    is_valid, error_msg = validate_password_strength(new_password)
    if not is_valid:
      return jsonify({'error': error_msg}), 400
    
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
