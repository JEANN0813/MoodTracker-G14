# backend/__init__.py



from flask import Flask
from backend.config import Config
from backend.extensions import db, mail, cors, scheduler


_app = None


def create_app(config_class=Config):
    global _app

    app = Flask(
        __name__,
        static_folder='../static',
        static_url_path=''
    )
    app.config.from_object(config_class)

    
    db.init_app(app)
    mail.init_app(app)
    cors.init_app(app, supports_credentials=True)

    
    from backend.routes import all_blueprints
    for bp in all_blueprints:
        app.register_blueprint(bp)

    
    with app.app_context():
        db.create_all()

    _app = app

    from backend.routes.alarm_routes import check_and_push_alarms
    scheduler.add_job(
        func=check_and_push_alarms,
        trigger="interval",
        seconds=30
    )
    if not scheduler.running:
        scheduler.start()

    
    return app


def get_app():
    
    return _app