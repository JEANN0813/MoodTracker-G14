# backend/routes/__init__.py
from backend.routes.auth_routes import auth_bp
from backend.routes.user_routes import user_bp
from backend.routes.log_routes import log_bp
from backend.routes.chat_routes import chat_bp
from backend.routes.stats_routes import stats_bp
from backend.routes.alarm_routes import alarm_bp
from backend.routes.static_routes import static_bp

all_blueprints = [
    auth_bp,
    user_bp,
    log_bp,
    chat_bp,
    stats_bp,
    alarm_bp,
    static_bp,
]