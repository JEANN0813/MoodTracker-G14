from flask import Blueprint, request, jsonify
from datetime import datetime, time
from models import db, Alarm

alarm_bp = Blueprint('alarm', __name__)


@alarm_bp.route('/api/alarms', methods=['POST'])
def create_alarm():
    data = request.get_json() or {}
    time_str = data.get('time') 
    
    if not time_str:
        return jsonify({'error': 'Time is required'}), 400
        
    try:
        hour, minute = map(int, time_str.split(':'))
        alarm_time = time(hour, minute)
    except ValueError:
        return jsonify({'error': 'Invalid time format, use HH:MM'}), 400

    repeat_days = data.get('repeat_days', []) 
    repeat_str = ",".join(map(str, sorted(repeat_days))) if repeat_days else ""

    new_alarm = Alarm(
        user_id=data.get('user_id', 1), 
        title=data.get('title', 'Alarm'),
        alarm_time=alarm_time,
        repeat_days=repeat_str,
        is_enabled=True
    )
    
    db.session.add(new_alarm)
    db.session.commit()
    return jsonify({'message': 'Alarm created', 'alarm': new_alarm.to_dict()}), 201


@alarm_bp.route('/api/alarms', methods=['GET'])
def get_alarms():
    user_id = request.args.get('user_id', 1)
    alarms = Alarm.query.filter_by(user_id=user_id).all()
    return jsonify([a.to_dict() for a in alarms]), 200


@alarm_bp.route('/api/alarms/<int:alarm_id>', methods=['PATCH'])
def update_alarm(alarm_id):
    alarm = Alarm.query.get_or_404(alarm_id)
    data = request.get_json() or {}

    if 'is_enabled' in data:
        alarm.is_enabled = bool(data['is_enabled'])
    if 'title' in data:
        alarm.title = data['title']
        
    db.session.commit()
    return jsonify({'message': 'Alarm updated', 'alarm': alarm.to_dict()}), 200


@alarm_bp.route('/api/alarms/<int:alarm_id>', methods=['DELETE'])
def delete_alarm(alarm_id):
    alarm = Alarm.query.get_or_404(alarm_id)
    db.session.delete(alarm)
    db.session.commit()
    return jsonify({'message': 'Alarm deleted'}), 200


@alarm_bp.route('/api/alarms/check', methods=['GET'])
def check_alarms():
    user_id = request.args.get('user_id', 1)
    now = datetime.now()
    
    current_hour = now.hour
    current_minute = now.minute
   
    current_weekday = str(now.isoweekday())

    
    enabled_alarms = Alarm.query.filter_by(user_id=user_id, is_enabled=True).all()
    triggered_alarms = []

    for alarm in enabled_alarms:
        
        if alarm.alarm_time.hour == current_hour and alarm.alarm_time.minute == current_minute:
            repeat_list = alarm.repeat_days.split(',') if alarm.repeat_days else []
            
            
            if not repeat_list or current_weekday in repeat_list:
                triggered_alarms.append(alarm.to_dict())
                
                
                if not repeat_list:
                    alarm.is_enabled = False

    db.session.commit()
    return jsonify({
        'triggered': len(triggered_alarms) > 0,
        'alarms': triggered_alarms
    }), 200