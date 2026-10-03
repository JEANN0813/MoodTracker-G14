from datetime import datetime
from backend.extensions import db

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

    birthday = db.Column(db.String(20), nullable=True)    
    gender = db.Column(db.String(20), nullable=True)       
    avatar = db.Column(db.String(10), nullable=True)       
    title = db.Column(db.String(50), nullable=True)       
    
    
    emotion_logs = db.relationship('EmotionLog', backref='user', lazy=True, cascade='all, delete-orphan')

class EmotionLog(db.Model):
    __tablename__ = 'emotion_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    emotion = db.Column(db.String(30), nullable=False)
    note = db.Column(db.String(300))
    log_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class Alarm(db.Model):
    __tablename__ = 'alarms'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(100), default="Alarm")
    
   
    alarm_time = db.Column(db.Time, nullable=False) 
    
    
    repeat_days = db.Column(db.String(20), default="") 
    
    is_enabled = db.Column(db.Boolean, default=True)
    last_triggered_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'alarm_time': self.alarm_time.strftime('%H:%M'),
            'repeat_days': self.repeat_days.split(',') if self.repeat_days else [],
            'is_enabled': self.is_enabled
        }
