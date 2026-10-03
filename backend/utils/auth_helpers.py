from flask import session
from backend.extensions import db
from backend.models import User

def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return None
    return db.session.get(User, user_id)