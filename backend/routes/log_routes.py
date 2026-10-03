from datetime import datetime
from flask import Blueprint, request, jsonify

from backend.extensions import db
from backend.models import EmotionLog
from backend.utils import get_current_user

log_bp = Blueprint('logs', __name__, url_prefix='/api')

# Logs Routes
@log_bp.route('/logs', methods=['POST'])
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

@log_bp.route('/logs', methods=['GET'])
def get_emotion_logs():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    logs = EmotionLog.query.filter_by(user_id=user.id).order_by(
        EmotionLog.log_date.desc(),
        EmotionLog.created_at.desc()
    ).all()
    
    return jsonify({'logs': [{'id': log.id, 'emotion': log.emotion, 'note': log.note, 'log_date': log.log_date.isoformat(), 'created_at': log.created_at.isoformat() if log.created_at else None} for log in logs]}), 200

@log_bp.route('/logs/<int:log_id>', methods=['PUT'])
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

@log_bp.route('/logs/<int:log_id>', methods=['DELETE'])
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




def send_message_with_retry(chat_session, message):
    return chat_session.send_message(message)


#calendar 
@log_bp.route('/calendar', methods=['GET'])
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
    ).order_by(EmotionLog.created_at.asc()).all()
    
    
    daily_logs = {}
    for log in logs:
        date_str = log.log_date.isoformat()
        if date_str not in daily_logs:
            daily_logs[date_str] = []
        daily_logs[date_str].append({
            'id': log.id,
            'emotion': log.emotion,
            'note': log.note,
            'created_at': log.created_at.isoformat() if log.created_at else None
        })
    
    
    daily_summary = {}
    for date_str, entries in daily_logs.items():
        counts = {}
        latest_timestamps = {}
        for entry in entries:
            emo = entry['emotion']
            counts[emo] = counts.get(emo, 0) + 1
            latest_timestamps[emo] = entry['created_at'] or ''
        
        
        dominant_emotion = sorted(
            counts.keys(), 
            key=lambda e: (counts[e], latest_timestamps[e]), 
            reverse=True
        )[0]
        
        daily_summary[date_str] = {
            'dominant_emotion': dominant_emotion,
            'total_count': len(entries),
            'entries': entries
        }
    
    return jsonify({'year': year, 'month': month, 'data': daily_summary}), 200

