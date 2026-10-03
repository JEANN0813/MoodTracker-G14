from datetime import datetime
from flask import Blueprint, request, jsonify

from backend.extensions import db
from backend.models import Alarm
from backend.utils import get_current_user

alarm_bp = Blueprint('alarms', __name__, url_prefix='/api')


_triggered_alarms = {}

# Alarm Routes

@alarm_bp.route('/alarms', methods=['GET', 'POST'])
def manage_alarms():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    if request.method == 'GET':
        alarms = Alarm.query.filter_by(user_id=user.id).all()
        return jsonify([alarm.to_dict() for alarm in alarms]), 200

    if request.method == 'POST':
        data = request.get_json() or {}
        time_str = data.get('time')
        title = data.get('title', 'Mood Reminder')
        repeat_days = ",".join(data.get('repeat_days', []))

        if not time_str:
            return jsonify({'error': 'Time is required'}), 400

        try:
            alarm_time = datetime.strptime(time_str, '%H:%M').time()
        except ValueError:
            return jsonify({'error': 'Invalid time format. Use HH:MM'}), 400

        alarm = Alarm(
            user_id=user.id,
            title=title,
            alarm_time=alarm_time,
            repeat_days=repeat_days,
            is_enabled=True
        )
        db.session.add(alarm)
        db.session.commit()

        return jsonify({'success': True, 'alarm': alarm.to_dict()}), 201

@alarm_bp.route('/alarms/<int:alarm_id>', methods=['DELETE', 'PUT'])
def handle_single_alarm(alarm_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    alarm = Alarm.query.filter_by(id=alarm_id, user_id=user.id).first()
    if not alarm:
        return jsonify({'error': 'Alarm not found'}), 404

    if request.method == 'DELETE':
        db.session.delete(alarm)
        db.session.commit()
        return jsonify({'message': 'Alarm deleted'}), 200

    if request.method == 'PUT':
        data = request.get_json() or {}
        alarm.is_enabled = data.get('is_enabled', alarm.is_enabled)
        db.session.commit()
        return jsonify({'success': True, 'alarm': alarm.to_dict()}), 200






def check_and_push_alarms():
    """
    This function checks for alarms that should be triggered at the current time.
    If an alarm is due, it adds it to the _triggered_alarms dictionary for the respective user. If the alarm is a one-time alarm (no repeat days), it disables the alarm after triggering.
    """
    from backend import get_app
    app = get_app()
    if app is None:
        return

    with app.app_context():
        now = datetime.now()
        current_weekday = str(now.isoweekday())

        enabled_alarms = Alarm.query.filter_by(is_enabled=True).all()

        for alarm in enabled_alarms:
            if (alarm.alarm_time.hour == now.hour
                    and alarm.alarm_time.minute == now.minute):
                repeat_list = alarm.repeat_days.split(',') if alarm.repeat_days else []
                if not repeat_list or current_weekday in repeat_list:
                    _triggered_alarms.setdefault(alarm.user_id, []).append(alarm.to_dict())
                    if not repeat_list:
                        alarm.is_enabled = False

        db.session.commit()

