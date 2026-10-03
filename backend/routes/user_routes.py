from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash

from backend.extensions import db
from backend.utils import get_current_user

user_bp = Blueprint('user', __name__, url_prefix='/api')


@user_bp.route('/user', methods=['GET', 'PUT'])
def get_user():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
        
    if request.method == 'PUT':
        data = request.get_json() or {}
        
        # 1. Username
        if 'username' in data and data['username']:
            user.username = data['username']
        
        # 2. Email
        if 'email' in data and data['email']:
            user.email = data['email']
        
        # 3. Password
        if 'password' in data and data['password']:
            user.password_hash = generate_password_hash(data['password'])
        
        # 4. Birthday
        if 'birthday' in data:
            user.birthday = data['birthday']
        
        # 5. Gender
        if 'gender' in data:
            user.gender = data['gender']
        
        # 6. Avatar
        if 'avatar' in data:
            user.avatar = data['avatar']
        
        
        # 7. Title
        if 'title' in data:
            user.title = data['title']
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to update: {str(e)}'}), 400
        
        if 'password' in data and data['password']:
            user.password_hash = generate_password_hash(data['password'])
            
        db.session.commit()
        
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'birthday': user.birthday or '01/01/2000',
        'gender': user.gender or 'Female',
        'avatar': user.avatar or '🦊',
        'title': user.title or 'Bronze Tracker',
        'created_at': user.created_at.isoformat() if user.created_at else None
    }), 200

@user_bp.route('/user', methods=['DELETE'])
def delete_account():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    db.session.delete(user)
    db.session.commit()
    session.clear()
    return jsonify({'message': 'Account deleted successfully'}), 200

