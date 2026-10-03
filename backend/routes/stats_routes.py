from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from sqlalchemy import func

from backend.extensions import db
from backend.models import EmotionLog
from backend.utils import get_current_user

stats_bp = Blueprint('stats', __name__, url_prefix='/api')

@stats_bp.route('/stats', methods=['GET'])
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

@stats_bp.route('/analysis/frequency', methods=['GET'])
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

@stats_bp.route('/analysis/trend', methods=['GET'])
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

@stats_bp.route('/analysis/suggestions', methods=['GET'])
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
        suggestions.append(' You have been feeling down. Try talking to a friend.')
    if stats.get('Anxious', 0) > 3:
        suggestions.append(' You seem anxious. Try deep breathing exercises.')
    if happy_count > 5 and happy_count > sad_count:
        suggestions.append(' You are doing great! Keep up the positive energy!')
    if not suggestions:
        suggestions.append(' Keep logging your mood to get personalized suggestions!')
    
    suggestions.append(' Your feelings are valid. Take care of yourself today.')
    
    return jsonify({
        'suggestions': suggestions,
        'based_on_days': days
    }), 200



