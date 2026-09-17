from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Alarm(db.Model):
    __tablename__ = 'alarms'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False) 
    title = db.Column(db.String(100), default="Alarm")
    
  
    alarm_time = db.Column(db.Time, nullable=False) 
    
   
    repeat_days = db.Column(db.String(20), default="") 
    
    is_enabled = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'alarm_time': self.alarm_time.strftime('%H:%M'),
            'repeat_days': [int(d) for d in self.repeat_days.split(',')] if self.repeat_days else [],
            'is_enabled': self.is_enabled
        }